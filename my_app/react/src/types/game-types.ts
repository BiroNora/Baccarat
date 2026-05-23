export type GameState =
  | "LOADING"
  | "RECOVERY_DECISION"
  | "SHUFFLING"
  | "CUTSLIDER"
  | "SHIFTING_THE_STACKS"
  | "BURNING_CARDS"
  | "BETTING"
  | "INIT_GAME"
  | "MAIN_STAND"
  | "MAIN_STAND_NATURAL"
  | "OUT_OF_TOKENS"
  | "RESTART_GAME"
  | "ERROR"
  | "RELOADING";

export interface GameStateData {
  currentGameState: GameState;
  player: PlayerData;
  banker: BankerData;
  winner: number;
  is_player_third_card: boolean;
  is_banker_third_card: boolean;
  deck_len: number;
  tokens: number;
  bets: BetMap;
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

export interface ApiResponse {
  status: string;
  message?: string;
  current_tokens: number;
  game_state: GameStateData;      // Csak a játék adatai
  road_map?: Record<string, RoadMapUnit>; // Teljesen külön, opcionális egység!
  game_state_hint: string;
}

export interface RoadMapUnit {
  w: number;       // winner
  n: boolean;      // is_natural
  d: boolean;      // is_dragon
  p: boolean;      // is_panda
  t: number;       // tie_count (döntetlenek száma)
  bp: boolean;     // is_b_pair (Banker Pair)
  pp: boolean;     // is_p_pair (Player Pair)
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
  handlePlaceBet: (amount: number, selectedBetType: BetKey) => Promise<void>;
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
  "",                     // 0: NONE (üres vagy kör folyamatban)
  "Natural Player Won!",  // 1: NATURAL_PLAYER_WON
  "Natural Banker Won!",  // 2: NATURAL_BANKER_WON
  "Natural Tie!",         // 3: NATURAL_TIE
  "Player Won!",          // 4: PLAYER_WON
  "Banker Won!",          // 5: BANKER_WON
  "Tie!"                  // 6: TIE
];

export const sideStates: Record<number, string> = {
  3: "PLAYER PANDA 8", // BetType.PANDA.value = 3
  4: "BANKER DRAGON 7",      // BetType.DRAGON.value = 4
  5: "PLAYER PAIR",
  6: "BANKER PAIR",
};

export const BetTypes = {
  NONE: -1,
  PLAYER: 0,
  BANKER: 1,
  TIE: 2,
  PANDA: 3,
  DRAGON: 4,
  "P PAIR": 5,
  "B PAIR": 6,
};

export type BetKey = "PLAYER" | "BANKER" | "TIE" | "PANDA" | "DRAGON" | "P PAIR"| "B PAIR" | "TOTAL";

export interface BetMap {
  PLAYER: number;
  BANKER: number;
  TIE: number;
  PANDA: number;
  DRAGON: number;
  "P PAIR": number;
  "B PAIR": number;
  TOTAL: number;
  [key: string]: number | undefined;
}
