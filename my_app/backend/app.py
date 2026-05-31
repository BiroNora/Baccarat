import os
import traceback
import uuid
import logging
from functools import wraps
from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request, session
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta, timezone
from my_app.backend.bet_type import BetType
from my_app.backend.history import HistoryUnit
from my_app.backend.services.game_service import GameService
from sqlalchemy.exc import IntegrityError
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from my_app.backend.game import TOTAL_INITIAL_CARDS, Game
from my_app.backend.game_serializer import GameSerializer
from my_app.backend.phase_state import PhaseState

from sqlalchemy.ext.mutable import MutableDict, MutableList

load_dotenv()

MINIMUM_BET = 1

# =========================================================================
# FLASK APPLICATION BASICS
# =========================================================================
base_dir = os.path.dirname(os.path.abspath(__file__))
static_path = os.path.join(base_dir, "my_app", "react", "dist")

app = Flask(__name__, static_folder=static_path, template_folder=static_path)
app.config["SECRET_KEY"] = os.environ.get(
    "FLASK_SECRET_KEY", "default-dev-secret-key-NEVER-USE-IN-PROD"
)
# Session permanencia beállítása
# app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=31)  # Például 31 nap
# app.config["SESSION_COOKIE_SECURE"] = False

app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=31)
app.config["SESSION_COOKIE_SECURE"] = os.environ.get("VERCEL", "False") == "True"
app.config["SESSION_COOKIE_HTTPONLY"] = True

# =========================================================================
# DATABASE SETUP (NEON POSTGRES)
# =========================================================================
DATABASE_URL = os.environ.get(
    "DATABASE_URL_SIMPLE", "postgresql://player:pass@localhost:5433/baccarat_game"
)

app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# Logging finomhangolás
log = logging.getLogger("werkzeug")
log.setLevel(logging.ERROR)


# =========================================================================
# MODEL
# =========================================================================
class User(db.Model):
    __tablename__ = "my_baccarat"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id = db.Column(
        db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4())
    )
    tokens = db.Column(db.Integer, default=1000)
    current_game_state = db.Column(JSONB, nullable=True)
    history = db.Column(
        MutableList.as_mutable(JSONB), nullable=False, server_default="[]", default=list
    )
    roadmap_matrix = db.Column(
        MutableList.as_mutable(JSONB),
        nullable=False,
        server_default="[]",
        default=list,
    )
    last_coords = db.Column(
        MutableDict.as_mutable(JSONB), nullable=False, server_default="{}", default=dict
    )
    idempotency_key = db.Column(db.String(36), nullable=True)
    last_activity = db.Column(
        db.TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self):
        return f"<User {self.id[:8]} (Client: {self.client_id[:8]})>"


with app.app_context():
    db.create_all()


# =========================================================================
# AUTH DECORATORS
# =========================================================================
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = session.get("user_id")
        if not user_id:
            return (
                jsonify(
                    {
                        "error": "ERROR: Invalid user session.",
                        "game_state_hint": "INVALID_USER_SESSION",
                    }
                ),
                401,
            )

        user = db.session.get(User, user_id)
        if not user:
            session.pop("user_id", None)
            return (
                jsonify(
                    {
                        "error": "ERROR: Invalid user session.",
                        "game_state_hint": "INVALID_USER_SESSION",
                    }
                ),
                401,
            )

        user.last_activity = datetime.now(timezone.utc)

        return f(user=user, *args, **kwargs)

    return decorated_function


def with_game_state(f):
    @wraps(f)
    def decorated_function(user, *args, **kwargs):
        # 1. Alapvető ellenőrzés
        if not user.current_game_state:
            return (
                jsonify(
                    {
                        "error": "Game state not initialized.",
                        "game_state_hint": "MISSING_GAME_STATE",
                    }
                ),
                400,
            )

        # 2. IDEMPOTENCIA ELLENŐRZÉS
        # Megpróbáljuk kiszedni a kulcsot a JSON body-ból
        data = request.get_json(silent=True) or {}
        ikey = data.get("idempotency_key")

        # Deszerializálunk (szükség van rá az idempotens válaszhoz is)
        game = Game.deserialize(user.current_game_state)

        if ikey and user.idempotency_key == ikey:
            # Ha a kulcs egyezik, nem futtatjuk le a függvényt (f),
            # csak visszaadjuk az aktuális állapotot.
            return (
                jsonify(
                    {
                        "status": "success",
                        "idempotent": True,
                        "current_tokens": user.tokens,
                        "game_state": GameSerializer.serialize_by_context(
                            game, request.path
                        ),
                        "history": user.history,
                    }
                ),
                200,
            )

        # 3. A végpont végrehajtása
        kwargs["user"] = user
        kwargs["game"] = game

        response = f(*args, **kwargs)

        # 4. Automatikus mentés és Idempotencia kulcs frissítése
        status_code = 200
        if isinstance(response, tuple):
            status_code = response[1]
        elif hasattr(response, "status_code"):
            status_code = response.status_code

        if 200 <= status_code < 300:
            user.current_game_state = game.serialize()
            # Itt mentjük el az új kulcsot, hogy a következő azonos kérést már megfogjuk
            if ikey:
                user.idempotency_key = ikey
            db.session.commit()

        return response

    return decorated_function

