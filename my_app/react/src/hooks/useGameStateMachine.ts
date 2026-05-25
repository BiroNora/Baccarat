import { useState, useEffect, useCallback, useRef, useReducer } from "react";
import {
  initializeSessionAPI,
  setBet,
  retakeBet,
  getShuffling,
  setShoeCut,
  startGame,
  //handleStandAndRewards,
  setRestart,
  forceRestart,
  type HttpError,
} from "../api/api-calls";
import {
  BetTypes,
  type BetKey,
  type BetTypeValue,
  type GameState,
  type GameStateData,
  type GameStateMachineHookResult,
  type SessionInitResponse,
} from "../types/game-types";
import { extractGameStateData } from "../utilities/utils";
import { gameReducer, initialGameDataState } from "../context/gameReducer";

// A hook visszatérési típusa most inline van deklarálva, nincs külön 'type' definíció.
export function useGameStateMachine(): GameStateMachineHookResult {
  // isWaitingForServerResponse = isWFSR  (button disabling)
  const [isWFSR, setIsWFSR] = useState(false);
  const [state, dispatch] = useReducer(gameReducer, initialGameDataState);

  const timeoutIdRef = useRef<number | null>(null);
  // Az isMounted ref-et is használjuk a komponens mountolt állapotának követésére
  const isMountedRef = useRef(true);
  // Ez a védelmi zár (lock) az ismételt hívások ellen
  const isProcessingRef = useRef(false);
  const isAppInitializedRef = useRef(false);

  // Állapotváltó funkció a logolással és Reducer szinkronizációval
  const transitionToState = useCallback(
    (newState: GameState, newData?: Partial<GameStateData>) => {
      isProcessingRef.current = false;

      // Csak a Reducert frissítjük
      dispatch({
        type: "SYNC_SERVER_DATA",
        payload: {
          ...(newData || {}),
          currentGameState: newState,
        } as GameStateData,
      });

      //console.log(`>>> Állapotváltás: -> ${newState}`);
    },
    [dispatch],
  );

  /*const savePreActionState = useCallback(() => {
    // A 'state' a useReducer-ből jön, ez mindig a legfrissebb adatokat tartalmazza
    const currentData = state.gameState;

    if (currentData) {
      dispatch({
        type: "SET_BET_SNAPSHOTS",
        payload: {
          bets: {
            TOTAL: currentData.bets.TOTAL || 0,
          },
          tokens: currentData.tokens,
        },
      });
    }
  }, [state.gameState, dispatch]); */

  const resetGameVariables = useCallback(() => {
    dispatch({ type: "RESET_TURN_VARIABLES" });
    setIsWFSR(false);
    isProcessingRef.current = false;

    //console.log("--- Játék változók alaphelyzetbe állítva ---");
  }, [dispatch]);

  const executeAsyncAction = useCallback(
    async (actionFn: () => Promise<void>) => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      setIsWFSR(true);

      try {
        await actionFn();
        if (!isMountedRef.current) return;
      } catch (error) {
        console.error("Action error:", error);
        if (isMountedRef.current) {
          transitionToState("ERROR");
        }
      } finally {
        if (isMountedRef.current) {
          setIsWFSR(false);
          isProcessingRef.current = false;
        }
      }
    },
    [transitionToState],
  );

  const handleApiAction = useCallback(
    async <T>(apiCallFn: () => Promise<T>): Promise<T | null> => {
      try {
        return await apiCallFn();
      } catch (error) {
        const httpError = error as HttpError;
        const status = httpError.response?.status;

        console.error(
          status && status < 500 ? "Kliens hiba:" : "Szerver hiba:",
          error,
        );

        if (isMountedRef.current) {
          transitionToState("ERROR");
        }

        throw error; // Megállítja a végrehajtást a gomb-kezelőben is!
      }
    },
    [transitionToState],
  );

  const handlePlaceBet = useCallback(
    async (amount: number, selectedBetType: BetTypeValue) => {
      const currentTokens = state.gameState.tokens;
      const currentBets = state.gameState.bets;

      console.log("currentBets: on bet", currentBets);

      const betKey = Object.keys(BetTypes).find(
        (key) => BetTypes[key as keyof typeof BetTypes] === selectedBetType,
      ) as BetKey | undefined;

      if (currentTokens < amount || amount <= 0 || !betKey) return;

      if (betKey === "BANKER" && (currentBets["PLAYER"] || 0) > 0) return;
      if (betKey === "PLAYER" && (currentBets["BANKER"] || 0) > 0) return;

      executeAsyncAction(async () => {
        const data = await handleApiAction(() =>
          setBet(amount, selectedBetType),
        );

        const response = extractGameStateData(data);
        if (!response) return;

        console.log("response: on bet", response);

        transitionToState(response?.target_phase as GameState, response);
      });
    },
    [
      state.gameState.tokens,
      state.gameState.bets, // <- FONTOS: bekerült a függőségi tömbbe, mert használjuk a belső checknél!
      executeAsyncAction,
      handleApiAction,
      transitionToState,
    ],
  );

  const handleRetakeBet = useCallback(
    async (selectedBetType: BetTypeValue) => {
      const currentBets = state.gameState.bets;

      const betKey = Object.keys(BetTypes).find(
        (key) => BetTypes[key as keyof typeof BetTypes] === selectedBetType,
      ) as BetKey | undefined;

      if (
        !currentBets ||
        !betKey ||
        !currentBets[betKey] ||
        currentBets[betKey] <= 0
      ) {
        return;
      }

      executeAsyncAction(async () => {
        const data = await handleApiAction(() => retakeBet(selectedBetType));

        const response = extractGameStateData(data);
        if (!response) return;

        console.log("response: on retake bet", response);

        transitionToState(response?.target_phase as GameState, response);
      });
    },
    [
      state.gameState.bets,
      executeAsyncAction,
      handleApiAction,
      transitionToState,
    ],
  );

  const handleStartGame = useCallback(async () => {
    const response = state.gameState;

    if (!response) return;

    setIsWFSR(true);

    // A logika egyszerű: ha a szerver szerint kell valami "elő-fázis" (pl. SHUFFLING),
    // akkor oda megyünk. Ha nincs ilyen, akkor a végcélhoz (pl. INIT_GAME).
    const nextState = response.pre_phase || response.target_phase || "ERROR";

    transitionToState(nextState, response);

    setIsWFSR(false);
  }, [state.gameState, transitionToState]);

  const handleShoeCut = useCallback(
    async (amount: number) => {
      if (amount === 0 || amount === 1 || amount === 416) return;

      executeAsyncAction(async () => {
        const data = await handleApiAction(() => setShoeCut(amount));

        const response = extractGameStateData(data);
        if (!response) return;
        console.log("TARGET: ", response?.target_phase);
        transitionToState(response?.target_phase as GameState, response);
      });
    },
    [executeAsyncAction, handleApiAction, transitionToState],
  );

  const handleShiftingFirstPhaseEnd = useCallback(() => {
    if (state.gameState.currentGameState !== "SHIFTING_THE_STACKS") return;

    if (timeoutIdRef.current) window.clearTimeout(timeoutIdRef.current);

    timeoutIdRef.current = window.setTimeout(() => {
      if (isMountedRef.current) {
        const nextDestination = state.gameState.pre_phase as GameState;

        isProcessingRef.current = false; // Felszabadítjuk a zárat
        transitionToState(nextDestination, state.gameState);
      }
    }, 4000);
  }, [state.gameState, transitionToState]);

  // --- useEffect blokkok ---
  // --- SPECIAL FOR SHIFFTING AND SHOE CUT ---
  useEffect(() => {
    if (
      state.gameState.currentGameState !== "SHIFTING_THE_STACKS" ||
      isProcessingRef.current
    )
      return;

    isProcessingRef.current = true;
  }, [state.gameState.currentGameState]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;

      if (timeoutIdRef.current) {
        window.clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  // --- SPECIÁLIS EFFECT: Csak az app indulásakor/inicializálásakor ---
  // --- LOADING ---
  useEffect(() => {
    // 1. Kapuőr: Csak ha LOADING fázisban vagyunk és nem dolgozunk éppen
    if (
      state.gameState.currentGameState !== "LOADING" ||
      isProcessingRef.current
    )
      return;

    // 2. Egyszeri futás védelme
    if (isAppInitializedRef.current) return;
    isAppInitializedRef.current = true;

    isProcessingRef.current = true;
    //console.log("--- INITIALIZING SESSION INDUL ---");

    const initializeApplicationOnLoad = async () => {
      try {
        const minLoadingTimePromise = new Promise((resolve) =>
          setTimeout(resolve, 6000),
        );
        const initializationPromise = handleApiAction(initializeSessionAPI);

        const [initData] = await Promise.all([
          initializationPromise,
          minLoadingTimePromise,
        ]);

        if (!isMountedRef.current) return;

        const { tokens, game_state, total_initial_cards } =
          initData as SessionInitResponse;
        const nextPhase = game_state.target_phase as GameState;
        dispatch({
          type: "SET_CONFIG",
          payload: { totalInitialCards: total_initial_cards },
        });

        dispatch({
          type: "SET_DECK_LEN",
          payload: game_state.deck_len,
        });

        // Itt egyetlen hívással lerendezzük az adatot és a fázisváltást is a Reducerben
        transitionToState(nextPhase, { tokens, ...game_state });

        // Ezután a state.gameState.currentGameState megváltozik,
        // és ez az effekt már nem fog újra belépni a legfelső IF miatt.
      } catch (error) {
        console.error("Initialization Error: ", error);
        isProcessingRef.current = false;
        if (isMountedRef.current)
          transitionToState("ERROR", { tokens: 0, deck_len: 0 });
      }
    };

    initializeApplicationOnLoad();
  }, [state.gameState.currentGameState, transitionToState, handleApiAction]);

  // --- SHUFFLING ---
  useEffect(() => {
    if (
      state.gameState.currentGameState !== "SHUFFLING" ||
      isProcessingRef.current
    )
      return;

    isProcessingRef.current = true;
    //console.log("--- SHUFFLING INDUL ---");

    const shufflingAct = async () => {
      try {
        const data = await handleApiAction(getShuffling);
        const response = extractGameStateData(data);

        if (response) {
          // A setTimeout ID-t elmentjük, hogy törölhessük ha kell
          timeoutIdRef.current = window.setTimeout(() => {
            if (isMountedRef.current) {
              const currentDeckLen =
                response.deck_len ?? state.totalInitialCards;

              dispatch({ type: "SET_DECK_LEN", payload: currentDeckLen });
              transitionToState(response.target_phase as GameState, response);
              isProcessingRef.current = false;
            }
          }, 4000);
        }
      } catch {
        if (isMountedRef.current) {
          isProcessingRef.current = false; // Fontos felszabadítani hiba esetén is!
          // A transitionToState("ERROR")-t a handleApiAction már megcsinálta belül!
        }
      }
    };
    shufflingAct();

    // CLEANUP
    return () => {
      if (timeoutIdRef.current) {
        window.clearTimeout(timeoutIdRef.current);
      }
    };
  }, [
    handleApiAction,
    state.gameState.currentGameState,
    state.totalInitialCards,
    transitionToState,
  ]);

  // --- SHIFTING_THE_STACKS ---
  useEffect(() => {
    if (
      state.gameState.currentGameState !== "SHIFTING_THE_STACKS" ||
      isProcessingRef.current
    )
      return;

    isProcessingRef.current = true;
    //console.log("--- SHIFTING_THE_STACKS INDUL ---");
  }, [
    state.gameState.currentGameState,
    state.gameState.pre_phase,
    transitionToState,
  ]);

  // --- BURNING_CARDS ---
  useEffect(() => {
    if (
      state.gameState.currentGameState !== "BURNING_CARDS" ||
      isProcessingRef.current
    )
      return;

    isProcessingRef.current = true;
    console.log("--- BURNING_CARDS SZALAD ---");

    const target = state.gameState.final_phase as GameState;
    const data = state.gameState;

    const timer = setTimeout(() => {
      console.log("--- IDŐZÍTŐ LEJÁRT, VÁLTÁS: ", target);
      transitionToState(target, data);

      isProcessingRef.current = false;
    }, 4000);

    return () => {
      clearTimeout(timer);
      if (state.gameState.currentGameState !== "BURNING_CARDS") {
        isProcessingRef.current = false;
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.gameState.currentGameState]);

  // --- INIT_GAME ---
  useEffect(() => {
    if (
      state.gameState.currentGameState !== "INIT_GAME" ||
      isProcessingRef.current
    )
      return;

    isProcessingRef.current = true;
    console.log("--- INIT_GAME BLOKK INDUL ---");

    const initGameAct = async () => {
      try {
        setIsWFSR(true);
        resetGameVariables();

        const currentDeckLen = state.gameState.deck_len;
        dispatch({ type: "SET_DECK_LEN", payload: currentDeckLen });

        const data = await handleApiAction(() => startGame());
        const response = extractGameStateData(data);

        if (!response || !isMountedRef.current) {
          isProcessingRef.current = false;
          return;
        }
        console.log("INIT GAME TARGET: ", response.target_phase);
        transitionToState(response?.target_phase as GameState, response);
      } catch (error) {
        console.error("Init Game hiba:", error);
        isProcessingRef.current = false;
      } finally {
        if (isMountedRef.current) setIsWFSR(false);
      }
    };

    initGameAct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.gameState.currentGameState,
    transitionToState,
    handleApiAction,
    resetGameVariables,
    setIsWFSR,
  ]);

  // --- MAIN_STAND ---
  useEffect(() => {
    if (
      state.gameState.currentGameState !== "MAIN_STAND" ||
      isProcessingRef.current
    )
      return;

    isProcessingRef.current = true;
    //console.log("--- MAIN_STAND INDUL ---");

    timeoutIdRef.current = window.setTimeout(() => {
      if (isMountedRef.current) {
        isProcessingRef.current = false;
        transitionToState(
          state.gameState.final_phase as GameState,
          state.gameState,
        );
      }
    }, 4000);

    return () => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.gameState.currentGameState,
    state.gameState.pre_phase,
    transitionToState,
  ]);

  // --- MAIN_STAND_NATURAL ---
  useEffect(() => {
    if (
      state.gameState.currentGameState !== "MAIN_STAND_NATURAL" ||
      isProcessingRef.current
    )
      return;
    isProcessingRef.current = true;
    //console.log("--- MAIN_STAND_NATURAL INDUL ---");

    timeoutIdRef.current = window.setTimeout(() => {
      if (isMountedRef.current) {
        isProcessingRef.current = false;
        transitionToState(
          state.gameState.final_phase as GameState,
          state.gameState,
        );
      }
    }, 4000);

    return () => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.gameState.currentGameState,
    state.gameState.pre_phase,
    transitionToState,
  ]);

  // --- OUT_OF_TOKENS ---
  useEffect(() => {
    if (
      state.gameState.currentGameState === "OUT_OF_TOKENS" &&
      !isProcessingRef.current
    ) {
      isProcessingRef.current = true;
      setIsWFSR(true);
      const HandleOutOfTokens = async () => {
        if (!isMountedRef.current) return;

        try {
          const data = await handleApiAction(setRestart);
          if (data) {
            if (!isMountedRef.current) return;
            const response = extractGameStateData(data);
            if (response) {
              timeoutIdRef.current = window.setTimeout(() => {
                if (isMountedRef.current) {
                  resetGameVariables();
                  transitionToState("RESTART_GAME", response);
                }
              }, 5000);
            }
          }
        } catch (e) {
          console.error("Hiba a RESTART_GAME fázisban:", e);
          if (isMountedRef.current) {
            transitionToState("ERROR");
          }
        }
      };
      HandleOutOfTokens();
    }
  }, [
    state.gameState.currentGameState,
    handleApiAction,
    transitionToState,
    resetGameVariables,
  ]);

  // --- RESTART_GAME ---
  useEffect(() => {
    if (state.gameState.currentGameState === "RESTART_GAME") {
      const RestartGame = async () => {
        if (!isMountedRef.current) return;

        try {
          timeoutIdRef.current = window.setTimeout(() => {
            if (isMountedRef.current) {
              transitionToState("RELOADING", state.gameState);
            }
          }, 5000);
        } catch (e) {
          console.error("Hiba a RESTART_GAME fázisban:", e);
          if (isMountedRef.current) {
            transitionToState("ERROR");
          }
        }
      };
      RestartGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.gameState.currentGameState, resetGameVariables, transitionToState]);

  // --- ERROR ---
  useEffect(() => {
    if (state.gameState.currentGameState === "ERROR") {
      const ForceRestart = async () => {
        if (!isMountedRef.current) return;

        await new Promise((resolve) => setTimeout(resolve, 5000));

        if (!isMountedRef.current) return;

        setIsWFSR(true);

        try {
          const data = await handleApiAction(forceRestart);
          if (data) {
            if (!isMountedRef.current) return;
            const response = extractGameStateData(data);
            if (response) {
              resetGameVariables();
              transitionToState("RELOADING", response);
            }
          }
        } catch (error) {
          console.error("Hiba a kényszerített újraindítás során:", error);
        } finally {
          if (isMountedRef.current) {
            setIsWFSR(false);
          }
        }
      };
      ForceRestart();
    }
  }, [
    state.gameState.currentGameState,
    handleApiAction,
    transitionToState,
    resetGameVariables,
  ]);

  // --- RELOADING ---
  useEffect(() => {
    if (state.gameState.currentGameState === "RELOADING") {
      const Reloading = async () => {
        if (!isMountedRef.current) return;

        try {
          timeoutIdRef.current = window.setTimeout(() => {
            if (isMountedRef.current) {
              transitionToState("BETTING", state.gameState);
            }
          }, 5000);
        } catch (error) {
          console.error("Error: ", error);
        }
      };
      Reloading();
    }
  }, [state.gameState, transitionToState]);

  return {
    gameState: state.gameState,
    currentGameState: state.gameState.currentGameState,
    transitionToState,
    handleStartGame,
    handlePlaceBet,
    handleRetakeBet,
    handleShoeCut,
    handleShiftingFirstPhaseEnd,
    preRewardBet: state.preRewardBet,
    preRewardTokens: state.preRewardTokens,
    initDeckLen: state.initDeckLen,
    isWFSR,
  };
}
