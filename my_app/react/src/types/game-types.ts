export type GameState =
  | "LOADING"
  | "RECOVERY_DECISION"
  | "SHUFFLING"
  | "CUTSLIDER"
  | "SHIFTING_THE_STACKS"
  | "BETTING"
  | "INIT_GAME"
  | "MAIN_TURN"
  | "MAIN_STAND"
  | "MAIN_STAND_REWARDS_TRANSIT"
  | "OUT_OF_TOKENS"
  | "RESTART_GAME"
  | "ERROR"
  | "RELOADING";

export interface GameStateData {
  currentGameState: GameState;
  player: PlayerData;
  banker: Banker;
  winner: number;
  deck_len: number;
  tokens: number;
  bet: number;
  bet_list: number[];
  target_phase: GameState | null;
  pre_phase: GameState | null;
  bet_type: number;
}

export interface PlayerData {
  id: string;
  hand: string[];
  sum: number;
}

export interface Banker {
  hand: string[];
  sum: number;
}

export type GameStateForClient = {
  deck_len: number;
  target_phase: GameState | null;
};

export type SessionInitResponse = {
  status: "success";
  message: string;
  user_id: string;
  client_id: string;
  tokens: number;
  game_state: GameStateForClient;
  game_state_hint: "USER_SESSION_INITIALIZED";
  total_initial_cards: number;
};

export type ErrorResponse = {
  message?: string; // Az üzenet opcionális, ha a backend nem mindig küld ilyet
  code?: string | number;
  error?: string; // Lehet, hogy a backend küld hibakódot is
  details?: string | object; // További részletek
};

export type GameStateMachineHookResult = {
  gameState: GameStateData;
  currentGameState: GameState;
  transitionToState: (
    newState: GameState,
    newData?: Partial<GameStateData>,
  ) => void;
  handleOnContinue: () => void;
  handleOnStartNew: () => void;
  handlePlaceBet: (amount: number) => Promise<void>;
  //handleDeal: () => Promise<void>; // Hozzáadva a visszatérési típushoz
  handleRetakeBet: () => void;
  handleShoeCut: (amount: number) => Promise<void>;
  handleStartGame: (type: number) => Promise<void>;
  preRewardBet: number | null;
  preRewardTokens: number | null;
  initDeckLen: number | null;
  isWFSR: boolean;
};

export const states = [
  "",
  "BLACKJACK Player won!",
  "BlackJack push",
  "BlackJack Dealer won!",
  "Push",
  "Player lost",
  "Player won",
  "Dealer won",
  "twenty one",
  "bust",
  "under 21",
  "BlackJack",
];

export const BetTypes = {
  NONE: 0,
  BANKER: 1,
  PLAYER: 2,
  TIE: 3,
};