def with_game_service(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Feltételezzük, hogy a 'game' már ott van a kwargs-ban
        # (amit az előző dekorátor betett)
        db_session = db.session
        service = GameService(db_session)

        # Hozzáadjuk a service-t a paraméterekhez
        kwargs["service"] = service

        return f(*args, **kwargs)
    return decorated_function


def api_error_handler(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)  # Meghívjuk az eredeti végpont függvényt

        except ValueError as e:
            # Specifikus hiba (pl. pakli üres, érvénytelen adat)
            db.session.rollback()
            game = kwargs.get("game")
            user = kwargs.get("user")

            response_data = {
                "status": "error",
                "message": str(e),
                "game_state_hint": "CLIENT_ERROR_SPECIFIC",
            }

            if game:
                # Hiba esetén is a kontextusnak megfelelő állapotot küldjük
                response_data["game_state"] = GameSerializer.serialize_by_context(
                    game, request.path
                )
            if user:
                response_data["current_tokens"] = user.tokens

            return jsonify(response_data), 400

        except Exception as e:
            db.session.rollback()
            print(f"Váratlan szerver hiba az API végponton: {e}")
            print("--- RÉSZLETES HIBAÜZENET ---")
            traceback.print_exc()
            print("----------------------------")
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "CRITICAL SERVER ERROR",
                        "game_state_hint": "SERVER_ERROR_GENERIC",
                    }
                ),
                500,
            )

    return decorated_function


@app.route("/")
def index():
    return render_template("index.html")


# =========================================================================
# GAME API ENDPOINTS
# =========================================================================
# 0
@app.route("/api/initialize_session", methods=["POST"])
@api_error_handler
def initialize_session():
    """
    Inicializálja a felhasználói sessiont a Postgres DB alapján.
    """
    data = request.get_json() or {}
    client_id_from_request = data.get("client_id")

    # JAVÍTÁS: Ha üres, null vagy a JS-ből érkező "undefined" string, generálunk egy újat
    if (
        not client_id_from_request
        or client_id_from_request == "undefined"
        or client_id_from_request == "null"
    ):
        client_id_from_request = str(uuid.uuid4())

    # 1. Felhasználó keresése (vagy a session-ből, vagy client_id alapján)
    user_id_in_session = session.get("user_id")
    user = None

    if user_id_in_session:
        user = db.session.get(User, user_id_in_session)

    if not user:
        # Ha a session-ben nincs meg, megkeressük client_id alapján
        user = User.query.filter_by(client_id=client_id_from_request).first()

    # 2. Új felhasználó létrehozása, ha még nem létezik
    if not user:
        try:
            # Létrehozunk egy alap játékállapotot az új usernek
            initial_game = Game()
            user = User(
                client_id=client_id_from_request,
                tokens=1000,
                current_game_state=initial_game.serialize(),
            )
            db.session.add(user)
            db.session.commit()
        except IntegrityError:
            # Ha közben valaki más létrehozta, visszagördítünk és lekérjük
            db.session.rollback()
            user = User.query.filter_by(client_id=client_id_from_request).one()

    # 3. Session és állapot frissítése
    session["user_id"] = user.id
    session.permanent = True

    # A last_activity-t a modell automatikusan frissíti az onupdate miatt,
    # de itt is beállíthatjuk.
    user.last_activity = datetime.now(timezone.utc)

    # 4. Játékállapot előkészítése
    if not user.current_game_state:
        game_instance = Game()
        user.current_game_state = game_instance.serialize()
    else:
        game_instance = Game.deserialize(user.current_game_state)

    game_instance.is_session_init = True

    actual_total = sum(
        value
        for key, value in game_instance.bets.items()
        if key != "TOTAL" and isinstance(value, (int, float))
    )

    game_instance.bets["TOTAL"] = actual_total

    if actual_total > 0:
        game_instance.pre_phase = PhaseState.SHUFFLING
    else:
        game_instance.pre_phase = PhaseState.NONE

    if user.tokens <= 0 and not game_instance.is_round_active:
        game_instance.target_phase = PhaseState.OUT_OF_TOKENS
    else:
        game_instance.target_phase = PhaseState.BETTING

    service = GameService(db.session)
    service.reset_game_data(user)

    user.current_game_state = game_instance.serialize()
    db.session.commit()

    custom_game_state = {
        "deck_len": TOTAL_INITIAL_CARDS,
        "bets": game_instance.bets,
        "target_phase": (
            game_instance.target_phase.value
            if hasattr(game_instance.target_phase, "value")
            else game_instance.target_phase
        ),
        "pre_phase": (
            game_instance.pre_phase.value
            if hasattr(game_instance.pre_phase, "value")
            else game_instance.pre_phase
        ),
    }

    return (
        jsonify(
            {
                "status": "success",
                "message": "User and game session initialized.",
                "client_id": user.client_id,
                "tokens": user.tokens,
                "game_state": custom_game_state,
                "history": [],
                "game_state_hint": "USER_SESSION_INITIALIZED",
                "total_initial_cards": TOTAL_INITIAL_CARDS,
            }
        ),
        200,
    )


