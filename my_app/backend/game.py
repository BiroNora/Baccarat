import random

from typing import Any, Dict

from my_app.backend.bet_type import BetType
from my_app.backend.phase_state import PhaseState
from my_app.backend.winner_state import WinnerState

VALID_BET_TYPES = ["PLAYER", "BANKER", "TIE", "PANDA", "DRAGON"]
ROAD_MAP_UNIT = [
    "winner",
    "player_score",
    "banker_score",
    "is_natural",
    "is_dragon",
    "is_panda",
]


class Game:
    NONE = 0
    NUM_DECKS = 8
    CARDS_IN_DECK = 52
    TOTAL_INITIAL_CARDS = NUM_DECKS * CARDS_IN_DECK
    CARD_VALUES = {
        rank: (0 if rank in ["0", "J", "Q", "K"] else (1 if rank == "A" else int(rank)))
        for rank in ["A", "2", "3", "4", "5", "6", "7", "8", "9", "0", "J", "Q", "K"]
    }

    def __init__(self):
        self.player: Dict[str, Any] = {
            "hand": [],
            "sum": 0,
        }
        self.banker: Dict[str, Any] = {
            "hand": [],
            "sum": 0,
        }
        self.suits = ["♥", "♦", "♣", "♠"]
        self.ranks = ["A", "K", "Q", "J", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
        # self.ranks = ["A", "K", "K", "K", "9", "10"]
        self.deck = []
        self.deck_len_init = Game.TOTAL_INITIAL_CARDS
        self.bet: int = 0
        self.bets = {key: 0 for key in VALID_BET_TYPES}
        self.clean_profit = 0
        self.winner = WinnerState.NONE
        self.side_winners = []
        self.road_map_unit = {key: 0 for key in ROAD_MAP_UNIT}
        self.is_round_active = False
        self.pre_phase = PhaseState.NONE
        self.target_phase = PhaseState.LOADING
        self.final_phase = PhaseState.NONE
        self.is_session_init = False
        self.shoe_cut_limit = 0
        self.first_card = None
        self.is_player_third_card = False
        self.is_banker_third_card = False

    def get_cut_card_position(self):
        total_cards = Game.TOTAL_INITIAL_CARDS

        cut_offset = random.randint(60, 90)  # A pakli 78% - 85% közötti része
        return total_cards - cut_offset

    def create_deck(self):
        single_deck = [f"{suit}{rank}" for suit in self.suits for rank in self.ranks]
        self.deck = single_deck * Game.NUM_DECKS
        random.shuffle(self.deck)

        self.target_phase = PhaseState.CUTSLIDER

        return self.deck

    def shoe_cut(self, cut_index: int):
        if 0 < cut_index < len(self.deck):
            self.deck = self.deck[cut_index:] + self.deck[:cut_index]

            self.shoe_cut_limit = self.deck_penetration()
            self.first_card = self.burn_cards()

            self.target_phase = PhaseState.SHIFTING_THE_STACKS
            self.pre_phase = PhaseState.BURNING_CARDS
            self.final_phase = PhaseState.INIT_GAME
        print("85 shoe_cut bets: ", self.bets)
        return self.deck

    def deck_penetration(self):
        lower_limit = int(Game.TOTAL_INITIAL_CARDS * 0.10)
        upper_limit = int(Game.TOTAL_INITIAL_CARDS * 0.25)

        return random.randint(lower_limit, upper_limit)

    def burn_cards(self):
        self.first_card = self.deck.pop(0)
        rank = self.first_card[-1]
        burn_count = 10 if rank in "KQJ0" else (1 if rank == "A" else int(rank))
        self.deck = self.deck[burn_count:]
        print("92 bets: ", self.bets)
        return self.first_card

    def initialize_new_round(self):
        self.clear_up()
        self.is_round_active = True

        print("98 bets: ", self.bets)

        card1, card2, card3, card4 = [self.deck.pop(0) for _ in range(4)]
        p_hand, b_hand = [card1, card3], [card2, card4]

        self.player = {"hand": p_hand, "sum": self.sum(p_hand)}
        self.banker = {"hand": b_hand, "sum": self.sum(b_hand)}

        if self.isNatural(self.player["sum"], self.banker["sum"]):
            self.is_natural = True
            self.side_winners = []

            self.determine_main_outcome()
            self.process_rewards()

            self.target_phase = PhaseState.MAIN_STAND_NATURAL
        else:
            self.is_natural = False
            self.check_third_card_rules()

            self.determine_main_outcome()
            self.determine_side_outcomes()
            self.process_rewards()

            self.target_phase = PhaseState.MAIN_STAND

    def sum(self, hand):
        ranks = self.hand_to_ranks(hand)
        total = sum(self.CARD_VALUES.get(r, 0) for r in ranks)

        return total % 10

    def isNatural(self, player_sum, banker_sum):
        return player_sum >= 8 or banker_sum >= 8

    def check_third_card_rules(self):
        p_score = self.player["sum"]
        b_score = self.banker["sum"]

        # PLAYER SZABÁLYA: Húz, ha 5 vagy kevesebb a pontja
        p_third = None
        if p_score <= 5:
            self.is_player_third_card = True
            p_third_card = self.deck.pop(0)
            self.player["hand"].append(p_third_card)
            p_third = self.CARD_VALUES.get(self.hand_to_ranks([p_third_card])[0], 0)

        # BANKER SZABÁLYA: Kaszinó mátrix szótár
        # Kulcs: a Banker pontszáma. Érték: azok a Player lapok, amikre a Banker HÚZ.
        banker_rules = {
            3: [
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                9,
            ],  # Mindig húz, kivéve ha a Player 3. lapja 8-as
            4: [2, 3, 4, 5, 6, 7],
            5: [4, 5, 6, 7],
            6: [6, 7],
        }

        # Ha a Player NEM húzott (mert 6 vagy 7 pontja volt): A Banker 0-5 között húz
        if p_third is None:
            if b_score <= 5:
                self.is_banker_third_card = True
                self.banker["hand"].append(self.deck.pop(0))

        # Ha a Player HÚZOTT: Ellenőrizzük a csökkentett feltételt
        else:
            if b_score <= 2 or (
                b_score in banker_rules and p_third in banker_rules[b_score]
            ):
                self.is_banker_third_card = True
                self.banker["hand"].append(self.deck.pop(0))

        self.player["sum"] = self.sum(self.player["hand"])
        self.banker["sum"] = self.sum(self.banker["hand"])

    def determine_main_outcome(self):
        p_s = self.player["sum"]
        b_s = self.banker["sum"]

        is_natural = (
            len(self.player["hand"]) == 2
            and len(self.banker["hand"]) == 2
            and (p_s >= 8 or b_s >= 8)
        )

        if p_s > b_s:
            self.winner = (
                WinnerState.NATURAL_PLAYER_WON.value
                if is_natural
                else WinnerState.PLAYER_WON.value
            )

        elif b_s > p_s:
            self.winner = (
                WinnerState.NATURAL_BANKER_WON.value
                if is_natural
                else WinnerState.BANKER_WON.value
            )

        else:
            self.winner = (
                WinnerState.NATURAL_TIE.value if is_natural else WinnerState.TIE.value
            )

    def determine_side_outcomes(self):
        p_s = self.player["sum"]
        b_s = self.banker["sum"]
        p_cards_count = len(self.player["hand"])
        b_cards_count = len(self.banker["hand"])

        self.side_winners = []

        # DRAGON 7: Banker nyer pontosan 3 lapból, pontosan 7 ponttal
        if b_s == 7 and b_cards_count == 3 and b_s > p_s:
            self.side_winners.append(BetType.DRAGON.value)

        # PANDA 8: Player nyer pontosan 3 lapból, pontosan 8 ponttal
        if p_s == 8 and p_cards_count == 3 and p_s > b_s:
            self.side_winners.append(BetType.PANDA.value)

    def update_road_map_unit(self):
        p_s = self.player["sum"]
        b_s = self.banker["sum"]

        # Megnézzük, hogy a nyertes benne van-e a Naturalok között
        is_natural_round = self.winner in [
            WinnerState.NATURAL_PLAYER_WON.value,
            WinnerState.NATURAL_BANKER_WON.value,
            WinnerState.NATURAL_TIE.value,
        ]

        self.road_map_unit = {
            "winner": self.winner,  # Tiszta IntEnum érték (1-6)
            "player_score": p_s,
            "banker_score": b_s,
            "is_natural": is_natural_round,
            "is_dragon": BetType.DRAGON.value in self.side_winners,
            "is_panda": BetType.PANDA.value in self.side_winners,
        }

    def process_rewards(self):
        self.update_road_map_unit()

        w = self.winner
        sw = self.side_winners
        b = self.bets

        is_player_win = w in [
            WinnerState.PLAYER_WON.value,
            WinnerState.NATURAL_PLAYER_WON.value,
        ]
        is_banker_win = w in [
            WinnerState.BANKER_WON.value,
            WinnerState.NATURAL_BANKER_WON.value,
        ]
        is_tie_win = w in [WinnerState.TIE.value, WinnerState.NATURAL_TIE.value]

        has_panda = BetType.PANDA.value in sw
        has_dragon = BetType.DRAGON.value in sw

        # 1. Összeszámoljuk, mennyi zsetont tett fel a játékos ÖSSZESEN ebben a körben
        # Ezt még a kifizetések kiszámítása és a zsebek felülírása ELŐTT kell megtenni!
        total_initial_bets = sum(b.get(key, 0) for key in VALID_BET_TYPES)

        # 2. Helyi szorzótábla az elszámoláshoz
        local_payouts = {key: 0 for key in VALID_BET_TYPES}

        # --- JUTALMAK KISZÁMÍTÁSA ---
        if is_player_win or has_panda:
            local_payouts["PLAYER"] = b.get("PLAYER", 0) * 2

        if is_banker_win:
            if has_dragon:
                local_payouts["BANKER"] = b.get("BANKER", 0)
            else:
                local_payouts["BANKER"] = b.get("BANKER", 0) * 2

        if is_tie_win:
            local_payouts["TIE"] = b.get("TIE", 0) * 9
            local_payouts["PLAYER"] = b.get("PLAYER", 0)
            local_payouts["BANKER"] = b.get("BANKER", 0)

        if has_dragon:
            local_payouts["DRAGON"] = b.get("DRAGON", 0) * 41

        if has_panda:
            local_payouts["PANDA"] = b.get("PANDA", 0) * 26

        # 3. Összegezzük a bruttó kifizetést (amennyi pénz most az asztalon landol összesen)
        total_gross_payout = sum(local_payouts.values())

        # 4. KISZÁMOLJUK A TISZTA NYERESÉGET (Bruttó kifizetés - Amit feltett a kör elején)
        # Ez az adatbázisban egy ideiglenes tulajdonság (property vagy attribútum) lesz a játékban,
        # amit a GameSerializer gond nélkül be tud csomagolni a JSON-be!
        self.clean_profit = total_gross_payout - total_initial_bets

        # 5. A különféle BET ZSEBEK megkapják a megérdemelt jutalmukat (vagy 0-zódnak)
        # Így a tétek automatikusan átgördülnek a következő Betting fázisra!
        for key in VALID_BET_TYPES:
            self.bets[key] = local_payouts[key]

        self.bets["TOTAL"] = sum(self.bets[key] for key in VALID_BET_TYPES)
        print("316 process_rewards bets: ", self.bets)
        print("317 TOTAL: ", self.bets["TOTAL"])

        self.is_round_active = False

    def clear_bet_by_type(self, bet_type_name):
        removed_amount = self.bets.get(bet_type_name, 0)

        if removed_amount > 0:
            self.bets[bet_type_name] = 0
            self.bets["TOTAL"] -= removed_amount

            return removed_amount
        else:
            return 0

    def clear_up(self):
        self.player: Dict[str, Any] = {
            "hand": [],
            "sum": 0,
        }
        self.banker: Dict[str, Any] = {
            "hand": [],
            "sum": 0,
        }
        self.is_natural = False
        self.is_player_third_card = False
        self.is_banker_third_card = False
        self.winner = WinnerState.NONE
        self.side_winners = []
        self.road_map_unit = {key: 0 for key in ROAD_MAP_UNIT}
        self.is_round_active = False
        self.target_phase = PhaseState.NONE

    def restart_game(self):
        self.__init__()

    def hand_to_ranks(self, hand):
        return "".join(c[-1] for c in hand)

    def clear_game_state(self):
        self.__init__()
        self.target_phase = PhaseState.BETTING

    # getters, setters
    def set_player_hand(self, card):
        self.player["hand"].append(card)

    def set_player_sum(self, sum):
        self.player["sum"] = sum

    def set_bet(self, amount, bet_type_name):
        if bet_type_name in VALID_BET_TYPES:
            self.bets[bet_type_name] += amount
            self.bets["TOTAL"] += amount
        else:
            print(f"Hiba: {bet_type_name} nem érvényes fogadás!")

    def set_bets_to_null(self):
        self.bets = {key: 0 for key in VALID_BET_TYPES}
        self.bets["TOTAL"] = 0

    def set_bet_type(self, type_value):
        self.bet_type = BetType(type_value)

    def get_deck_len(self):
        if len(self.deck) > 0:
            return len(self.deck)
        else:
            return self.deck_len_init

    def get_is_round_active(self):
        return self.is_round_active

    def update_target_phase(self):
        self.target_phase = self.get_target_phase()

    # >>>> TARGET PHASE
    def get_target_phase(self):
        return self.target_phase

    def get_pre_phase(self):
        return self.pre_phase

    def get_final_phase(self):
        return self.final_phase

    def serialize(self):
        return {
            "deck": self.deck,
            "player": self.player,
            "banker": self.banker,
            "winner": self.winner,
            "is_player_third_card": self.is_player_third_card,
            "is_banker_third_card": self.is_banker_third_card,
            "deck_len": self.get_deck_len(),
            "bets": self.bets,
            "side_winners": self.side_winners,
            "road_map_unit": self.road_map_unit,
            "is_round_active": self.is_round_active,
            "target_phase": self.get_target_phase().value,
            "pre_phase": self.get_pre_phase().value,
            "final_phase": self.get_final_phase().value,
            "is_session_init": self.is_session_init,
            "shoe_cut_limit": self.shoe_cut_limit,
        }

    @classmethod
    def deserialize(cls, data):
        game = cls()
        game.deck = data["deck"]
        game.player = data["player"]
        game.banker = data["banker"]
        game.winner = data["winner"]
        game.is_player_third_card = data["is_player_third_card"]
        game.is_banker_third_card = data["is_banker_third_card"]
        game.deck_len = data["deck_len"]
        game.set_bets_to_null()
        raw_bets = data.get("bets", {})
        game.bets.update(raw_bets)
        game.side_winners = data["side_winners"]
        raw_unit = data.get("road_map_unit")
        game.road_map_unit = raw_unit if raw_unit else {key: 0 for key in ROAD_MAP_UNIT}
        game.is_round_active = data.get("is_round_active", False)
        raw_pre = data.get("pre_phase")
        game.pre_phase = PhaseState(raw_pre) if raw_pre else game.get_pre_phase()
        raw_target = data.get("target_phase")
        game.target_phase = (
            PhaseState(raw_target) if raw_target else game.get_target_phase()
        )
        raw_final = data.get("final_phase")
        game.final_phase = (
            PhaseState(raw_final) if raw_final else game.get_final_phase()
        )
        game.is_session_init = data.get("is_session_init", False)
        try:
            game.shoe_cut_limit = int(data.get("shoe_cut_limit", 0))
        except (TypeError, ValueError):
            game.shoe_cut_limit = 0

        return game
