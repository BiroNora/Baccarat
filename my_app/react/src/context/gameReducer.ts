import type { GameState, GameStateData } from "../types/game-types";

export interface GameDataState {
  gameState: GameStateData; // Ez tartja a szerver adatait
  preRewardBet: number | null;
  preRewardTokens: number | null;
  initDeckLen: number | null; // Animációhoz
  totalInitialCards: number | null;
  selectedBetType: number;
}

// Definiáljuk az akciókat, ha még nincsenek a types-ban
export type GameAction =
  | { type: "SYNC_SERVER_DATA"; payload: GameStateData }
  | { type: "SET_UI_PHASE"; payload: GameState }
  | { type: "SET_CONFIG"; payload: { totalInitialCards: number } }
  | { type: "SET_DECK_LEN"; payload: number | null }
  | { type: "SET_BET_SNAPSHOTS"; payload: { bet: number; tokens: number } }
  | { type: "SET_SELECTED_BET_TYPE"; payload: number }
  | { type: "RESET_TURN_VARIABLES" };

export const initialGameDataState: GameDataState = {
  gameState: {
    currentGameState: "LOADING",
    player: {
      hand: [],
      sum: 0,
    },
    banker: { hand: [], sum: 0 },
    winner: 0,
    deck_len: 0,
    tokens: 0,
    bet: 0,
    bet_list: [],
    target_phase: "LOADING",
    pre_phase: "BETTING",
    bet_type: 0,
    first_card: null,
  } as GameStateData,
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
    case "SYNC_SERVER_DATA":
      return {
        ...state,
        gameState: {
          ...state.gameState, // Megtartjuk a meglévő mezőket (pl. tokens)
          ...action.payload, // Felülírjuk azokkal, amik a szervertől jöttek
        },
      };
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
        preRewardBet: action.payload.bet,
        preRewardTokens: action.payload.tokens,
      };
    case "SET_SELECTED_BET_TYPE":
      return {
        ...state,
        gameState: {
          ...state.gameState,
          bet_type: action.payload,
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