# 1
@app.route("/api/bet", methods=["POST"])
@api_error_handler
@login_required
@with_game_state
def bet(user, game):
    data = request.get_json() or {}
    bet_amount = data.get("bet", 0)
    bet_type = data.get("type")

    hint = "BET_SUCCESSFULLY_PLACED"

    try:
        # 1. VALIDÁCIÓ: Tét összegének ellenőrzése
        if not isinstance(bet_amount, (int, float)) or bet_amount < MINIMUM_BET:
            hint = "INVALID_BET_AMOUNT"

        # 2. VALIDÁCIÓ: Van-e elég zseton
        elif user.tokens < bet_amount:
            hint = "INSUFFICIENT_TOKENS"

        # 3. VALIDÁCIÓ: Típus konverzió (mivel a frontendről már szám jön!)
        elif bet_type is None:
            hint = "MISSING_BET_TYPE"

        else:
            enum_type = BetType(int(bet_type))
            bet_type_name = enum_type.name  # pl. "PLAYER", "BANKER", "TIE"

            # Kivesszük az aktuális téteket a backend string kulcsaival
            current_player_bet = game.bets.get("PLAYER", 0)
            current_banker_bet = game.bets.get("BANKER", 0)

            # 4. VALIDÁCIÓ: Egymást kizáró tétek (PLAYER vs BANKER)
            if bet_type_name == "PLAYER" and current_banker_bet > 0:
                hint = "PLAYER_BET_BLOCKED_BY_BANKER"
            elif bet_type_name == "BANKER" and current_player_bet > 0:
                hint = "BANKER_BET_BLOCKED_BY_PLAYER"

            # HA MINDEN LÉPÉS SIKERES, CSAK AKKOR HAJTJUK VÉGRE A FOGADÁST
            else:
                game.set_bet(bet_amount, bet_type)
                user.tokens -= bet_amount

    except (ValueError, TypeError):
        hint = "INVALID_BET_TYPE"

    return (
        jsonify(
            {
                "status": "success",
                "current_tokens": user.tokens,
                "game_state": GameSerializer.serialize_by_context(game, request.path),
                "game_state_hint": hint,
            }
        ),
        200,
    )


# 2
@app.route("/api/retake_bet", methods=["POST"])
@api_error_handler
@login_required
@with_game_state
def retake_bet(user, game):
    data = request.get_json() or {}
    bet_type = data.get("type")

    hint = "NO_BET_TO_RETAKE"

    if bet_type is None:
        hint = "MISSING_BET_TYPE"
    else:
        try:
            enum_type = BetType(int(bet_type))
            bet_type_name = enum_type.name  # pl. "P_PAIR"

            bet_amount = game.bets.get(bet_type_name, 0)
            if bet_amount > 0:
                amount_to_return = game.clear_bet_by_type(bet_type)
                user.tokens += amount_to_return
                hint = "BET_SUCCESSFULLY_RETAKEN"

        except (ValueError, TypeError):
            hint = "INVALID_BET_TYPE"

    return (
        jsonify(
            {
                "status": "success",
                "current_tokens": user.tokens,
                "game_state": GameSerializer.serialize_by_context(game, request.path),
                "game_state_hint": hint,
            }
        ),
        200,
    )


# 3
@app.route("/api/create_deck", methods=["POST"])
@api_error_handler
@login_required
@with_game_state
def create_deck(user, game):
    game.create_deck()

    service = GameService(db.session)
    service.reset_game_data(user)

    return (
        jsonify(
            {
                "status": "success",
                "current_tokens": user.tokens,
                "game_state": GameSerializer.serialize_by_context(game, request.path),
                "game_state_hint": "DECK_CREATED",
            }
        ),
        200,
    )


