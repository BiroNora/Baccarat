from enum import IntEnum


class BetType(IntEnum):
  NONE = 0

  PLAYER = 1
  BANKER = 2
  TIE = 3
  PLAYER_PAIR = 4
  BANKER_PAIR = 5
