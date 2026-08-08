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
        if "handle_auth" in p:
            return GameSerializer.serialize_handle_auth(game)
        if "forgot_password" in p:
            return GameSerializer.serialize_forgot_password(game)

        if any(x in p for x in ["check_session", "bet", "retake_bet", "restart"]):
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
    def serialize_handle_auth(game) -> Dict[str, Any]:
        if isinstance(game, dict):
            game = Game.deserialize(game)

        is_betting = game.bets.get("TOTAL", 0) == 0

        calc_phase = PhaseState.BETTING if is_betting else PhaseState.SHUFFLING

        return {
            "bets": game.bets,
            "deck_len": TOTAL_INITIAL_CARDS,
            "target_phase": PhaseState.BETTING.value,
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
        d_len = (
            TOTAL_INITIAL_CARDS
            if (not game.is_round_active and game.is_session_init)
            else game.get_deck_len()
        )

        is_betting = game.bets.get("TOTAL", 0) == 0

        calc_phase = (
            PhaseState.BETTING if is_betting
            else (
                PhaseState.SHUFFLING
                if (d_len == TOTAL_INITIAL_CARDS or d_len < game.shoe_cut_limit)
                else PhaseState.INIT_GAME
            )
        )

        return {
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

        calc_phase = (
            PhaseState.BETTING if is_betting
            else (
                PhaseState.SHUFFLING
                if (d_len < game.shoe_cut_limit)
                else PhaseState.INIT_GAME
            )
        )

        raw_result = game.round_result
        # Alap mezők
        round_data = {
            "winner": raw_result.get("winner", 0),
            "tie_count": raw_result.get("tie_count", 0)
        }

        # Opcionális mezők hozzáadása (csak ha True)
        optional_fields = [
            "is_natural", "is_dragon", "is_panda",
            "is_p_pair", "is_b_pair", "is_perfect_p_pair", "is_perfect_b_pair"
        ]

        for field in optional_fields:
            if raw_result.get(field):
                round_data[field] = True


        return {
            "player": game.player,
            "banker": game.banker,
            "bets": game.bets,
            "round_result": round_data,
            "deck_len": game.get_deck_len(),
            "target_phase": game.get_target_phase().value,
            "final_phase": game.get_final_phase().value,
            "pre_phase": calc_phase.value,
        }

    @staticmethod
    def serialize_forgot_password(game) -> Dict[str, Any]:
        return {
            "target_phase": PhaseState.FORGOT_PASSWORD.value,
        }