# 4
@app.route("/api/shoe_cut", methods=["POST"])
@api_error_handler
@login_required
@with_game_state
def shoe_cut(user, game):
    data = request.get_json() or {}
    cut_index = data.get("cut")

    initial_cards = TOTAL_INITIAL_CARDS

    if not isinstance(cut_index, int):
        raise ValueError("Cut index must be an integer.")

    if not (2 <= cut_index <= initial_cards - 2):
        raise ValueError(f"Cut must be between 2 and {initial_cards - 2}.")

    game.shoe_cut(cut_index)

    return (
        jsonify(
            {
                "status": "success",
                "current_tokens": user.tokens,
                "game_state": GameSerializer.serialize_by_context(game, request.path),
                "game_state_hint": "DECK_SHIFTED",
            }
        ),
        200,
    )


# 4
@app.route("/api/start_game", methods=["POST"])
@api_error_handler
@login_required
@with_game_state
@with_game_service
def start_game(user, game, service):
    winner = game.initialize_new_round()

    service.play_round(user, game, winner)

    return (
        jsonify(
            {
                "status": "success",
                "message": "New round initialized.",
                "current_tokens": user.tokens,
                "game_state": GameSerializer.serialize_by_context(game, request.path),
                "history": user.history,
                "game_state_hint": "NEW_ROUND_INITIALIZED",
            }
        ),
        200,
    )


# 8
@app.route("/api/stand_and_rewards", methods=["POST"])
@api_error_handler
@login_required
@with_game_state
def stand_and_rewards(user, game):
    game.stand(False)
    token_change = game.rewards()
    user.tokens += token_change

    game_data = GameSerializer.serialize_by_context(game, request.path)

    if user.tokens <= 0:
        game_data["pre_phase"] = PhaseState.OUT_OF_TOKENS.value
    else:
        game_data["pre_phase"] = PhaseState.BETTING.value

    return (
        jsonify(
            {
                "status": "success",
                "message": "Rewards processed and tokens updated.",
                "current_tokens": user.tokens,
                "game_state": game_data,
                "game_state_hint": "REWARDS_PROCESSED",
            }
        ),
        200,
    )


# 16
@app.route("/api/set_restart", methods=["POST"])
@api_error_handler
@login_required
@with_game_state
def set_restart(user, game):
    game.restart_game()

    user.tokens = 1000

    return (
        jsonify(
            {
                "status": "success",
                "current_tokens": user.tokens,
                "game_state": GameSerializer.serialize_by_context(game, request.path),
                "game_state_hint": "HIT_RESTART",
            }
        ),
        200,
    )


# 17
@app.route("/api/force_restart", methods=["POST"])
@api_error_handler
@login_required
def force_restart_by_client_id(user):
    session.clear()
    session["user_id"] = user.id
    session.permanent = True

    old_game_data = user.current_game_state
    saved_bets = None

    if old_game_data and isinstance(old_game_data, dict):
        saved_bets = old_game_data.get("bets")

    # 2. ÚJRAINDÍTÁS: Tiszta lap a játékmenetnek
    game = Game()
    game.restart_game()

    # 3. VISSZAINJEKTÁLÁS: Mivel a Game TUD a betekről, visszaadjuk neki az értékeket,
    # így a belső állapota és a későbbi szerializáció is a megmentett tétekkel fog futni!
    if saved_bets is not None:
        game.bets = saved_bets  # Visszaadjuk a PLAYER, BANKER, TIE stb. értékeket

    # 4. MENTÉS: Az adatbázisba már a visszatöltött betekkel rendelkező állapot kerül
    user.current_game_state = game.serialize()
    user.idempotency_key = None

    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "current_tokens": user.tokens,
                "game_state": GameSerializer.serialize_by_context(game, request.path),
                "game_state_hint": "FORCE_RESTART_SUCCESSFUL",
            }
        ),
        200,
    )


# 18
@app.route("/api/recover_game_state", methods=["POST"])
@api_error_handler
@login_required
@with_game_state
def recover_game_state(user, game):
    game.is_session_init = False
    user.current_game_state = game.serialize()

    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Game state recovered.",
                "current_tokens": user.tokens,
                "game_state": GameSerializer.serialize_by_context(game, request.path),
                "game_state_hint": "RECOVERY_DATA_LOADED",
            }
        ),
        200,
    )


# 19
@app.route("/api/clear_game_state", methods=["POST"])
@api_error_handler
@login_required
@with_game_state
def clear_game_state(user, game):
    game.clear_game_state()

    # Idempotencia törlése, hogy az új kör tiszta lappal induljon
    user.idempotency_key = None

    return (
        jsonify(
            {
                "status": "success",
                "message": "Game state cleared.",
                "current_tokens": user.tokens,
                "game_state": GameSerializer.serialize_by_context(game, request.path),
                "game_state_hint": "GAME STATE CLEARED",
            }
        ),
        200,
    )


# 20
@app.route("/error_page", methods=["GET"])
def error_page():
    return render_template("error.html")
