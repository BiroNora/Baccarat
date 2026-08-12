import re

from sqlalchemy import or_

from my_app.backend.app import User
from my_app.backend.game import Game
from werkzeug.security import generate_password_hash, check_password_hash

class UserService:
    def __init__(self, db_session):
        self.db = db_session

    def handle_user_auth(
        self, email, username, password, is_login, current_user_id=None
    ):
        """
        Kezeli a felhasználó bejelentkezését vagy regisztrációját.
        """
        if is_login:
            # --- BEJELENTKEZÉS ---
            user = (
                self.db.query(User)
                .filter(or_(User.email == email, User.user_name == username))
                .first()
            )

            if not user or not check_password_hash(user.password_hash, password):
                raise ValueError("IC") # Invalid Credentials

            user.is_guest = False
            self.db.commit()

            return user

        else:
            # --- REGISZTRÁCIÓ ---
            if not username or not re.match(r"^[a-zA-Z0-9_]{3,30}$", username):
                raise ValueError("IU") # Invalid Username format

            existing_user = (
                self.db.query(User)
                .filter(or_(User.email == email, User.user_name == username))
                .first()
            )

            if existing_user:
                raise ValueError("UAE") # User Already Exists

            user = None
            if current_user_id:
                user = self.db.query(User).get(current_user_id)

            if user:
                # HA VAN MÁR SESSION: Frissítjük a meglévő vendég fiókot (megtartva a tokeneket és a játékállapotot!)
                user.email = email
                user.user_name = username
                user.password_hash = generate_password_hash(password)
                user.is_guest = False
            else:
                user = User(
                    email=email,
                    user_name = username,
                    password_hash=generate_password_hash(password),
                    is_guest=False,
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

        return self.db.query(User).filter_by(id=user_id).first()

    def update_password(self, user, password: str):
        user.password_hash = generate_password_hash(password)
        self.db.commit()
