import unittest
from my_app.backend.game import Game
from my_app.backend.winner_state import WinnerState
from my_app.backend.phase_state import PhaseState
from my_app.backend.bet_type import BetType

class TestBaccaratStandardOutcomes(unittest.TestCase):

    def setUp(self):
        """Minden teszt előtt futó alapbeállítás."""
        self.game = Game()
        self.game.clear_up()

    # 1A
    def test_standard_player_stands_banker_draws_and_wins1A(self):
        """Teszt: Nincs Natural. Player megáll 6 ponton. Banker 5 pontról húz egy 3-ast.
        Banker nyer (8 vs 6) -> Sima győzelem, 2x kifizetés."""
        # Player: ♥4 + ♣2 = 6 (Stand!) | Banker: ♦3 + ♠2 = 5
        # Mivel Player nem húzott, Banker 5 pontra kötelezően HÚZ.
        # 5. lap (Banker 3. lapja): ♦3 (Új Banker sum: 5 + 3 = 8)
        self.game.deck = ["♥4", "♦3", "♣2", "♠2", "♦3"]

        self.game.bets = {
            "PLAYER": 0,
            "BANKER": 100,  # Sima nyeremény -> Payout: 100 * 2 = 200
            "TIE": 0,
            "DRAGON": 0,
            "PANDA": 0
        }

        self.game.initialize_new_round()

        # Logikai ellenőrzések
        self.assertFalse(self.game.is_natural, "Ez nem lehet Natural kör!")
        self.assertFalse(self.game.is_player_third_card, "Player 6 pontra megáll.")
        self.assertTrue(self.game.is_banker_third_card, "Banker 5 pontra köteles húzni, ha Player áll.")
        self.assertEqual(self.game.winner, WinnerState.BANKER_WON.value)
        self.assertEqual(self.game.target_phase, PhaseState.MAIN_STAND)

        # Kifizetések
        self.assertEqual(self.game.payouts["BANKER"], 200)
        self.assertEqual(self.game.payouts["TOTAL"], 200)

        # --- ROAD MAP ADATBÁZIS ELLENŐRZÉS ---
        self.assertEqual(self.game.road_map_unit["winner"], WinnerState.BANKER_WON.value)
        self.assertEqual(self.game.road_map_unit["player_score"], 6)
        self.assertEqual(self.game.road_map_unit["banker_score"], 8)
        self.assertFalse(self.game.road_map_unit["is_natural"])
        self.assertFalse(self.game.road_map_unit["is_dragon"], "Ez nem Dragon, mert 8 pont lett.")
        self.assertFalse(self.game.road_map_unit["is_panda"])

    # 1B
    def test_standard_player_stands_banker_draws_and_wins1B(self):
        """Teszt: Nincs Natural. Player megáll 6 ponton. Banker 5 pontról húz egy 2-est.
        Banker nyer (7 vs 6)."""
        # Player: ♥4 + ♣2 = 6 (Stand!) | Banker: ♦3 + ♠2 = 5
        # Mivel Player nem húzott, Banker 5 pontra kötelezően HÚZ.
        # 5. lap (Banker 3. lapja): ♦2 (Új Banker sum: 5 + 2 = 7)
        self.game.deck = ["♥4", "♦3", "♣2", "♠2", "♦2"]

        self.game.bets = {
            "PLAYER": 0,
            "BANKER": 100,  # Nyer -> Payout: 100 * 2 = 200
            "TIE": 0,
            "DRAGON": 0,
            "PANDA": 0
        }

        self.game.initialize_new_round()

        # Logikai ellenőrzések
        self.assertFalse(self.game.is_natural, "Ez nem lehet Natural kör!")
        self.assertFalse(self.game.is_player_third_card, "Player 6 pontra megáll.")
        self.assertTrue(self.game.is_banker_third_card, "Banker 5 pontra köteles húzni, ha Player áll.")
        self.assertEqual(self.game.winner, WinnerState.BANKER_WON.value)
        self.assertEqual(self.game.target_phase, PhaseState.MAIN_STAND)

        # Kifizetések
        # Kifizetések ellenőrzése (Push szabály!)
        self.assertEqual(self.game.payouts["BANKER"], 100, "Dragon 7-nél a sima Banker tét PUSH!")
        self.assertEqual(self.game.payouts["TOTAL"], 100)

        # --- ROAD MAP ADATBÁZIS ELLENŐRZÉS ---
        self.assertEqual(self.game.road_map_unit["winner"], WinnerState.BANKER_WON.value)
        self.assertEqual(self.game.road_map_unit["player_score"], 6)
        self.assertEqual(self.game.road_map_unit["banker_score"], 7)
        self.assertFalse(self.game.road_map_unit["is_natural"])
        self.assertTrue(self.game.road_map_unit["is_dragon"], "Dragon 7!")
        self.assertFalse(self.game.road_map_unit["is_panda"], "Nem Panda 8")

    # 2
    def test_dragon_7_payout_and_banker_push(self):
        """Teszt: DRAGON 7 szituáció. Banker nyer 3 lapból pontosan 7 ponttal.
        A Banker fő tét PUSH (visszajár az 1x), a DRAGON tét 41x fizet."""
        # Player: ♥2 + ♣3 = 5 (Húz!) | Banker: ♦2 + ♠2 = 4
        # 5. lap (Player 3. lapja): ♣5 (Új Player sum: 5 + 5 = 10 -> 0)
        # Banker 4 ponton áll, Player 3. lapja 5-ös -> Mátrix szerint Banker HÚZ!
        # 6. lap (Banker 3. lapja): ♦3 (Új Banker sum: 4 + 3 = 7)
        # Eredmény: Banker 7 (3 lapból) vs Player 0 (3 lapból). Banker nyer -> DRAGON 7!
        self.game.deck = ["♥2", "♦2", "♣3", "♠2", "♣5", "♦3"]

        self.game.bets = {
            "PLAYER": 0,
            "BANKER": 100,  # DRAGON 7 miatt PUSH -> 100 jár vissza
            "TIE": 0,
            "DRAGON": 10,   # NYER! 10 * 41 = 410
            "PANDA": 0
        }

        self.game.initialize_new_round()

        self.assertEqual(self.game.winner, WinnerState.BANKER_WON.value)
        self.assertIn(BetType.DRAGON.value, self.game.side_winners)

        # Kifizetések ellenőrzése (Baccarat Push szabály + Dragon szorzó)
        self.assertEqual(self.game.payouts["BANKER"], 100, "Dragon 7-nél a Banker tét csak visszajár!")
        self.assertEqual(self.game.payouts["DRAGON"], 410, "Dragon tét 41x szorzóval fizet.")
        self.assertEqual(self.game.payouts["TOTAL"], 510)  # 100 + 410 = 510

        # --- ROAD MAP ADATBÁZIS ELLENŐRZÉS ---
        self.assertEqual(self.game.road_map_unit["winner"], WinnerState.BANKER_WON.value)
        self.assertEqual(self.game.road_map_unit["player_score"], 0)
        self.assertEqual(self.game.road_map_unit["banker_score"], 7)
        self.assertTrue(self.game.road_map_unit["is_dragon"])
        self.assertFalse(self.game.road_map_unit["is_panda"])

    # 3
    def test_panda_8_payout_and_player_win(self):
        """Teszt: PANDA 8 szituáció. Player nyer 3 lapból pontosan 8 ponttal.
        A Player fő tét 2x fizet, a PANDA tét 26x fizet."""
        # Player: ♥2 + ♣2 = 4 (Húz!) | Banker: ♦3 + ♠3 = 6
        # 5. lap (Player 3. lapja): ♣4 (Új Player sum: 4 + 4 = 8)
        # Banker 6 ponton áll, Player 3. lapja 4-es -> Mátrix szerint Banker MEGÁLL (Stand).
        # Eredmény: Player 8 (3 lapból) vs Banker 6 (2 lapból). Player nyer -> PANDA 8!
        self.game.deck = ["♥2", "♦3", "♣2", "♠3", "♣4"]

        self.game.bets = {
            "PLAYER": 100, # NYER -> 100 * 2 = 200
            "BANKER": 0,
            "TIE": 0,
            "DRAGON": 0,
            "PANDA": 10    # NYER -> 10 * 26 = 260
        }

        self.game.initialize_new_round()

        self.assertTrue(self.game.is_player_third_card)
        self.assertFalse(self.game.is_banker_third_card)
        self.assertEqual(self.game.winner, WinnerState.PLAYER_WON.value)
        self.assertIn(BetType.PANDA.value, self.game.side_winners)

        # Kifizetések ellenőrzése
        self.assertEqual(self.game.payouts["PLAYER"], 200)
        self.assertEqual(self.game.payouts["PANDA"], 260)
        self.assertEqual(self.game.payouts["TOTAL"], 460)  # 200 + 260 = 460

        # --- ROAD MAP ADATBÁZIS ELLENŐRZÉS ---
        self.assertEqual(self.game.road_map_unit["winner"], WinnerState.PLAYER_WON.value)
        self.assertEqual(self.game.road_map_unit["player_score"], 8)
        self.assertEqual(self.game.road_map_unit["banker_score"], 6)
        self.assertFalse(self.game.road_map_unit["is_natural"])
        self.assertFalse(self.game.road_map_unit["is_dragon"])
        self.assertTrue(self.game.road_map_unit["is_panda"])

    # 4
    def test_matrix_rule_banker_stands_on_player_8(self):
        """Teszt: Kaszinó mátrix kivétel szabály. Banker 3 ponton áll, Player 5 pontról 8-ast húz.
        A Bankernek kötelező megállnia (Stand), nem húzhat 3. lapot."""
        # Player: ♥3 + ♣2 = 5 (Húz!) | Banker: ♦2 + ♠1 = 3
        # 5. lap (Player 3. lapja): ♠8 (Új Player sum: 5 + 8 = 13 -> 3)
        # Banker 3 ponton áll, Player 3. lapja 8-as -> A mátrix tiltja a húzást! Banker STAND.
        # Eredmény: Player 3 (3 lapból) vs Banker 3 (2 lapból) -> Sima TIE (Döntetlen).
        self.game.deck = ["♥3", "♦2", "♣2", "♠A", "♠8"]

        self.game.bets = {
            "PLAYER": 50,  # Push -> 50
            "BANKER": 50,  # Push -> 50
            "TIE": 10,     # Nyer 8:1 -> 10 * 9 = 90
            "DRAGON": 0,
            "PANDA": 0
        }

        self.game.initialize_new_round()

        # 1. Ellenőrizzük a lapok darabszámát a kezekben!
        self.assertEqual(len(self.game.player["hand"]), 3)
        self.assertEqual(len(self.game.banker["hand"]), 2)

        # 2. Ellenőrizzük a kiszámolt pontszámokat (sum)!
        self.assertEqual(self.game.player["sum"], 3)
        self.assertEqual(self.game.banker["sum"], 3)

        self.assertTrue(self.game.is_player_third_card)
        self.assertFalse(self.game.is_banker_third_card, "A mátrixnak le kell tiltania a Banker húzását!")
        self.assertEqual(self.game.winner, WinnerState.TIE.value)

        # Kifizetések
        self.assertEqual(self.game.payouts["TIE"], 90)
        self.assertEqual(self.game.payouts["PLAYER"], 50)
        self.assertEqual(self.game.payouts["BANKER"], 50)
        self.assertEqual(self.game.payouts["TOTAL"], 190)

        # --- ROAD MAP ADATBÁZIS ELLENŐRZÉS ---
        self.assertEqual(self.game.road_map_unit["winner"], WinnerState.TIE.value)
        self.assertEqual(self.game.road_map_unit["player_score"], 3)
        self.assertEqual(self.game.road_map_unit["banker_score"], 3)
        self.assertFalse(self.game.road_map_unit["is_natural"])
        self.assertFalse(self.game.road_map_unit["is_dragon"])
        self.assertFalse(self.game.road_map_unit["is_panda"])

    # 5
    def test_standard_tie_with_three_cards_each(self):
        """Teszt: Sima döntetlen, ahol mindkét oldal húzott 3. lapot."""
        # Player: ♥2 + ♣2 = 4 (Húz!) | Banker: ♦2 + ♠1 = 3
        # 5. lap (Player 3. lapja): ♣3 (Új Player sum: 4 + 3 = 7)
        # Banker 3 ponton áll, Player 3. lapja 3-as -> Mátrix szerint Banker HÚZ!
        # 6. lap (Banker 3. lapja): ♦4 (Új Banker sum: 3 + 4 = 7)
        # Eredmény: Player 7 (3 lapból) vs Banker 7 (3 lapból) -> TIE
        self.game.deck = ["♥2", "♦2", "♣2", "♠A", "♣3", "♦4"]

        self.game.bets = {
            "PLAYER": 0,
            "BANKER": 0,
            "TIE": 100,  # Nyer -> 100 * 9 = 90
            "DRAGON": 0,
            "PANDA": 0
        }

        self.game.initialize_new_round()

        self.assertTrue(self.game.is_player_third_card)
        self.assertTrue(self.game.is_banker_third_card)
        self.assertEqual(self.game.winner, WinnerState.TIE.value)

        # --- ROAD MAP ADATBÁZIS ELLENŐRZÉS ---
        self.assertEqual(self.game.road_map_unit["winner"], WinnerState.TIE.value)
        self.assertEqual(self.game.road_map_unit["player_score"], 7)
        self.assertEqual(self.game.road_map_unit["banker_score"], 7)
        self.assertFalse(self.game.road_map_unit["is_natural"])

if __name__ == "__main__":
    unittest.main()
