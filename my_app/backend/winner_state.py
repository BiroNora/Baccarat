from enum import IntEnum


class WinnerState(IntEnum):
    """A kör kimenetelét vagy az eredményt jelöli."""

    NONE = 0

    NATURAL_PLAYER_WON = 1
    NATURAL_TIE = 2
    NATURAL_BANKER_WON = 3

    # Általános kimenetelek
    TIE = 4
    PLAYER_WON = 5
    BANKER_WON = 6
