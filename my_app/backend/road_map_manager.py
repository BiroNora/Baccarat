from my_app.backend.road_map_unit import RoadMapUnit

class RoadMapManager:
    """
    Kizárólag a Roadmap építésével foglalkozó osztály.
    """
    def __init__(self):
        self.occupied_cells = {}
        self.roadmap_dict = {}  # Itt RoadMapUnit objektumokat tárolunk

    def build_roadmap(self, history_list):
        if not history_list:
            return {}

        self.roadmap_dict = {}
        self.occupied_cells = {}

        current_col = 0
        current_row = 0

        def get_base_winner(winner_value):
            if winner_value in [1, 2]: return 0
            if winner_value in [3, 4]: return 1
            return 2

        # Első nem-döntetlen megkeresése
        first_valid_winner = next((get_base_winner(item['winner']) for item in history_list
                                  if get_base_winner(item['winner']) != 2), 2)
        last_real_winner = first_valid_winner

        # Első elem elhelyezése
        first_item = history_list[0]
        first_w = get_base_winner(first_item['winner'])

        matrix_key = f"{current_row}-{current_col}"
        self.roadmap_dict[matrix_key] = RoadMapUnit(
            winner=first_w,
            is_natural=first_item.get("is_natural", False),
            is_dragon=first_item.get("is_dragon", False),
            is_panda=first_item.get("is_panda", False),
            tie_count=1 if first_w == 2 else 0,
            is_b_pair=first_item.get("is_b_pair", False),
            is_p_pair=first_item.get("is_p_pair", False)
        )
        self.occupied_cells[(current_row, current_col)] = True

        # Ciklus a többi körre
        for item in history_list[1:]:
            current_w = get_base_winner(item['winner'])

            # Döntetlen kezelése
            if current_w == 2:
                current_key = f"{current_row}-{current_col}"
                if current_key in self.roadmap_dict:
                    unit = self.roadmap_dict[current_key]
                    unit.t += 1
                    if item.get("is_b_pair"): unit.bp = True
                    if item.get("is_p_pair"): unit.pp = True
                continue

            # Váltás
            if last_real_winner != 2 and current_w != last_real_winner:
                new_col = 0
                while (0, new_col) in self.occupied_cells:
                    new_col += 1
                current_col, current_row = new_col, 0
                last_real_winner = current_w

            # Széria folytatása vagy sárkányfarok
            else:
                if last_real_winner == 2:
                    last_real_winner = current_w
                else:
                    next_row, next_col = current_row + 1, current_col
                    if next_row >= 6 or (next_row, next_col) in self.occupied_cells:
                        next_row, next_col = current_row, current_col + 1
                        while (next_row, next_col) in self.occupied_cells:
                            next_col += 1
                    current_row, current_col = next_row, next_col

            # Új egység létrehozása és mentése
            matrix_key = f"{current_row}-{current_col}"
            self.roadmap_dict[matrix_key] = RoadMapUnit(
                winner=current_w,
                is_natural=item.get("is_natural", False),
                is_dragon=item.get("is_dragon", False),
                is_panda=item.get("is_panda", False),
                is_b_pair=item.get("is_b_pair", False),
                is_p_pair=item.get("is_p_pair", False)
            )
            self.occupied_cells[(current_row, current_col)] = True

        return {k: unit.to_frontend_dict() for k, unit in self.roadmap_dict.items()}
