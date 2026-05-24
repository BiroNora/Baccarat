import unittest
from my_app.backend.game import Game

class TestBaccaratRoadmap(unittest.TestCase):
    def setUp(self):
        """Minden teszt előtt futó alapbeállítás."""
        self.game = Game()
        # Ha a clear_up() metódusod létezik a Game osztályban, maradjon, ha nem, kikommentelheted
        if hasattr(self.game, 'clear_up'):
            self.game.clear_up()

    def test_empty_history(self):
        """1. Határeset: Üres játékmenet esetén üres szótárat kell visszaadnia."""
        self.assertEqual(self.game.calculate_baccarat_roadmap([]), {})

    def test_alternating_results(self):
        """2. Alapeset: Váltakozó eredmények (cikcak) esetén minden kör új oszlop tetejére kerül."""
        history = [
            {"winner": 1},  # Player -> (0, 0)
            {"winner": 3},  # Banker -> (0, 1)  (Tegyük fel: 3, 4 = Banker a belső logikádban)
            {"winner": 1}   # Player -> (0, 2)
        ]
        result = self.game.calculate_baccarat_roadmap(history)

        # Ellenőrizzük, hogy a koordináta kulcsok létrejöttek-e, és a győztes kódja (0: Player, 1: Banker) jó-e
        self.assertIn("0-0", result)
        self.assertEqual(result["0-0"]["w"], 0)

        self.assertIn("0-1", result)
        self.assertEqual(result["0-1"]["w"], 1)

        self.assertIn("0-2", result)
        self.assertEqual(result["0-2"]["w"], 0)

    def test_vertical_streak(self):
        """3. Alapeset: Ugyanaz a széria egymás után függőlegesen épül lefelé."""
        history = [
            {"winner": 1},  # Player -> (0, 0)
            {"winner": 1},  # Player -> (1, 0)
            {"winner": 1}   # Player -> (2, 0)
        ]
        result = self.game.calculate_baccarat_roadmap(history)

        self.assertIn("0-0", result)
        self.assertIn("1-0", result)
        self.assertIn("2-0", result)

        # Mindegyik Player (0) kell legyen
        self.assertEqual(result["0-0"]["w"], 0)
        self.assertEqual(result["1-0"]["w"], 0)
        self.assertEqual(result["2-0"]["w"], 0)

    def test_dragon_tail_turning(self):
        """4. Sárkányfarok eset: A 6. azonos találat után az elem jobbra kanyarodik."""
        # 7 darab Banker nyerés egymás után (winner: 3)
        history = [{"winner": 3} for _ in range(7)]
        result = self.game.calculate_baccarat_roadmap(history)

        # Az első 6 darab kitölti a 0-tól 5-ig tartó sorokat az első (0.) oszlopban
        for i in range(6):
            self.assertIn(f"{i}-0", result)
            self.assertEqual(result[f"{i}-0"]["w"], 1)

        # A 7. golyónak kötelező jobbra kanyarodnia az 5. sorban (index 5) a következő oszlopba
        self.assertIn("5-1", result)
        self.assertEqual(result["5-1"]["w"], 1)

    def test_allowed_columns_above_dragon(self):
        """5. ÚJ szabály teszt: A sárkányfarok feletti üres területek szabadok!
        Az új széria kihasználja az 1. oszlop tetején lévő üres helyet (0, 1)."""

        # Generálunk 7 darab Banker nyerést -> ez eléri az (5,0) pontot és jobbra kanyarodik az (5,1)-re
        history = [{"winner": 3} for _ in range(7)]

        # A 8. körben megszakad a széria, nyer a Player (winner: 1)
        history.append({"winner": 1})

        result = self.game.calculate_baccarat_roadmap(history)

        # Mivel az 1. oszlop teteje (0, 1) teljesen üres (csak az alján, az 5-ös sorban van a sárkány),
        # az új Player szériának IDE kell beülnie!
        self.assertIn("0-1", result)
        self.assertEqual(result["0-1"]["w"], 0) # Siker! Kihasználta a sárkány feletti helyet.

    def test_tie_does_not_break_streak_but_increments_counter(self):
        """6. Tie eset: A döntetlen nem nyit új cellát, hanem az előző cella 't' számlálóját növeli."""
        history = [
            {"winner": 1},  # Player -> (0, 0)
            {"winner": 5},  # Tie -> marad a (0, 0)-n, t=1 (Tegyük fel: 5 = Tie a belső logikádban)
            {"winner": 5},  # Újabb Tie -> marad a (0, 0)-n, t=2
            {"winner": 1}   # Player -> folytatja lefelé a (1, 0)-ra
        ]
        result = self.game.calculate_baccarat_roadmap(history)

        # Csak két darab koordináta kulcsunk szabad legyen összesen a rácsban!
        self.assertEqual(len(result), 2)
        self.assertIn("0-0", result)
        self.assertIn("1-0", result)

        # A (0,0) cellában a döntetlenek száma 2 kell legyen
        self.assertEqual(result["0-0"]["t"], 2)
        self.assertEqual(result["0-0"]["w"], 0) # Az eredeti győztes Player marad

        # A negyedik kör lefelé léptetett a (1,0)-ra
        self.assertEqual(result["1-0"]["w"], 0)
        self.assertEqual(result["1-0"]["t"], 0)

if __name__ == '__main__':
    unittest.main()
