import copy
import math
import random

from collections import Counter
from typing import Any, Dict

from my_app.backend.bet_type import BetType
from my_app.backend.phase_state import PhaseState
from my_app.backend.winner_state import WinnerState


class Game:
    NONE = 0
    NUM_DECKS = 8
    CARDS_IN_DECK = 52
    TOTAL_INITIAL_CARDS = NUM_DECKS * CARDS_IN_DECK
    IMMEDIATE_STOP = {
        WinnerState.NATURAL_DEALER_WON,
        WinnerState.NATURAL_PLAYER_WON,
        WinnerState.NATURAL_PUSH,
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
        self.winner = WinnerState.NONE
        self.suits = ["♥", "♦", "♣", "♠"]
        self.ranks = ["A", "K", "Q", "J", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
        # self.ranks = ["A", "K", "K", "K", "9", "10"]
        self.deck = []
        self.deck_len_init = Game.TOTAL_INITIAL_CARDS
        self.bet: int = 0
        self.bet_list = []
        self.is_round_active = False
        self.target_phase = PhaseState.LOADING
        self.pre_phase = PhaseState.NONE
        self.is_session_init = False
        self.shoe_cut_limit = 0
        self.bet_type = BetType.NONE
        self.first_card = None

    def get_cut_card_position(self):
        total_cards = Game.TOTAL_INITIAL_CARDS
        # A vágókártyát a végétől számítva 60 és 90 lap közé tesszük
        # Ez kb. a pakli 78% - 85% közötti része
        cut_offset = random.randint(60, 90)
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
            print("67 shoe_cut_limit: ", self.shoe_cut_limit)
            self.first_card = self.burn_cards()

            self.target_phase = PhaseState.SHIFTING_THE_STACKS
            self.pre_phase = PhaseState.BURNING_CARDS

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

        card1 = self.deck.pop(0)
        card2 = self.deck.pop(0)
        card3 = self.deck.pop(0)
        card4 = self.deck.pop(0)

        player_hand = [card1, card3]
        banker_hand = [card2, card4]

        player_sum = self.sum(player_hand, True)
        banker_sum = self.sum(banker_hand, False)

        self.is_round_active = True
        self.is_session_init = False

        self.target_phase = PhaseState.INIT_GAME

        self.player = {
            "hand": player_hand,
            "sum": player_sum,
        }
        self.banker: Dict[str, Any] = {
            "hand": banker_hand,
            "sum": banker_sum,
        }

    def sum(self, hand, is_player):
        ranks = self.hand_to_ranks(hand)
        counts = Counter(ranks)
        nums_of_ace = counts["A"]
        res = 0
        BLACKJACK_LIMIT = 21
        for rank in ranks:
            if rank in ["K", "Q", "J", "0"]:
                res += 10
            elif rank.isdigit():
                res += int(rank)
        if nums_of_ace > 0:
            for _ in range(nums_of_ace):
                if res + 11 <= BLACKJACK_LIMIT:
                    res += 11
                else:
                    res += 1
        if is_player:
            self.set_player_sum(res)
        else:
            self.player
            # self.set_dealer_sum(res)

        return res

    def winner_state(self):
        player = self.player["sum"]
        dealer = self.banker["sum"]

        if player > 21:
            self.winner = WinnerState.PLAYER_LOST

        elif dealer > 21:
            self.winner = WinnerState.PLAYER_WON

        elif player == dealer:
            self.winner = WinnerState.PUSH

        elif player > dealer:
            self.winner = WinnerState.PLAYER_WON

        else:
            self.winner = WinnerState.DEALER_WON

        return self.winner

    def hit(self, is_double, has_split):
        if not self.is_round_active:
            return
        new_card = self.deck.pop(0)
        self.set_player_hand(new_card)
        self.player["has_hit"] = self.player.get("has_hit", 0) + 1

        curr_sum = self.sum(self.player["hand"], True)
        self.player["sum"] = curr_sum

        if not has_split:
            self.target_phase = (
                PhaseState.MAIN_STAND_REWARDS_TRANSIT
                if curr_sum >= 21 or is_double
                else PhaseState.MAIN_TURN
            )
        else:
            if is_double:
                self.target_phase = PhaseState.SPLIT_STAND_DOUBLE
            elif curr_sum >= 21:
                self.target_phase = (
                    PhaseState.SPLIT_STAND_DOUBLE
                    if self.player.get("has_hit") == 1
                    else PhaseState.SPLIT_STAND
                )
            else:
                self.target_phase = PhaseState.SPLIT_TURN

    def stand(self, has_split):
        count = self.sum(self.banker["hand"], False)
        if self.sum(self.player["hand"], True) <= 21:
            while count < 17:
                card = self.deck.pop(0)
                self.banker["hand"].append(card)
                count = self.sum(self.banker["hand"], False)
                self.banker["sum"] = count

        self.banker["sum"] = count
        self.winner = Game.NONE
        self.winner = self.winner_state()

        self.target_phase = (
            PhaseState.MAIN_STAND if not has_split else PhaseState.SPLIT_FINISH_OUTCOME
        )

    def rewards(self) -> int:
        bet = self.bet
        natural_21_scenario = self.banker["natural_21"]
        reward_amount = 0  # Alapértelmezett érték: 0 (veszteség)

        if self.natural_21 == 1:
            reward_amount = math.floor(bet * 2.5)  # Eredeti tét + 1.5x nyeremény
        elif self.winner == 6 and natural_21_scenario != 3:
            reward_amount = bet * 2  # Eredeti tét + 1x nyeremény
        elif (
            self.winner == 4 and natural_21_scenario != 3
        ) or natural_21_scenario == 2:
            reward_amount = bet

        self.set_bet_to_null()
        self.set_bet_list_to_null()
        self.bet_type = BetType.NONE
        self.is_round_active = bool(self.players)

        return reward_amount

    def retake_bet_from_bet_list(self):
        if len(self.bet_list) != 0:
            bet = self.bet_list.pop()
            self.set_bet(-bet)
            return bet
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

    def set_bet(self, amount):
        self.bet += amount

    def set_bet_to_null(self):
        self.bet = 0

    def get_bet(self):
        return self.bet

    def get_bet_list(self):
        return self.bet_list

    def set_bet_list(self, bet):
        self.bet_list.append(bet)

    def set_bet_list_to_null(self):
        self.bet_list = []

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

    def serialize(self):
        return {
            "deck": self.deck,
            "player": self.player,
            "banker": self.banker,
            "winner": self.winner,
            "deck_len": self.get_deck_len(),
            "bet": self.bet,
            "bet_list": self.bet_list,
            "is_round_active": self.is_round_active,
            "target_phase": self.get_target_phase().value,
            "pre_phase": self.get_pre_phase().value,
            "is_session_init": self.is_session_init,
            "shoe_cut_limit": self.shoe_cut_limit,
            "bet_type": self.bet_type,
        }

    @classmethod
    def deserialize(cls, data):
        game = cls()
        game.deck = data["deck"]
        game.player = data["player"]
        game.banker = data["banker"]
        game.winner = data["winner"]
        game.deck_len = data["deck_len"]
        game.bet = data["bet"]
        game.bet_list = data["bet_list"]
        game.is_round_active = data.get("is_round_active", False)
        raw_pre = data.get("pre_phase")
        raw_target = data.get("target_phase")
        if raw_target:
            game.target_phase = PhaseState(raw_target)
        if raw_pre:
            game.pre_phase = PhaseState(raw_pre)
        # Ha valamiért nem volt a mentésben, a get_ függvények adják meg az alapot
        if not raw_target:
            game.target_phase = game.get_target_phase()
        if not raw_pre:
            game.pre_phase = game.get_pre_phase()
        game.is_session_init = data.get("is_session_init", False)
        game.shoe_cut_limit = data.get("shoe_cut_limit", 0)
        game.bet_type = data.get("bet_type", 0)

        return game
