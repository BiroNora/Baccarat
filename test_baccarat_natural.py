import unittest
from my_app.backend.game import Game
from my_app.backend.winner_state import WinnerState
from my_app.backend.phase_state import PhaseState
from my_app.backend.bet_type import BetType

class TestBaccaratNaturalOutcomes(unittest.TestCase):

    def setUp(self):
        """Minden teszt előtt futó alapbeállítás."""
        self.game = Game()
        self.game.clear_up()

    # 1
    def test_natural_player_won_payout(self):
        """Teszt: Player Natural 9-cel nyer Banker 0 ellen. Player tét 2x jár vissza."""
        # Player: ♥5 + ♣4 = 9 (Natural) | Banker: ♦10 + ♠K = 0
        self.game.deck = ["♥5", "♦10", "♣4", "♠K"]

        # Megrakjuk a téteket
        self.game.bets = {
            "PLAYER": 100,
            "BANKER": 0,
            "TIE": 0,
            "DRAGON": 0,
            "PANDA": 0
        }

        # 3. Elindítjuk a kört
        self.game.initialize_new_round()

        # 4. ELLENŐRZÉSEK (Asserts)
        self.assertTrue(self.game.is_natural, "A körnek Naturalnak kell lennie!")
        self.assertEqual(self.game.winner, WinnerState.NATURAL_PLAYER_WON.value)
        self.assertEqual(self.game.target_phase, PhaseState.MAIN_STAND_NATURAL)

        # Kifizetés ellenőrzése: 100 * 2 = 200 jár vissza a Playerre
        self.assertEqual(self.game.payouts["PLAYER"], 200)
        self.assertEqual(self.game.payouts["TOTAL"], 200)
        self.assertEqual(self.game.side_winners, [], "Naturalnál nem lehet mellékfogadás nyertes!")

    # 2
    def test_natural_banker_won_with_dragon_bet_placed(self):
        """Teszt: Banker Natural 8-cal nyer. Van tét Dragonon is, de az elvész (Natural miatt)."""
        # Player: ♥2 + ♣3 = 5 | Banker: ♦4 + ♠4 = 8 (Natural)
        self.game.deck = ["♥2", "♦4", "♣3", "♠4"]

        self.game.bets = {
            "PLAYER": 0,
            "BANKER": 50,
            "TIE": 0,
            "DRAGON": 20, # Bukó tét, mert a Dragonhoz 3 lapos Banker 7 kell!
            "PANDA": 0
        }

        self.game.initialize_new_round()

        self.assertTrue(self.game.is_natural)
        self.assertEqual(self.game.winner, WinnerState.NATURAL_BANKER_WON.value)

        # Banker 50 * 2 = 100 kifizetés. A Dragon elveszett (0).
        self.assertEqual(self.game.payouts["BANKER"], 100)
        self.assertEqual(self.game.payouts["DRAGON"], 0)
        self.assertEqual(self.game.payouts["TOTAL"], 100)

    # 3
    def test_natural_tie_payout_and_main_bets_push(self):
        """Teszt: Natural Döntetlen (8-8). Tie fizet 9x, Player/Banker tétek visszajárnak (Push)."""
        # Player: ♥5 + ♣3 = 8 (Natural) | Banker: ♦4 + ♠4 = 8 (Natural)
        self.game.deck = ["♥5", "♦4", "♣3", "♠4"]

        self.game.bets = {
            "PLAYER": 100, # Push -> 100 jár vissza
            "BANKER": 50,  # Push -> 50 jár vissza
            "TIE": 10,     # Win 8:1 -> 10 * 9 = 90 jár vissza
            "DRAGON": 0,
            "PANDA": 0
        }

        self.game.initialize_new_round()

        self.assertTrue(self.game.is_natural)
        self.assertEqual(self.game.winner, WinnerState.NATURAL_TIE.value)

        # Ellenőrizzük a pushokat és a Tie-t külön-külön
        self.assertEqual(self.game.payouts["TIE"], 90)
        self.assertEqual(self.game.payouts["PLAYER"], 100)
        self.assertEqual(self.game.payouts["BANKER"], 50)
        # Összesen: 90 + 100 + 50 = 240
        self.assertEqual(self.game.payouts["TOTAL"], 240)

    # 4
    def test_natural_player_9_vs_banker_8(self):
        """Teszt: Player Natural 9-cel nyer a Banker Natural 8-asa ellen."""
        # Player: ♥5 + ♣4 = 9 (Natural) | Banker: ♦4 + ♠4 = 8 (Natural)
        # Mindkettő Natural, de a 9-es üti a 8-ast!
        self.game.deck = ["♥5", "♦4", "♣4", "♠4"]

        self.game.bets = {
            "PLAYER": 100,
            "BANKER": 0,
            "TIE": 0,
            "DRAGON": 0,
            "PANDA": 0
        }

        self.game.initialize_new_round()

        self.assertTrue(self.game.is_natural, "A körnek Naturalnak kell lennie!")
        self.assertEqual(self.game.winner, WinnerState.NATURAL_PLAYER_WON.value, "A Player Natural 9-nek kell nyernie!")

        # Kifizetés: Player tét 2x
        self.assertEqual(self.game.payouts["PLAYER"], 200)
        self.assertEqual(self.game.payouts["TOTAL"], 200)

    # 5
    def test_natural_player_8_vs_banker_9(self):
        """Teszt: Banker Natural 9-cel nyer a Player Natural 8-asa ellen."""
        # Player: ♥4 + ♣4 = 8 (Natural) | Banker: ♦5 + ♠4 = 9 (Natural)
        self.game.deck = ["♥4", "♦5", "♣4", "♠4"]

        self.game.bets = {
            "PLAYER": 0,
            "BANKER": 50,
            "TIE": 0,
            "DRAGON": 0,
            "PANDA": 0
        }

        self.game.initialize_new_round()

        self.assertTrue(self.game.is_natural, "A körnek Naturalnak kell lennie!")
        self.assertEqual(self.game.winner, WinnerState.NATURAL_BANKER_WON.value, "A Banker Natural 9-nek kell nyernie!")

        # Kifizetés: Banker tét 2x
        self.assertEqual(self.game.payouts["BANKER"], 100)
        self.assertEqual(self.game.payouts["TOTAL"], 100)

    # 6
    def test_natural_all_allowed_bets_placed_banker_wins(self):
        """Teszt: Szabályos maximális fogadás. Banker + Tie + Dragon + Panda megrakva.
        A Banker Natural 9-cel nyer, a többi tét teljesen elvész."""
        # Player: ♥5 + ♣5 = 0 | Banker: ♦5 + ♠4 = 9 (Natural)
        self.game.deck = ["♥5", "♦5", "♣5", "♠4"]

        # Maximális SZABÁLYOS lefedettség (A Player mezőt üresen hagyjuk!)
        self.game.bets = {
            "PLAYER": 0,    # Ide szabályosan nem rakhat, ha a Bankerre rakott!
            "BANKER": 100,  # Nyer (Natural 9) -> Payout: 100 * 2 = 200
            "TIE": 50,      # Elvész (nem döntetlen) -> Payout: 0
            "DRAGON": 20,   # Elvész (Natural körben nincs side winner) -> Payout: 0
            "PANDA": 20     # Elvész (Natural körben nincs side winner) -> Payout: 0
        }

        self.game.initialize_new_round()

        # Logikai ellenőrzések
        self.assertTrue(self.game.is_natural)
        self.assertEqual(self.game.winner, WinnerState.NATURAL_BANKER_WON.value)
        self.assertEqual(self.game.side_winners, [])

        # Kifizetések ellenőrzése
        self.assertEqual(self.game.payouts["BANKER"], 200, "A Banker tét duplán jár vissza.")
        self.assertEqual(self.game.payouts["PLAYER"], 0)
        self.assertEqual(self.game.payouts["TIE"], 0)
        self.assertEqual(self.game.payouts["DRAGON"], 0)
        self.assertEqual(self.game.payouts["PANDA"], 0)

        # A teljes egyenlegnövekedés pontosan 200
        self.assertEqual(self.game.payouts["TOTAL"], 200)

if __name__ == "__main__":
    unittest.main()
