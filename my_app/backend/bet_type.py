from enum import IntEnum


class BetType(IntEnum):
  NONE = -1

  PLAYER = 0
  BANKER = 1
  TIE = 2
  PANDA = 3
  DRAGON = 4
  P_PAIR = 5
  B_PAIR = 6
