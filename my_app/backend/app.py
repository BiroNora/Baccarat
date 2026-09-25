from sqlalchemy import or_
import os
import traceback
import uuid
import logging
from functools import wraps
from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request, session
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from itsdangerous import URLSafeTimedSerializer
from datetime import datetime, timedelta, timezone
from my_app.backend.bet_type import BetType
from my_app.backend.models import db, User
from my_app.backend.services.game_service import GameService
from my_app.backend.services.user_service import UserService
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm.attributes import flag_modified

from my_app.backend.game import TOTAL_INITIAL_CARDS, Game
from my_app.backend.game_serializer import GameSerializer
from my_app.backend.phase_state import PhaseState

load_dotenv()

MINIMUM_BET = 1
INITIAL_TOKENS = 1000

# =========================================================================
# FLASK APPLICATION BASICS
# =========================================================================
base_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(base_dir, "..", ".."))
static_path = os.path.join(project_root, "my_app", "react", "dist")

if os.path.exists(static_path):
    app = Flask(__name__, static_folder=static_path, template_folder=static_path)
else:
    app = Flask(__name__)  # Helyi fejlesztéshez, ha nincs még buildelve a React
app.config["SECRET_KEY"] = os.environ.get(
    "FLASK_SECRET_KEY", "default-dev-secret-key-NEVER-USE-IN-PROD"
)
# Session permanencia beállítása
# app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=31)  # Például 31 nap
# app.config["SESSION_COOKIE_SECURE"] = False

app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=31)
app.config["SESSION_COOKIE_SECURE"] = os.environ.get("VERCEL", "False") == "True"
app.config["SESSION_COOKIE_HTTPONLY"] = True

# Flask limiter inicializálás
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=[
        "200 per day",
        "50 per hour",
    ],  # Alapértelmezett korlátok az egész appra
    storage_uri="memory://",  # Memóriában tárolja a számlálót
)

# =========================================================================
# DATABASE SETUP (NEON POSTGRES)
# =========================================================================
DATABASE_URL = os.environ.get(
    "DATABASE_URL_SIMPLE", "postgresql://player:pass@localhost:5433/baccarat_game"
)

app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

# Logging finomhangolás
log = logging.getLogger("werkzeug")
log.setLevel(logging.ERROR)

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


