import copy

from my_app.backend.winner_state import WinnerState

WINNER_MAP = {
    WinnerState.NATURAL_PLAYER_WON: 1, WinnerState.PLAYER_WON: 1,
    WinnerState.BANKER_WON: 2, WinnerState.NATURAL_BANKER_WON: 2,
    WinnerState.NATURAL_TIE: 3, WinnerState.TIE: 3
}


class MatrixManager:
    def __init__(self):
        pass

    def update_existing_matrix(self, matrix, row, col, winner_state):
        """
        Frissíti a meglévő mátrixot egyetlen új bejegyzéssel.
        """
        val = WINNER_MAP.get(winner_state, winner_state)

        if not matrix or len(matrix) == 0:
            # Létrehozunk egy 6 soros mátrixot, oszlopokat majd az oszlop-bővítés kezeli
            matrix = [[0] for _ in range(6)]

        for r in range(6):
            while len(matrix[r]) <= col:
                matrix[r].append(0)

        matrix[row][col] = val

        return matrix

    def calculate_next_coords(self, matrix, last_coords, current_winner):
        """Kiszámolja a következő pozíciót a mátrix és last_coords alapján."""
        # Első tie(ok) kezelése
        if last_coords and last_coords['r'] == 0 and last_coords['c'] == 0 and last_coords['w'] in [3, 6]:
            return last_coords['r'], last_coords['c']

        # TIE kezelése
        if current_winner in [3, 6]:
            if last_coords:
                return last_coords['r'], last_coords['c']
            else:
                return 0, 0

        if not last_coords:
            return 0, 0

        r, c = last_coords['r'], last_coords['c']
        curr_val = WINNER_MAP.get(current_winner, current_winner)
        last_val = WINNER_MAP.get(last_coords['w'], last_coords['w'])
        prev_val = WINNER_MAP.get(last_coords['prev_w'], last_coords['prev_w'])

        # Ha az utolsó győztes TIE volt, akkor a prev_val-hoz hasonlítunk.
        compare_val = prev_val if last_val in [3, 6] else last_val

        if curr_val!= compare_val :
            new_col = None

            for col in range(c, -1, -1):
                if matrix[0][col] != 0:
                    new_col = col + 1
                    break

            if new_col is None:
                new_col = c + 1
                while new_col < len(matrix[0]) and matrix[0][new_col] != 0:
                    new_col += 1

            return (0, new_col)
        else:
            if r + 1 < 6 and matrix[r + 1][c] == 0:
                return (r + 1, c)
            else:
                new_col = c + 1
                new_row = r
                return (new_row, new_col)

    def process_new_round(self, user, winner_type):
        # 1. Betöltés
        matrix = copy.deepcopy(user.roadmap_matrix) if (user.roadmap_matrix and len(user.roadmap_matrix) > 0) else [[0] for _ in range(6)]
        last_c = user.last_coords or {} # pl. {"r": 1, "c": 3}
        curr_w = last_c.get("w")
        prev_w = curr_w if curr_w not in [WinnerState.TIE, WinnerState.NATURAL_TIE] else user.last_coords.get("prev_w")

        norm_winner = WINNER_MAP.get(winner_type, winner_type)

        if winner_type in [WinnerState.TIE, WinnerState.NATURAL_TIE]:
            return {"row": last_c.get('r') if last_c else None, "col": last_c.get('c') if last_c else None}

        # 2. Számolás
        coords = self.calculate_next_coords(matrix, last_c, winner_type)
        if coords is None:
            return {"row": 0, "col": 0}

        new_r, new_c = coords
        updated_matrix = self.update_existing_matrix(matrix, new_r, new_c, winner_type)

        # 4. Mentés
        user.roadmap_matrix = updated_matrix
        user.last_coords = {"r": new_r, "c": new_c, "w": norm_winner, "prev_w": prev_w}

        for i, row in enumerate(matrix):
            print(f"Row {i}: {row}")

        return {"row": new_r, "col": new_c}
