import unittest

from my_app.backend.matrix_manager import HistoryManager


class TestBaccaratRoadmap(unittest.TestCase):
    def setUp(self):
        """Minden teszt előtt egy friss HistoryManager példányt hozunk létre."""
        self.manager = HistoryManager()

    def test_empty_history(self):
        """1. Határeset: Üres játékmenet esetén üres szótárat kell visszaadnia."""
        self.assertEqual(self.manager.build_roadmap([]), {})

    def test_alternating_results(self):
        """2. Alapeset: Váltakozó eredmények (cikcak) esetén minden kör új oszlop tetejére kerül."""
        history = [
            {"winner": 1},  # Player -> (0, 0)
            {"winner": 3},  # Banker -> (0, 1)
            {"winner": 1},  # Player -> (0, 2)
        ]
        result = self.manager.build_roadmap(history)

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
            {"winner": 1},  # Player -> (2, 0)
        ]
        result = self.manager.build_roadmap(history)

        self.assertIn("0-0", result)
        self.assertIn("1-0", result)
        self.assertIn("2-0", result)
        self.assertEqual(result["0-0"]["w"], 0)
        self.assertEqual(result["1-0"]["w"], 0)
        self.assertEqual(result["2-0"]["w"], 0)

    def test_dragon_tail_turning(self):
        """4. Sárkányfarok eset: A 6. azonos találat után az elem jobbra kanyarodik."""
        history = [{"winner": 3} for _ in range(7)]
        result = self.manager.build_roadmap(history)

        for i in range(6):
            self.assertIn(f"{i}-0", result)
            self.assertEqual(result[f"{i}-0"]["w"], 1)

        self.assertIn("5-1", result)
        self.assertEqual(result["5-1"]["w"], 1)

    def test_allowed_columns_above_dragon(self):
        """5. ÚJ szabály teszt: A sárkányfarok feletti üres területek szabadok!"""
        history = [{"winner": 3} for _ in range(7)]
        history.append({"winner": 1})
        result = self.manager.build_roadmap(history)

        self.assertIn("0-1", result)
        self.assertEqual(result["0-1"]["w"], 0)

    def test_tie_does_not_break_streak_but_increments_counter(self):
        """6. Tie eset: A döntetlen nem nyit új cellát, hanem az előző cella 't' számlálóját növeli."""
        history = [
            {"winner": 1},  # Player -> (0, 0)
            {"winner": 5},  # Tie -> marad a (0, 0)-n, t=1
            {"winner": 5},  # Újabb Tie -> marad a (0, 0)-n, t=2
            {"winner": 1},  # Player -> (1, 0)
        ]
        result = self.manager.build_roadmap(history)

        self.assertEqual(len(result), 2)
        self.assertIn("0-0", result)
        self.assertIn("1-0", result)
        self.assertEqual(result["0-0"]["t"], 2)
        self.assertEqual(result["0-0"]["w"], 0)
        self.assertEqual(result["1-0"]["w"], 0)
        self.assertEqual(result["1-0"]["t"], 0)


if __name__ == "__main__":
    unittest.main()
