from my_app.backend.app import User
from my_app.backend.game import Game
from werkzeug.security import generate_password_hash, check_password_hash

class UserService:
    def __init__(self, db_session):
        self.db = db_session

    def handle_user_auth(self, username, password, is_login, current_user_id=None):
        """
        Kezeli a felhasználó bejelentkezését vagy regisztrációját.
        Visszaadja a User objektumot, vagy ValueError-t dob hiba esetén.
        """
        if is_login:
            # --- BEJELENTKEZÉS ---
            user = self.db.query(User).filter_by(username=username).first()

            if not user or not check_password_hash(user.password_hash, password):
                # INVALID_CREDENTIALS = IC
                raise ValueError("IC")

            user.is_guest = False
            self.db.commit()

            return user

        else:
            # --- REGISZTRÁCIÓ ---
            existing_user = self.db.query(User).filter_by(username=username).first()

            if existing_user:
                # USERNAME_ALREADY_EXISTS = UAE
                raise ValueError("UAE")

            user = None
            if current_user_id:
                user = self.db.query(User).get(current_user_id)

            if user:
                # HA VAN MÁR SESSION: Frissítjük a meglévő vendég fiókot (megtartva a tokeneket és a játékállapotot!)
                user.username = username
                user.password_hash = generate_password_hash(password)
                user.is_guest = False
            else:
                user = User(
                    username=username,
                    password_hash=generate_password_hash(password),
                    is_guest=False
                )

                initial_game = Game()
                user.current_game_state = initial_game

                self.db.add(user)
                self.db.add(initial_game)

            self.db.commit()

            return user

    def handle_check_session(self, session, request):
        """
        Ellenőrzi a session vagy süti alapján, hogy van-e aktív felhasználó.
        """
        user_id = session.get("user_id") or request.cookies.get("user_id")

        if not user_id:
            print("68 NO USER!!!!!")
            return None

        user = self.db.query(User).filter_by(id=user_id).first()

        return user
