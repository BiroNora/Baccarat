from my_app.backend.matrix_manager import MatrixManager
from my_app.backend.history import HistoryUnit

class GameService:
    def __init__(self, db_session):
        self.db = db_session
        self.matrix_manager = MatrixManager()

    def play_round(self, user, game):
        # 1. Játéklogika, csak a kártyákkal foglalkozik
        game.initialize_new_round()

        # 2. Mátrix frissítése: a manager elvégzi a "piszkos munkát"
        # Mivel a MatrixManager csak a mátrixot és a nyertest látja, ez tiszta marad
        coords = self.matrix_manager.process_new_round(user, game.winner)
        coord_str = f"{coords['row']}:{coords['col']}"

        # 3. History felépítése: az API helyett itt történik a koordináták hozzáadása
        res = game.round_result
        unit = HistoryUnit(
            coord=coord_str,
            winner=res.get("winner"),
            is_natural=res.get("is_natural", False),
            is_dragon=res.get("is_dragon", False),
            is_panda=res.get("is_panda", False),
            tie_count=res.get("tie_count", 0),
            is_b_pair=res.get("is_b_pair", False),
            is_p_pair=res.get("is_p_pair", False),
        )
        print("srevice 28 historyUnit: ", unit)
        user.history[str(len(user.history))] = unit.to_frontend_dict()

        # 4. Véglegesítés: itt mentjük el a változásokat
        self.db.session.add(user) # A user frissült a mátrixszal és history-val
        self.db.session.commit()
        return user, game

    def reset_game_data(self, user):
        """
        Teljesen lenullázza a játékhoz kapcsolódó user-adatokat
        újraindulás vagy keverés esetén.
        """
        user.history = []
        user.roadmap_matrix = {}
        user.last_coords = {}
