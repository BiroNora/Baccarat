from my_app.backend.winner_state import WinnerState
from my_app.backend.matrix_manager import MatrixManager # A te kódod elérési útja

# Mock User osztály, hogy ne kelljen adatbázis
class MockUser:
    def __init__(self):
        self.roadmap_matrix = None
        self.last_coords = None

def run_test():
    manager = MatrixManager()
    user = MockUser()

    # Segédlista a szekvencia generálásához
    # B = BANKER_WON, P = PLAYER_WON
    sequence = (
        ['B'] * 2 +
        ['P'] * 8 +
        ['B'] * 7 +
        ['P'] * 6 +
        ['B'] * 9 +
        ['P'] * 10 +
        ['B'] * 1 +
        ['P'] * 4
    )

    # Leképezés a teszthez
    mapping = {'B': WinnerState.BANKER_WON, 'P': WinnerState.PLAYER_WON}

    print("--- Teszt indítása: Szekvencia feldolgozása ---")
    for step in sequence:
        winner = mapping[step]
        manager.process_new_round(user, winner)
        print(f"Kör vége: {step}, Utolsó koordináta: {user.last_coords}")

    print("\n--- Végeredmény: Mátrix (6 sor) ---")
    for i, row in enumerate(user.roadmap_matrix):
        print(f"Row {i}: {row}")

if __name__ == "__main__":
    run_test()
