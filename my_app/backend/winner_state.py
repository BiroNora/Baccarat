from enum import IntEnum


class WinnerState(IntEnum):
    """A kör kimenetelét vagy az eredményt jelöli."""

    NONE = 0

    # Black Jack eredmények
    NATURAL_PLAYER_WON = 1
    NATURAL_PUSH = 2
    NATURAL_DEALER_WON = 3

    # Általános kimenetelek
    TIE = 4
    PLAYER_WON = 5
    DEALER_WON = 6
