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
        self.set_bets_to_null() # self.bets és self.bet_list
        self.payouts = {key: 0 for key in VALID_BET_TYPES}
        self.winner = WinnerState.NONE
        self.side_winners = []
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
            p_third_card = self.deck.pop(0)
            self.player["hand"].append(p_third_card)
            p_third = self.CARD_VALUES.get(self.hand_to_ranks([p_third_card])[0], 0)

        # BANKER SZABÁLYA: Kaszinó mátrix szótár
        # Kulcs: a Banker pontszáma. Érték: azok a Player lapok, amikre a Banker HÚZ.
        banker_rules = {
            3: [0, 1, 2, 3, 4, 5, 6, 7, 9],  # Mindig húz, kivéve ha a Player 3. lapja 8-as
            4: [2, 3, 4, 5, 6, 7],
            5: [4, 5, 6, 7],
            6: [6, 7],
        }

        # Ha a Player NEM húzott (mert 6 vagy 7 pontja volt): A Banker 0-5 között húz
        if p_third is None:
            if b_score <= 5:
                self.banker["hand"].append(self.deck.pop(0))

        # Ha a Player HÚZOTT: Ellenőrizzük a csökkentett feltételt
        else:
            if b_score <= 2 or (
                b_score in banker_rules and p_third in banker_rules[b_score]
            ):
                self.banker["hand"].append(self.deck.pop(0))

        self.player["sum"] = self.sum(self.player["hand"])
        self.banker["sum"] = self.sum(self.banker["hand"])

    def determine_main_outcome(self):
        p_s = self.player["sum"]
        b_s = self.banker["sum"]

        # Megnézzük, hogy 2 vagy 3 lap van a kézben.
        # Ha mindkettőnél 2 lap van, és van 8 vagy 9 pont, az egy Natural!
        is_natural = len(self.player["hand"]) == 2 and len(self.banker["hand"]) == 2 and (p_s >= 8 or b_s >= 8)

        if p_s > b_s:
            self.winner = WinnerState.NATURAL_PLAYER_WON.value if is_natural else WinnerState.PLAYER_WON.value

        elif b_s > p_s:
            self.winner = WinnerState.NATURAL_BANKER_WON.value if is_natural else WinnerState.BANKER_WON.value

        else:
            self.winner = WinnerState.NATURAL_TIE.value if is_natural else WinnerState.TIE.value

    def determine_side_outcomes(self):
        """Meghatározza, hogy a mellékfogadások (DRAGON 7, PANDA 8) közül nyert-e valami."""
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

    def process_rewards(self):
        """
        A kör végén lefutó fő kifizetési motor.
        Közvetlenül a self.payouts szótárat frissíti, amit a játék állapotával
        együtt automatikusan szerializál a rendszer a frontend felé.
        """
        self.payouts = {key: 0 for key in self.payouts}

        self.determine_main_outcome()      # Beállítja: self.winner ("PLAYER", "BANKER" vagy "TIE")
        self.determine_side_outcomes()      # Feltölti: self.side_winners (["DRAGON"] vagy ["PANDA"] vagy [])

        w = self.winner
        sw = self.side_winners
        b = self.bets

        # --- SÍMA FOGADÁSOK SZORZÁSA ÉS PUSH KEZELÉSE ---

        # PLAYER nyer: ha a sima PLAYER vagy a PANDA 8 nyert
        if w == "PLAYER" or "PANDA" in sw:
            # 1:1 kifizetés + a saját tét visszajár = 2x szorzó
            self.payouts["PLAYER"] = b.get("PLAYER", 0) * 2

        # BANKER nyer
        if w == "BANKER":
            # 1:1 kifizetés + a saját tét visszajár = 2x szorzó
            self.payouts["BANKER"] = b.get("BANKER", 0) * 2
        elif "DRAGON" in sw:
            # EZ BACCARAT PUSH SZABÁLY: Ha Dragon 7 van, a sima Banker tét visszajár (1x szorzó)
            self.payouts["BANKER"] = b.get("BANKER", 0)

        # TIE nyer
        if w == "TIE":
            # 8:1-et fizet + a saját tét visszajár = 9x szorzó
            self.payouts["TIE"] = b.get("TIE", 0) * 9

            # Döntetlen esetén a sima PLAYER és BANKER tétek visszajárnak (Push -> 1x szorzó)
            self.payouts["PLAYER"] = b.get("PLAYER", 0)
            self.payouts["BANKER"] = b.get("BANKER", 0)


        # --- MELLÉKFOGADÁSOK (SIDE BETS) SZORZÁSA ---

        # DRAGON 7 nyer (40:1 fizet + saját tét visszajár = 41x szorzó)
        if "DRAGON" in sw:
            self.payouts["DRAGON"] = b.get("DRAGON", 0) * 41

        # PANDA 8 nyer (25:1 fizet + saját tét visszajár = 26x szorzó)
        if "PANDA" in sw:
            self.payouts["PANDA"] = b.get("PANDA", 0) * 26


        # --- ÖSSZEGZÉS ÉS EGYENLEG FRISSÍTÉS ---

        # Kiszámoljuk a bruttó kifizetést a TOTAL-ba (kivéve magát a TOTAL kulcsot)
        self.payouts["TOTAL"] = sum(value for key, value in self.payouts.items() if key != "TOTAL")

        # Jóváírjuk az összeget a játékosnál
        self.tokens += self.payouts["TOTAL"]

        # Lezárjuk a kört
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
            "payouts": self.payouts,
            "side_winners": self.side_winners,
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
        game.payouts = {key: 0 for key in VALID_BET_TYPES}
        game.side_winners = data["side_winners"]
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
