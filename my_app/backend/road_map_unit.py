class RoadMapUnit:
    """
    A Baccarat Sárkányfarok (Big Road) rácsának egyetlen celláját reprezentáló osztály.
    Felelős azért, hogy a játék motorjától kapott adatokat a frontend (React) számára
    optimalizált, kis méretű szótárrá (dict) alakítsa.
    """
    def __init__(
        self,
        winner: int,
        is_natural: bool = False,
        is_dragon: bool = False,
        is_panda: bool = False,
        tie_count: int = 0,
        is_b_pair: bool = False,
        is_p_pair: bool = False
    ):
        self.w = winner         # BetType enum értéke (0: PLAYER, 1: BANKER, 2: TIE)
        self.n = is_natural     # Natural győzelem-e (True/False)
        self.d = is_dragon      # EZ Baccarat Dragon 7 (True/False)
        self.p = is_panda       # EZ Baccarat Panda 8 (True/False)
        self.t = tie_count      # Egymás utáni döntetlenek száma a cellán (0, 1, 2...)
        self.bp = is_b_pair     # Banker Pair (True/False)
        self.pp = is_p_pair     # Player Pair (True/False)

    def to_frontend_dict(self) -> dict:
        """
        Átalakítja az osztály belső állapotát a frontend által elvárt
        szigorú, tömörített JSON formátumra.
        """
        return {
            "w": self.w,
            "n": self.n,
            "d": self.d,
            "p": self.p,
            "t": self.t,
            "bp": self.bp,
            "pp": self.pp
        }

    def __repr__(self) -> str:
        """Könnyen olvasható debug logoláshoz a konzolon."""
        return f"RoadMapUnit(w={self.w}, t={self.t}, d={self.d}, p={self.p}, bp={self.bp}, pp={self.pp})"
