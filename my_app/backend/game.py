import math
import random

from typing import Any, Dict

from my_app.backend.bet_type import BetType
from my_app.backend.phase_state import PhaseState
from my_app.backend.winner_state import WinnerState

VALID_BET_TYPES = ["PLAYER", "BANKER", "TIE", "PANDA", "DRAGON"]


class Game:
    NONE = 0
    NUM_DECKS = 8
    CARDS_IN_DECK = 52
    TOTAL_INITIAL_CARDS = NUM_DECKS * CARDS_IN_DECK

    def __init__(self):
        self.player: Dict[str, Any] = {
            "hand": [],
            "sum": 0,
        }
        self.banker: Dict[str, Any] = {
            "hand": [],
            "sum": 0,
        }
        self.winner = WinnerState.NONE
        self.suits = ["♥", "♦", "♣", "♠"]
        self.ranks = ["A", "K", "Q", "J", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
        # self.ranks = ["A", "K", "K", "K", "9", "10"]
        self.deck = []
        self.deck_len_init = Game.TOTAL_INITIAL_CARDS
        self.bet: int = 0
        self.set_bets_to_null()
        self.is_round_active = False
        self.pre_phase = PhaseState.NONE
        self.target_phase = PhaseState.LOADING
        self.final_phase = PhaseState.NONE
        self.is_session_init = False
        self.shoe_cut_limit = 0
        self.first_card = None

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

        return self.first_card

    def initialize_new_round(self):
        self.clear_up()

        card1, card2, card3, card4 = [self.deck.pop(0) for _ in range(4)]
        p_hand, b_hand = [card1, card3], [card2, card4]

        self.player = {"hand": p_hand, "sum": self.sum(p_hand)}
        self.banker = {"hand": b_hand, "sum": self.sum(b_hand)}

        if self.isNatural(self.player["sum"], self.banker["sum"]):
            self.is_natural = True
            self.target_phase = PhaseState.MAIN_STAND_REWARDS_TRANSIT
        else:
            self.check_third_card_rules()

    def sum(self, hand):
        ranks = self.hand_to_ranks(hand)
        total = 0

        values = {
            "A": 1,
            "2": 2,
            "3": 3,
            "4": 4,
            "5": 5,
            "6": 6,
            "7": 7,
            "8": 8,
            "9": 9,
            "0": 0,
            "J": 0,
            "Q": 0,
            "K": 0,
        }

        for r in ranks:
            total += values.get(r, 0)

        return total % 10

    def isNatural(self, player_sum, banker_sum):
        return player_sum >= 8 or banker_sum >= 8

    def determine_winner(self):
        p_s, b_s = self.player["sum"], self.banker["sum"]

        if p_s > b_s:
            self.winner = BetType.PLAYER.value
        elif b_s > p_s:
            self.winner = BetType.BANKER.value
        else:
            self.winner = BetType.TIE.value

        self.is_round_active = False

    def rewards(self):
        if self.winner == BetType.NONE.value:
            return 0

        bet_amount = self.bet.get("amount", 0)
        chosen_side = self.bet_type

        if chosen_side == self.winner:
            if chosen_side == BetType.PLAYER.value:
                # Player kifizetés: 1:1 (pl. 100 tét -> 200 jön vissza)
                return bet_amount * 2

            elif chosen_side == BetType.BANKER.value:
                # Banker kifizetés: 1:1 mínusz 5% jutalék (pl. 100 tét -> 195 jön vissza)
                return int(bet_amount + (bet_amount * 0.95))

            elif chosen_side == BetType.TIE.value:
                # Tie kifizetés: 8:1 (pl. 100 tét -> 900 jön vissza)
                return bet_amount * 9

        # PUSH (Döntetlen lett, de P-re vagy B-re fogadott)
        elif self.winner == BetType.TIE.value and chosen_side in [
            BetType.PLAYER.value,
            BetType.BANKER.value,
        ]:
            return bet_amount

        return 0

    def rewards(self):
        if self.winner == BetType.NONE.value:
            return 0

        bet_amount = self.bet["amount"]
        bet_type = self.bet["type"]

        # 1. Ha a játékos eltalálta a győztest
        if bet_type == self.winner:
            if bet_type == BetType.PLAYER.value:
                return bet_amount * 2  # 1:1 kifizetés (visszakapja a tétet + nyeremény)

            elif bet_type == BetType.BANKER.value:
                # Banker nyeremény: 1:1, de 5% jutalék (0.95-ös szorzó)
                # Tehát visszakapja a tétet + (tét * 0.95)
                return int(bet_amount + (bet_amount * 0.95))

            elif bet_type == BetType.TIE.value:
                return (
                    bet_amount * 9
                )  # 8:1 kifizetés (visszakapja a tétet + 8x nyeremény)

        # 2. Ha Döntetlen (TIE) lett, de a játékos P-re vagy B-re fogadott
        # A Baccarat szabályai szerint ilyenkor a tét VISSZAJÁR (Push)
        elif self.winner == BetType.TIE.value:
            return bet_amount

        # 3. Minden egyéb esetben (vesztett)
        return 0

    def retake_bet_from_bet_list(self, bet_type_name):
        if bet_type_name in self.bet_list and self.bet_list[bet_type_name]:
            removed_chip = self.bet_list[bet_type_name].pop()
            self.bets[bet_type_name] -= removed_chip
            self.bets["TOTAL"] -= removed_chip

            return removed_chip
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
        self.winner = WinnerState.NONE
        self.is_round_active = False
        self.target_phase = PhaseState.BETTING

    def restart_game(self):
        self.__init__()

    def hand_to_ranks(self, hand):
        return "".join(c[-1] for c in hand)

    def load_state_from_data(self, data):
        self.is_round_active = data.get("is_round_active", False)

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
            self.bet_list[bet_type_name].append(amount)
        else:
            print(f"Hiba: {bet_type_name} nem érvényes fogadás!")

    def set_bets_to_null(self):
        self.bets = {key: 0 for key in VALID_BET_TYPES}
        self.bet_list = {key: [] for key in VALID_BET_TYPES}
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
            "deck_len": self.get_deck_len(),
            "bets": self.bets,
            "bet_list": self.bet_list,
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
        game.deck_len = data["deck_len"]
        game.set_bets_to_null()
        raw_bets = data.get("bets", {})
        game.bets.update(raw_bets)
        raw_bet_list = data.get("bet_list", {})
        game.bet_list.update(raw_bet_list)
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
