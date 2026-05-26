from typing import Any, Dict
from my_app.backend.phase_state import PhaseState
from my_app.backend.game import TOTAL_INITIAL_CARDS, Game


class GameSerializer:
    @staticmethod
    def serialize_by_context(game, path: str) -> Dict[str, Any]:
        p = path or ""

        if "rewards" in p:
            return GameSerializer.serialize_reward_state(game)
        if "create_deck" in p:
            return GameSerializer.serialize_create_deck(game)
        if "shoe_cut" in p:
            return GameSerializer.serialize_shoe_cut(game)
        if "start_game" in p:
            return GameSerializer.serialize_start_game(game)
        if "clear_game_state" in p:
            return GameSerializer.serialize_clear_game_state(game)

        if any(x in p for x in ["bet", "retake_bet", "restart"]):
            return GameSerializer.serialize_for_client_bets(game)

        return GameSerializer.serialize_for_client_init(game)

    @staticmethod
    def serialize_for_client_init(game) -> Dict[str, Any]:
        calc_phase = (
            PhaseState.SHUFFLING if (game.bets["TOTAL"] > 0) else PhaseState.NONE
        )

        return {
            "deck_len": game.get_deck_len(),
            "target_phase": game.get_target_phase().value,
            "pre_phase": calc_phase.value,
        }

    @staticmethod
    def serialize_clear_game_state(game) -> Dict[str, Any]:
        return {
            "deck_len": game.deck_len_init,
            "target_phase": PhaseState.BETTING.value,
        }

    @staticmethod
    def serialize_for_client_bets(game) -> Dict[str, Any]:
        print("48 game.is_round_active: ", game.is_round_active)
        print("49 game.is_session_init: ", game.is_session_init)
        d_len = (
            TOTAL_INITIAL_CARDS
            if (not game.is_round_active and game.is_session_init)
            else game.get_deck_len()
        )
        print("55 d_len: ", d_len)
        is_betting = game.bets.get("TOTAL", 0) == 0
        print("75 d_len: ", d_len)
        calc_phase = (
            PhaseState.BETTING if is_betting
            else (
                PhaseState.SHUFFLING
                if (d_len == TOTAL_INITIAL_CARDS or d_len < game.shoe_cut_limit)
                else PhaseState.INIT_GAME
            )
        )

        return {
            "shoe_cut": game.shoe_cut_limit,
            "bets": game.bets,
            "deck_len": d_len,
            "target_phase": PhaseState.BETTING.value,
            "pre_phase": calc_phase.value,
        }

    @staticmethod
    def serialize_create_deck(game) -> Dict[str, Any]:
        return {
            "bets": game.bets,
            "deck_len": game.deck_len_init,
            "target_phase": game.get_target_phase().value,
        }

    @staticmethod
    def serialize_shoe_cut(game) -> Dict[str, Any]:
        return {
            "deck_len": game.get_deck_len(),
            "first_card": game.first_card,
            "target_phase": game.get_target_phase().value,
            "pre_phase": game.get_pre_phase().value,
            "final_phase": game.get_final_phase().value,
        }

    @staticmethod
    def serialize_start_game(game) -> Dict[str, Any]:
        d_len = game.get_deck_len()
        is_betting = game.bets["TOTAL"] == 0
        print("95 d_len: ", d_len)
        print("96 is_betting: ", is_betting)

        calc_phase = (
            PhaseState.BETTING if is_betting
            else (
                PhaseState.SHUFFLING
                if (d_len < game.shoe_cut_limit)
                else PhaseState.INIT_GAME
            )
        )

        return {
            "player": game.player,
            "banker": game.banker,
            "bets": game.bets,
            "round_result": game.round_result,
            "deck_len": game.get_deck_len(),
            "target_phase": game.get_target_phase().value,
            "final_phase": game.get_final_phase().value,
            "pre_phase": calc_phase.value,
        }

    @staticmethod
    def serialize_reward_state(game) -> Dict[str, Any]:
        return {
            "player": game.player,
            "banker": game.banker,
            "deck_len": game.get_deck_len(),
            "bet": game.bet,
            "winner": game.winner,
            "target_phase": game.get_target_phase().value,
        }
