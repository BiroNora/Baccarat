export type GameState =
  | "LOADING"
  | "RECOVERY_DECISION"
  | "SHUFFLING"
  | "CUTSLIDER"
  | "SHIFTING_THE_STACKS"
  | "BURNING_CARDS"
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
  banker: BankerData;
  winner: number;
  deck_len: number;
  tokens: number;
  bets: BetMap;
  bet_list: BetListMap;
  target_phase: GameState | null;
  pre_phase: GameState | null;
  final_phase: GameState | null;
  first_card: string | null;
}

export interface PlayerData {
  hand: string[];
  sum: number;
}

export interface BankerData {
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
  handlePlaceBet: (amount: number, selectedBetType: BetKey) => Promise<void>;
  //handleDeal: () => Promise<void>; // Hozzáadva a visszatérési típushoz
  handleRetakeBet: (selectedBetType: BetKey) => void;
  handleShoeCut: (amount: number) => Promise<void>;
  handleShiftingFirstPhaseEnd: () => void;
  handleStartGame: () => Promise<void>;
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
  NONE: -1,
  PLAYER: 0,
  BANKER: 1,
  TIE: 2,
  PANDA: 3,
  DRAGON: 4,
};

export type BetKey = "PLAYER" | "BANKER" | "TIE" | "PANDA" | "DRAGON" | "TOTAL";

export interface BetMap {
  PLAYER: number;
  BANKER: number;
  TIE: number;
  PANDA: number;
  DRAGON: number;
  TOTAL: number;
  [key: string]: number | undefined;
}

export interface BetListMap {
  PLAYER: number[];
  BANKER: number[];
  TIE: number[];
  PANDA: number[];
  DRAGON: number[];
  [key: string]: number[] | undefined; // Index signature a biztonság kedvéért
}
