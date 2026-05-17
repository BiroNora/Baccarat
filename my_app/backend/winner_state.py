from enum import IntEnum


class WinnerState(IntEnum):
    """A kör kimenetelét vagy az eredményt jelöli."""

    NONE = 0

    NATURAL_PLAYER_WON = 1
    NATURAL_BANKER_WON = 2
    NATURAL_TIE = 3
    
    PLAYER_WON = 4
    BANKER_WON = 5
    TIE = 6
