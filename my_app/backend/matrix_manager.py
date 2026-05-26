from collections import defaultdict

from my_app.backend.history import HistoryUnit
from my_app.backend.winner_state import WinnerState


class MatrixManager:
    def __init__(self):
        pass

    def update_existing_matrix(self, matrix, row, col, winner_state):
        """
        Frissíti a meglévő mátrixot egyetlen új bejegyzéssel.
        """
        if winner_state in [WinnerState.NATURAL_PLAYER_WON, WinnerState.PLAYER_WON]:
            val = 1
        elif winner_state in [WinnerState.NATURAL_BANKER_WON, WinnerState.BANKER_WON]:
            val = 2
        elif winner_state in [WinnerState.NATURAL_TIE, WinnerState.TIE]:
            val = 3
        else:
            val = winner_state

        # Ha a mátrix kicsi lenne, dinamikusan bővíthető oszlopokkal
        if col >= len(matrix[0]):
            for r in range(6):
                matrix[r].extend([0] * (col - len(matrix[0]) + 1))

        matrix[row][col] = val
        return matrix

    def calculate_next_coords(self, matrix, last_coords, current_winner):
        """Kiszámolja a következő pozíciót a mátrix és last_coords alapján."""
        if not last_coords:
            return (0, 0)

        r, c = last_coords['r'], last_coords['c']
        last_w = last_coords['w']

        if current_winner == WinnerState.TIE:
            return (r, c)

        if current_winner != last_w:
            new_col = c + 1
            new_row = 0
            while new_col < len(matrix[0]) and matrix[0][new_col] != 0:
                new_col += 1
            return (new_row, new_col)
        else:
            if r + 1 < 6 and matrix[r + 1][c] == 0:
                return (r + 1, c)
            else:
                new_col = c + 1
                new_row = 0
                while new_col < len(matrix[0]) and matrix[0][new_col] != 0:
                    new_col += 1
                return (new_row, new_col)

    def process_new_round(self, user, winner_type):
        # 1. Betöltés (csak a lényeg)
        matrix = user.roadmap_matrix
        last_c = user.last_coords # pl. {"r": 1, "c": 3}

        # 2. Számolás
        new_r, new_c = self.calculate_next_coords(matrix, last_c, winner_type)

        self.update_existing_matrix(matrix, new_r, new_c, winner_type)

        # 4. Mentés
        user.roadmap_matrix = matrix
        last_w = winner_type if winner_type != WinnerState.TIE else last_c.get('w', winner_type)

        user.last_coords = {"r": new_r, "c": new_c, "w": last_w}

        return {"row": new_r, "col": new_c}
