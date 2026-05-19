from enum import Enum

class PhaseState(str, Enum):
    """A játék frontend fázisait jelölő Enum."""

    # Technikai állapotok
    NONE = "NONE"
    LOADING = "LOADING"
    RELOADING = "RELOADING"
    ERROR = "ERROR"
    OUT_OF_TOKENS = "OUT_OF_TOKENS"
    RECOVERY_DECISION = "RECOVERY_DECISION"

    # Játék előkészítése
    SHUFFLING = "SHUFFLING"
    CUTSLIDER = "CUTSLIDER"
    SHIFTING_THE_STACKS = "SHIFTING_THE_STACKS"
    BURNING_CARDS = "BURNING_CARDS"
    BETTING = "BETTING"
    INIT_GAME = "INIT_GAME"
    RESTART_GAME = "RESTART_GAME"

    # Fő játékmenet
    MAIN_STAND = "MAIN_STAND"
    MAIN_STAND_NATURAL = "MAIN_STAND_NATURAL"
