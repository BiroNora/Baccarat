import type {
  GameState,
  GameStateData,
  HistoryUnit,
} from "../types/game-types";

export interface GameDataState {
  gameState: GameStateData; // Ez tartja a szerver adatait
  history?: HistoryUnit[];
  preRewardBet: number | null;
  preRewardTokens: number | null;
  initDeckLen: number | null; // Animációhoz
  totalInitialCards: number | null;
  selectedBetType: number;
}

export interface BetMap {
  [key: number]: number; // A BetTypes (0, 1, 2...)
  TOTAL: number; // Az összesítő mező
}

// Definiáljuk az akciókat, ha még nincsenek a types-ban
export type GameAction =
  | { type: "SYNC_SERVER_DATA"; payload: GameStateData }
  | { type: "SET_UI_PHASE"; payload: GameState }
  | { type: "SET_CONFIG"; payload: { totalInitialCards: number } }
  | { type: "SET_DECK_LEN"; payload: number | null }
  | { type: "SET_BET_SNAPSHOTS"; payload: { bets: BetMap; tokens: number } }
  | { type: "SET_SELECTED_BET_TYPE"; payload: number }
  | { type: "RESET_TURN_VARIABLES" };

export const initialGameDataState: GameDataState = {
  gameState: {
    currentGameState: "LOADING",
    player: { hand: [], sum: 0 },
    banker: { hand: [], sum: 0 },
    winner: 0,
    is_player_third_card: false,
    is_banker_third_card: false,
    deck_len: 0,
    tokens: 0,
    bets: {
      PLAYER: 0,
      BANKER: 0,
      TIE: 0,
      PANDA: 0,
      DRAGON: 0,
      P_PAIR: 0,
      B_PAIR: 0,
      TOTAL: 0,
    },
    round_result: {
      winner: 0,
      player_score: 0,
      banker_score: 0,
      is_natural: false,
      is_dragon: false,
      is_panda: false,
      is_p_pair: false,
      is_b_pair: false,
    },
    target_phase: "LOADING",
    pre_phase: "BETTING",
    final_phase: "BETTING",
    first_card: null,
  } as GameStateData,
  history: [],
  preRewardBet: null,
  preRewardTokens: null,
  initDeckLen: null,
  totalInitialCards: null,
  selectedBetType: 0,
};

export function gameReducer(
  state: GameDataState,
  action: GameAction,
): GameDataState {
  switch (action.type) {
    case "SYNC_SERVER_DATA": {
      const { history, ...gameStatePayload } = action.payload;

      return {
        ...state,
        gameState: {
          ...state.gameState, // 1. Alapból megtartja a régi dolgokat, ha valami hiányozna
          ...gameStatePayload, // 2. Rámásolja a szerver friss adatait

          // 3. MÉLY MÁSOLÁS (Deep copy) a kritikus objektumokra, hogy a React garantáltan újrarendereljen:
          bets: action.payload.bets
            ? { ...action.payload.bets }
            : state.gameState.bets,
          player: action.payload.player
            ? {
                ...action.payload.player,
                hand: action.payload.player.hand
                  ? [...action.payload.player.hand]
                  : [],
              }
            : state.gameState.player,
          banker: action.payload.banker
            ? {
                ...action.payload.banker,
                hand: action.payload.banker.hand
                  ? [...action.payload.banker.hand]
                  : [],
              }
            : state.gameState.banker,
          round_result: action.payload.round_result
            ? { ...action.payload.round_result }
            : state.gameState.round_result,
          history: history ? [...history] : state.history,
        },
      };
    }
    case "SET_UI_PHASE":
      return {
        ...state,
        gameState: { ...state.gameState, currentGameState: action.payload },
      };
    case "SET_CONFIG":
      return {
        ...state,
        totalInitialCards: action.payload.totalInitialCards,
        initDeckLen:
          state.initDeckLen === null || state.initDeckLen === 0
            ? action.payload.totalInitialCards
            : state.initDeckLen,
        gameState: {
          ...state.gameState,
        },
      };
    case "SET_DECK_LEN":
      return { ...state, initDeckLen: action.payload };
    case "SET_BET_SNAPSHOTS":
      return {
        ...state,
        preRewardBet: action.payload.bets.TOTAL,
        preRewardTokens: action.payload.tokens,
      };
    case "SET_SELECTED_BET_TYPE":
      return {
        ...state,
        gameState: {
          ...state.gameState,
        },
      };
    case "RESET_TURN_VARIABLES":
      return {
        ...state,
        initDeckLen: state.gameState.deck_len,
        preRewardBet: null, // Nincs többé régi tét
        preRewardTokens: null, // Nincs többé régi zsetonérték
      };
    default:
      return state;
  }
}
