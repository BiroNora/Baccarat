import json

from my_app.backend.winner_state import WinnerState
from my_app.backend.matrix_manager import MatrixManager

class MockUser:
    def __init__(self):
        # Feltételezzük, hogy a MatrixManager inicializálja a mátrixot, ha None
        self.roadmap_matrix = None
        self.last_coords = {}

class TestRunner:
    def __init__(self):
        self.manager = MatrixManager()
        self.mapping = {'B': WinnerState.BANKER_WON, 'P': WinnerState.PLAYER_WON, 'T': WinnerState.TIE}

    def run_scenario(self, name, sequence):
        user = MockUser()
        print(f"\n{'='*20} TESZT: {name} {'='*20}")

        for step in sequence:
            winner = self.mapping[step]
            self.manager.process_new_round(user, winner)
            print(f"Kör vége: {step}, Utolsó koordináta: {user.last_coords}")

        db_storage_simulation = json.dumps(user.roadmap_matrix)

        # 3. BETÖLTÉS: Itt szimuláljuk, hogy kiolvassuk a DB-ből
        # A JSON stringből újra listákból álló mátrixot csinálunk
        loaded_matrix = json.loads(db_storage_simulation)

        # Ellenőrizzük, hogy amit visszakaptunk, az ugyanaz-e
        print(f"\n--- Ellenőrzés: Mátrix DB-be mentve és betöltve ---")
        for i, row in enumerate(loaded_matrix):
            # Csak a nem nulla értékeket írjuk ki a könnyebb olvashatóságért
            print(f"Row {i}: {[x for x in row if x != 0]}")

        print(f"\n--- Végeredmény: {name} ---")
        for i, row in enumerate(user.roadmap_matrix):
            print(f"Row {i}: {[x for x in row if x != 0]}")

if __name__ == "__main__":
    runner = TestRunner()

    # 1. Teszteset: Több sárkány egymás után
    seq1 = (
        ['T'] * 1 +
        ['P'] * 1 +
        ['T'] * 1 +
        ['B'] * 1 +
        ['P'] * 2
    )
    runner.run_scenario("Komplex Szekvencia", seq1)