def with_user_service(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        db_session = db.session
        service = UserService(db_session)

        # Hozzáadjuk a user_service-t a paraméterekhez
        kwargs["user_service"] = service

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
# 0/1
@app.route("/api/initialize_session", methods=["POST"])
@api_error_handler
def initialize_session():
    """
    Inicializálja a felhasználói sessiont a Postgres DB alapján.
    """
    data = request.get_json() or {}
    client_id_from_request = data.get("client_id")
    skip_auth = data.get("skip_auth", False)

    # Ha üres, null vagy a JS-ből érkező "undefined" string, generálunk egy újat
    if (
        not client_id_from_request
        or client_id_from_request == "undefined"
        or client_id_from_request == "null"
    ):
        client_id_from_request = str(uuid.uuid4())

    # 1. Felhasználó keresése (vagy a session-ből, vagy client_id alapján)
    user_id_in_session = session.get("user_id")
    user = None
    is_brand_new_user = False

    if user_id_in_session:
        user = db.session.get(User, user_id_in_session)

    if not user:
        # Ha a session-ben nincs meg, megkeressük client_id alapján
        user = User.query.filter_by(client_id=client_id_from_request).first()

    # 2. Új felhasználó létrehozása, ha még nem létezik
    if not user:
        is_brand_new_user = True
        try:
            # Létrehozunk egy alap játékállapotot az új usernek
            initial_game = Game()
            user = User(
                client_id=client_id_from_request,
                tokens=INITIAL_TOKENS,
                current_game_state=initial_game.serialize(),
            )
            db.session.add(user)
            db.session.commit()
        except IntegrityError:
            # Ha közben valaki más létrehozta, visszagördítünk és lekérjük
            db.session.rollback()
            user = User.query.filter_by(client_id=client_id_from_request).one()
            is_brand_new_user = False

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

    if not is_brand_new_user or skip_auth:
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
    else:
        # VADIÚJ látogató, és nem skip_auth: LOADING fázis
        game_instance.target_phase = PhaseState.LOADING
        game_instance.pre_phase = PhaseState.NONE

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


# 0/2
@app.route("/api/check_session", methods=["POST"])
@api_error_handler
@with_user_service
def check_session(user_service):
    user = user_service.handle_check_session(session, request)

    if not user:
        return (
            jsonify(
                {
                    "status": "not_logged_in",
                    "game_state": {"target_phase": PhaseState.LOADING.value},
                }
            ),
            200,
        )

    raw_game = getattr(user, "current_game_state")
    game = Game.deserialize(raw_game) if isinstance(raw_game, (dict, str)) else raw_game

    return (
        jsonify(
            {
                "status": "success",
                "game_state": GameSerializer.serialize_by_context(game, request.path),
                "history": user.history,
                "current_tokens": user.tokens,
                "is_guest": user.is_guest,
                "username": user.user_name,
            }
        ),
        200,
    )


# 0/3
@app.route("/api/handle_auth", methods=["POST"])
@api_error_handler
@with_user_service
@with_game_service
def handle_auth(user_service, service):
    data = request.get_json()
    email = data.get("email")
    username = data.get("username")
    password = data.get("password")
    is_login = data.get("is_login")

    current_user_id = session.get("user_id")

    guest_user = (
        user_service.db.query(User).get(current_user_id) if current_user_id else None
    )

    try:
        user = user_service.handle_user_auth(
            email, username, password, is_login, current_user_id
        )
    except ValueError as e:
        error_code = str(e)
        print("456 error_code: ", error_code)
        if error_code == "CONFLICT":
            target_user = (
                user_service.db.query(User)
                .filter(or_(User.email == email, User.user_name == username))
                .first()
            )

            # --- Mentett adatok (tokenek + tétek) ---
            target_tokens = 0
            if target_user:  # régi adat
                session["pending_target_user_id"] = target_user.id
                t_base = target_user.tokens or 0
                t_bets = 0
                if target_user.current_game_state:
                    raw_t_game = target_user.current_game_state
                    t_game = (
                        Game.deserialize(raw_t_game)
                        if isinstance(raw_t_game, (dict, str))
                        else raw_t_game
                    )
                    if hasattr(t_game, "bets") and t_game.bets:
                        t_bets = (
                            t_game.bets.get("TOTAL", 0)
                            if isinstance(t_game.bets, dict)
                            else getattr(t_game.bets, "TOTAL", 0)
                        )
                target_tokens = t_base + t_bets

            # --- Vendég felhasználó teljes tokenjeinek számítása (tokenek + tétek) ---
            serialized_game = None
            guest_tokens = 0
            if guest_user:
                g_base = guest_user.tokens or 0
                g_bets = 0
                if guest_user.current_game_state:
                    raw_game = guest_user.current_game_state
                    game = (
                        Game.deserialize(raw_game)
                        if isinstance(raw_game, (dict, str))
                        else raw_game
                    )

                    if hasattr(game, "bets") and game.bets:
                        g_bets = (
                            game.bets.get("TOTAL", 0)
                            if isinstance(game.bets, dict)
                            else getattr(game.bets, "TOTAL", 0)
                        )

                guest_tokens = g_base + g_bets
                # Fázisok beállítása a konfliktushoz és a későbbi visszatéréshez
                game.target_phase = PhaseState.CONFLICT

                guest_user.current_game_state = game.serialize()
                user_service.db.commit()

                serialized_game = GameSerializer.serialize_by_context(
                    game, request.path
                )

            return (
                jsonify(
                    {
                        "status": error_code,
                        "game_state": serialized_game,
                        "conflict_data": {
                            "existing_user": {
                                "balance": target_tokens,
                            },
                            "current_session": {
                                "balance": guest_tokens,
                            },
                        },
                    }
                ),
                200,
            )

        return jsonify({"status": error_code}), 200

    session["user_id"] = user.id

    raw_game = getattr(user, "current_game_state", None)
    if raw_game:
        game = (
            Game.deserialize(raw_game)
            if isinstance(raw_game, (dict, str))
            else raw_game
        )
    else:
        # Biztonsági fallback, ha valamiért üres lenne
        game = Game()
        user.current_game_state = game.serialize()

    game.target_phase = PhaseState.BETTING
    user.current_game_state = game.serialize()
    user_service.db.commit()

    return (
        jsonify(
            {
                "status": "success",
                "game_state": GameSerializer.serialize_by_context(game, request.path),
                "history": user.history,
                "current_tokens": user.tokens,
                "is_guest": guest_user.is_guest if guest_user else True,
                "username": user.user_name,
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

    if bet_type is None:
        return jsonify({"status": "error"}), 400

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

            current_player_bet = game.bets.get("PLAYER", 0)
            current_banker_bet = game.bets.get("BANKER", 0)

            # 4. VALIDÁCIÓ: Egymást kizáró tétek (PLAYER vs BANKER)
            if bet_type_name == "PLAYER" and current_banker_bet > 0:
                hint = "PLAYER_BET_BLOCKED_BY_BANKER"
            elif bet_type_name == "BANKER" and current_player_bet > 0:
                hint = "BANKER_BET_BLOCKED_BY_PLAYER"
            # 5. VALIDÁCIÓ: Mellékfogadás ellenőrzése (fő tét mellett)
            elif bet_type_name not in ["PLAYER", "BANKER"] and (
                current_player_bet == 0 and current_banker_bet == 0
            ):
                hint = "MAIN_BET_REQUIRED"
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
                "is_guest": user.is_guest if user else True,
                "username": user.user_name,
                "game_state": GameSerializer.serialize_by_context(game, request.path),
                "history": user.history,
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

    if bet_type is None:
        return jsonify({"status": "error"}), 400
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
                "is_guest": user.is_guest if user else True,
                "username": user.user_name,
                "game_state": GameSerializer.serialize_by_context(game, request.path),
                "history": user.history,
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
                "is_guest": user.is_guest,
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


# 5
@app.route("/api/start_game", methods=["POST"])
@api_error_handler
@login_required
@with_game_state
@with_game_service
def start_game(user, game, service):
    current_player_bet = game.bets.get("PLAYER", 0)
    current_banker_bet = game.bets.get("BANKER", 0)

    # VALIDÁCIÓ: Főtét ellenőrzése
    if current_player_bet == 0 and current_banker_bet == 0:
        return (
            jsonify({"status": "error", "game_state_hint": "MAIN_BET_REQUIRED"}),
            400,
        )

    winner = game.initialize_new_round()
    service.play_round(user, game, winner)

    game_data = GameSerializer.serialize_by_context(game, request.path)

    if user.tokens <= 0 and game_data["bets"].get("TOTAL", 0) == 0:
        service.reset_game_data(user)
        game_data["final_phase"] = PhaseState.OUT_OF_TOKENS.value
    else:
        game_data["final_phase"] = PhaseState.BETTING.value

    return (
        jsonify(
            {
                "status": "success",
                "message": "New round initialized.",
                "current_tokens": user.tokens,
                "is_guest": user.is_guest,
                "game_state": game_data,
                "history": user.history,
                "game_state_hint": "NEW_ROUND_INITIALIZED",
            }
        ),
        200,
    )


# 6
@app.route("/api/set_restart", methods=["POST"])
@api_error_handler
@login_required
@with_game_state
def set_restart(user, game):
    game.restart_game()

    user.tokens = INITIAL_TOKENS

    return (
        jsonify(
            {
                "status": "success",
                "current_tokens": user.tokens,
                "is_guest": user.is_guest,
                "game_state": GameSerializer.serialize_by_context(game, request.path),
                "game_state_hint": "HIT_RESTART",
            }
        ),
        200,
    )


# 7
@app.route("/api/force_restart", methods=["POST"])
@api_error_handler
@login_required
def force_restart_by_client_id(user):
    session.clear()
    session["user_id"] = user.id
    session.permanent = True

    game = (
        Game.deserialize(user.current_game_state) if user.current_game_state else None
    )

    return (
        jsonify(
            {
                "status": "success",
                "current_tokens": user.tokens,
                "is_guest": user.is_guest,
                "game_state": GameSerializer.serialize_by_context(game, request.path),
                "history": user.history,
                "game_state_hint": "FORCE_RESTART_SUCCESSFUL",
            }
        ),
        200,
    )


# 8
@app.route("/api/forgot_password", methods=["POST"])
@limiter.limit("5 per minute")
@api_error_handler
@with_user_service
@with_game_service
def forgot_password(user_service, service):
    data = request.get_json()
    identifier = data.get("identifier")

    user = user_service.get_user_by_identifier(identifier)

    raw_game = getattr(user, "current_game_state", None)

    has_game_state = raw_game is not None and raw_game != {}
    if isinstance(raw_game, dict):
        game = Game.deserialize(raw_game)
    else:
        game = Game()

    if not has_game_state:
        game.clear_up()
        game.deck = [None] * TOTAL_INITIAL_CARDS
        user.current_game_state = game.serialize()
        flag_modified(user, "current_game_state")

    db.session.commit()

    try:
        serializer = URLSafeTimedSerializer(app.config["SECRET_KEY"])
        token = serializer.dumps(identifier, salt="password-reset-salt")
    except:
        return jsonify({"status": "IC"}), 200
    return (
        jsonify(
            {
                "status": "success",
                "current_tokens": INITIAL_TOKENS,
                "is_guest": user.is_guest,
                "game_state": {
                    "target_phase": "FORGOT_PASSWORD",
                    "deck_len": game.get_deck_len(),
                },
                "token": token,
            }
        ),
        200,
    )


# 9
@app.route("/api/reset_password/<token>", methods=["POST"])
@api_error_handler
@with_user_service
def reset_password(token, user_service):
    serializer = URLSafeTimedSerializer(app.config["SECRET_KEY"])
    try:
        # A token 5 percig (300 másodpercig) érvényes
        identifier = serializer.loads(token, salt="password-reset-salt", max_age=300)
    except Exception:
        return jsonify({"error": "The link is invalid or has expired."}), 400

    data = request.get_json()
    new_password = data.get("password")

    if not new_password:
        return jsonify({"status": "IC"}), 200

    user = user_service.get_user_by_identifier(identifier)

    if not user:
        return jsonify({"status": "IC"}), 200

    user_service.update_password(user, new_password)

    return jsonify({"status": "success"}), 200


# 10
@app.route("/api/handle_conflict", methods=["POST"])
@api_error_handler
@with_user_service
def handle_conflict(user_service):
    data = request.get_json()
    version_new = data.get("version_new")

    current_user_id = session.get("user_id")
    target_user_id = session.pop("pending_target_user_id", None)  # régi adat

    if not target_user_id:
        return jsonify({"status": "EXPIRED"}), 200

    try:
        user = user_service.handle_conflict(
            current_user_id, target_user_id, version_new
        )
    except ValueError as e:
        return jsonify({"status": str(e)}), 200

    # Frissítjük a sessiont a végleges célfiók ID-jára
    session["user_id"] = user.id

    raw_game = getattr(user, "current_game_state", None)
    if raw_game:
        game = (
            Game.deserialize(raw_game)
            if isinstance(raw_game, (dict, str))
            else raw_game
        )
    else:
        game = Game()
        user.current_game_state = game.serialize()
        user_service.db.commit()

    return (
        jsonify(
            {
                "status": "success",
                "game_state": GameSerializer.serialize_by_context(game, request.path),
                "current_tokens": user.tokens,
                "is_guest": user.is_guest,
                "username": user.user_name,
            }
        ),
        200,
    )


# 11 dedicated cron
@app.route("/api/cron/cleanup-guests", methods=["GET"])
@with_user_service
def cron_cleanup_guests(user_service):
    # Vercel Cron biztonsági ellenőrzés
    auth_header = request.headers.get("Authorization")
    cron_secret = os.environ.get("CRON_SECRET")

    if not cron_secret or auth_header != f"Bearer {cron_secret}":
        return jsonify({"error": "Unauthorized"}), 401

    try:
        deleted_count = user_service.delete_old_guests()
        return (
            jsonify(
                {
                    "status": "success",
                    "message": f"Successfully deleted {deleted_count} old guest accounts.",
                }
            ),
            200,
        )
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# 12
@app.route("/api/update_username", methods=["POST"])
@api_error_handler
@with_user_service
def update_username(user_service):
    data = request.get_json()
    new_username = data.get("username")
    current_user_id = session.get("user_id")

    if not current_user_id:
        return jsonify({"status": "IC"}), 200

    user = user_service.db.query(User).get(current_user_id)
    if not user:
        return jsonify({"status": "IC"}), 200

    updated_user = user_service.update_username(user, new_username)
    if not updated_user:
        return jsonify({"status": "IC"}), 200

    raw_game = getattr(user, "current_game_state", None)
    if raw_game:
        game = (
            Game.deserialize(raw_game)
            if isinstance(raw_game, (dict, str))
            else raw_game
        )
    else:
        game = Game()
        user.current_game_state = game.serialize()
        user_service.db.commit()

    return (
        jsonify(
            {
                "status": "success",
                "game_state": GameSerializer.serialize_by_context(game, request.path),
                "current_tokens": user.tokens,
                "is_guest": user.is_guest,
                "username": user.user_name,
            }
        ),
        200,
    )
