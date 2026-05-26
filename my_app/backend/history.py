from dataclasses import dataclass
from typing import TypedDict

# 1. Frontend "szerződés" (a részletes adatokkal)
class HistoryEntry(TypedDict):
    coord: str
    w: int
    n: bool
    d: bool
    p: bool
    t: int
    bp: bool
    pp: bool


@dataclass
class HistoryUnit:
    def __init__(self, coord, winner, is_natural, is_dragon, is_panda, tie_count, is_b_pair, is_p_pair):
        self.coord = coord
        self.w = winner
        self.n = is_natural
        self.d = is_dragon
        self.p = is_panda
        self.t = tie_count
        self.bp = is_b_pair
        self.pp = is_p_pair

    def to_frontend_dict(self):
        # Ez a kulcsfontosságú: a dict kulcsai pontosan egyezzenek a TS interfész neveivel!
        return {
            "coord": self.coord,
            "w": self.w,
            "n": self.n,
            "d": self.d,
            "p": self.p,
            "t": self.t,
            "bp": self.bp,
            "pp": self.pp,
        }
