import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useReducer,
  useMemo,
} from "react";
import {
  initializeSessionAPI,
  setAuth,
  updateUsername,
  handleConflictAPI,
  checkSessionAPI,
  handleForgotPasswordAPI,
  setForgotPasswordSubmit,
  setBet,
  retakeBet,
  getShuffling,
  setShoeCut,
  startGame,
  setRestart,
  forceRestart,
  type HttpError,
} from "../api/api-calls";
import {
  BetTypes,
  type ApiResponse,
  type BetKey,
  type BetTypeValue,
  type GameState,
  type GameStateData,
  type GameStateMachineHookResult,
  type HistoryUnit,
  type SessionInitResponse,
} from "../types/game-types";
import { extractGameStateData, getTiming } from "../utilities/utils";
import { gameReducer, initialGameDataState } from "../context/gameReducer";
import { BURN_TIMETABLE, TIMETABLE } from "../utilities/constans";
import toast from "react-hot-toast";

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
  //const isAppInitializedRef = useRef(false);

  const [stableHistory, setStableHistory] = useState<HistoryUnit[]>([]);

  useEffect(() => {
    // Akkor frissítjük a stabil térkép-alapot, amikor véget ért a kör
    // (vagy amikor a fázis épp 'BETTING' lett)
    const curr_state = state.gameState.currentGameState;
    if (curr_state === "MAIN_STAND") {
      setStableHistory(state.history || []);
    }
  }, [state.gameState.currentGameState, state.history]);

  const roadmapMap = useMemo(() => {
    return stableHistory.reduce(
      (acc, unit) => {
        if (!acc[unit.coord]) {
          acc[unit.coord] = [];
        }
        acc[unit.coord].push(unit);
        /* console.log(`&&&&&& Feldolgozva: ${unit.coord}, Jelenlegi térkép:`, {
          ...acc,
        }); */
        return acc;
      },
      {} as Record<string, HistoryUnit[]>,
    );
  }, [stableHistory]);

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

  const handleAuth = useCallback(
    async (
      email: string,
      username: string,
      password: string,
      isLogIn: boolean,
    ): Promise<{ status: string } | void> => {
      if (!password || password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }
      let resultStatus = "success";

      await executeAsyncAction(async () => {
        const data = await handleApiAction(() =>
          setAuth(email, username, password, isLogIn),
        );

        const resData = data as {
          status?: string;
          is_guest?: boolean;
          username?: string;
        };
        console.log("status: ", resData.status)
        if (
          resData &&
          (resData.status === "IC" ||
            resData.status === "UAE" ||
            resData.status === "IU")
        ) {
          resultStatus = resData.status;
          return;
        }

        if (resData && resData.status === "CONFLICT") {
          resultStatus = "CONFLICT";

          const response = extractGameStateData(data);
          console.log("response.target: ", response?.target_phase)
          if (response) {
            transitionToState(response?.target_phase as GameState, response);
          }
          return;
        }

        const response = extractGameStateData(data);
        if (!response) return;

        if (resData && typeof resData.is_guest === "boolean") {
          dispatch({ type: "SET_IS_GUEST", payload: resData.is_guest });
        }
        if (response.username) {
          dispatch({ type: "SET_USERNAME", payload: response.username });
        }

        transitionToState(response?.target_phase as GameState, response);
      });

      return { status: resultStatus };
    },
    [executeAsyncAction, handleApiAction, transitionToState],
  );

  const handleUpdateUsername = useCallback(
    async (username: string): Promise<{ status: string } | void> => {
      if (!username || username.length < 3 || username.length > 25) {
        throw new Error("Username incorrect long");
      }
      let resultStatus = "success";

      await executeAsyncAction(async () => {
        const data = await handleApiAction(() => updateUsername(username));

        const resData = data as {
          status?: string;
          username?: string;
        };
        if (resData && resData.status === "IC") {
          resultStatus = resData.status;
          return;
        }

        const response = extractGameStateData(resData);
        if (!response) return;

        if (response.username) {
          dispatch({ type: "SET_USERNAME", payload: response.username });
        }

        transitionToState(response?.target_phase as GameState, response);
      });
      return { status: resultStatus };
    },
    [executeAsyncAction, handleApiAction, transitionToState],
  );

  const handleCloseNewPassCase = useCallback(() => {
    sessionStorage.removeItem("_rf_");

    transitionToState("BETTING" as GameState, { target_phase: "BETTING" });
  }, [transitionToState]);

  const handleConflict = useCallback(
    async (version_new: boolean): Promise<{ status: string } | void> => {
      let resultStatus = "success";

      await executeAsyncAction(async () => {
        const data = await handleApiAction(() =>
          handleConflictAPI(version_new),
        );

        const resData = data as { status?: string; is_guest?: boolean };
        if (resData && resData.status === "IC") {
          resultStatus = resData.status;
          return;
        }

        if (resData && typeof resData.is_guest === "boolean") {
          dispatch({ type: "SET_IS_GUEST", payload: resData.is_guest });
        }
        const response = extractGameStateData(data);
        if (!response) return;
        transitionToState(response?.target_phase as GameState, response);
      });

      return { status: resultStatus };
    },
    [executeAsyncAction, handleApiAction, transitionToState],
  );

  const handleForgotPassword = useCallback(
    async (identifier: string): Promise<{ status: string } | void> => {
      if (!identifier || identifier.trim() === "") {
        toast("Missing email address", {
          id: "forgot-pass-error",
          duration: 2000,
        });
        return;
      }

      let resultStatus = "success";

      await executeAsyncAction(async () => {
        const data = await handleApiAction(() =>
          handleForgotPasswordAPI(identifier),
        );

        const resData = data as { status?: string; token?: string };
        if (resData && resData.status === "IC") {
          resultStatus = "IC";
          return;
        }

        // Token mentése sessionStorage-ba
        if (resData?.token) {
          sessionStorage.setItem("_rf_", resData.token);
        }

        const response = extractGameStateData(data);
        if (!response) return;
        transitionToState(response?.target_phase as GameState, response);
      });
      return { status: resultStatus };
    },
    [executeAsyncAction, handleApiAction, transitionToState],
  );

  const handleForgotPasswordSubmit = useCallback(
    async (
      token: string,
      password: string,
    ): Promise<{ status: string } | void> => {
      let resultStatus = "success";

      await executeAsyncAction(async () => {
        const data = await handleApiAction(() =>
          setForgotPasswordSubmit(token, password),
        );

        const resData = data as { status?: string };
        if (resData && resData.status === "IC") {
          resultStatus = resData.status;
          return;
        }

        const response = extractGameStateData(data);
        if (!response) return;
        transitionToState(response?.target_phase as GameState, response);
      });

      return { status: resultStatus };
    },
    [executeAsyncAction, handleApiAction, transitionToState],
  );

  // Ez fut le, ha a felhasználó kihagyja az auth-ot ("No, thanks")
  const handleSkipAuth = useCallback(async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsWFSR(true);

    try {
      const minLoadingTimePromise = new Promise((resolve) =>
        setTimeout(resolve, 2000),
      );

      const initializationPromise = handleApiAction(() =>
        initializeSessionAPI(true),
      );

      const [initData] = await Promise.all([
        initializationPromise,
        minLoadingTimePromise,
      ]);
      if (!initData || !isMountedRef.current) return;

      const { tokens, game_state } = initData as SessionInitResponse;
      const nextPhase = game_state.target_phase as GameState;

      dispatch({
        type: "SET_DECK_LEN",
        payload: game_state.deck_len,
      });

      transitionToState(nextPhase, { tokens, ...game_state });
    } catch (error) {
      console.error("Initialization Error: ", error);
      if (isMountedRef.current) {
        transitionToState("ERROR", { tokens: 0, deck_len: 0 });
      }
    } finally {
      if (isMountedRef.current) {
        setIsWFSR(false);
        isProcessingRef.current = false;
      }
    }
  }, [handleApiAction, transitionToState]);

  const handlePlaceBet = useCallback(
    async (amount: number, selectedBetType: BetTypeValue) => {
      const currentTokens = state.gameState.tokens;
      const currentBets = state.gameState.bets;

      const betKey = Object.keys(BetTypes).find(
        (key) => BetTypes[key as keyof typeof BetTypes] === selectedBetType,
      ) as BetKey | undefined;

      if (currentTokens < amount || amount <= 0 || !betKey) return;

      if (betKey === "BANKER" && (currentBets["PLAYER"] || 0) > 0) return;
      if (betKey === "PLAYER" && (currentBets["BANKER"] || 0) > 0) return;

      const isMainBet = betKey === "BANKER" || betKey === "PLAYER";
      const hasMainBet =
        (currentBets["BANKER"] || 0) > 0 || (currentBets["PLAYER"] || 0) > 0;

      // Mellékfogadás fő tét nélkül ell.
      if (!isMainBet && !hasMainBet) {
        toast("Player or Banker bet is a must", {
          id: "must-bet-error", // Ez a kulcs: mindegyik ugyanazt az ID-t kapja
          duration: 2000, // Kicsit rövidebb idő, hogy gyorsan eltűnjön
        });
        return;
      }

      executeAsyncAction(async () => {
        const data = await handleApiAction(() =>
          setBet(amount, selectedBetType),
        );

        const response = extractGameStateData(data);
        if (!response) return;

        if (response.username) {
          dispatch({ type: "SET_USERNAME", payload: response.username });
        }

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

        if (response.username) {
          dispatch({ type: "SET_USERNAME", payload: response.username });
        }

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

    const { bets } = response;
    const bankerBet = bets?.["BANKER"] || 0;
    const playerBet = bets?.["PLAYER"] || 0;
    const totalBet = bets?.["TOTAL"] || 0;

    const hasMainBet = bankerBet > 0 || playerBet > 0;
    const hasBoth = bankerBet > 0 && playerBet > 0;

    if (totalBet === 0 || !hasMainBet || hasBoth) {
      toast("Player or Banker bet is a must", {
        id: "must-bet-error", // Ez a kulcs: mindegyik ugyanazt az ID-t kapja
        duration: 2000,
      });
      return;
    }

    setIsWFSR(true);

    // A logika egyszerű: ha a szerver szerint kell valami "elő-fázis" (pl. SHUFFLING),
    // akkor oda megyünk. Ha nincs ilyen, akkor a végcélhoz (pl. INIT_GAME).
    const nextState = response.pre_phase || response.target_phase || "ERROR";

    transitionToState(nextState, response);

    setIsWFSR(false);
  }, [state.gameState, transitionToState]);

  const handleShoeCut = useCallback(
    async (amount: number) => {
      if (amount === 0 || amount === 1 || amount === state.initDeckLen) return;

      executeAsyncAction(async () => {
        const data = await handleApiAction(() => setShoeCut(amount));

        const response = extractGameStateData(data);
        if (!response) return;
        transitionToState(response?.target_phase as GameState, response);
      });
    },
    [executeAsyncAction, handleApiAction, transitionToState, state.initDeckLen],
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
  // --- ÚJRATÖLTÉS, INDÍTÁS ---
  useEffect(() => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const checkExistingSession = async () => {
      try {
        // Ellenőrizzük a session-t
        const sessionData = (await handleApiAction(() =>
          checkSessionAPI(),
        )) as ApiResponse;
        const response = extractGameStateData(sessionData);

        const resData = sessionData as {
          is_guest?: boolean;
          username?: string;
        };
        if (resData && typeof resData.is_guest === "boolean") {
          dispatch({ type: "SET_IS_GUEST", payload: resData.is_guest });
        }
        if (resData.username) {
          dispatch({ type: "SET_USERNAME", payload: resData.username });
        }

        if (
          isMountedRef.current &&
          response &&
          sessionData &&
          sessionData.status === "success"
        ) {
          if (sessionData.history && typeof setStableHistory === "function") {
            setStableHistory(sessionData.history);
          }

          transitionToState(response.target_phase as GameState, response);
        } else {
          isProcessingRef.current = false;
        }
      } catch {
        if (isMountedRef.current) {
          isProcessingRef.current = false;
          // A transitionToState("ERROR")-t a handleApiAction már megcsinálta belül!
        }
      }
    };

    checkExistingSession();
  }, [handleApiAction, transitionToState]);

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
        const currentDeckLen = response?.deck_len;
        dispatch({ type: "SET_DECK_LEN", payload: currentDeckLen! });

        if (response) {
          // A setTimeout ID-t elmentjük, hogy törölhessük ha kell
          timeoutIdRef.current = window.setTimeout(() => {
            if (isMountedRef.current) {
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
    //console.log("--- BURNING_CARDS SZALAD ---");

    const target = state.gameState.final_phase as GameState;
    const data = state.gameState;

    if (!data || !data.first_card) {
      return;
    }
    const timing = data.first_card[1] * BURN_TIMETABLE.COUNT_SPEED + 3500;

    const timer = setTimeout(() => {
      //console.log("--- IDŐZÍTŐ LEJÁRT, VÁLTÁS: ", target);
      const currentDeckLen = data.deck_len;
      dispatch({ type: "SET_DECK_LEN", payload: currentDeckLen });

      transitionToState(target, data);

      isProcessingRef.current = false;
    }, timing);

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
    //console.log("--- INIT_GAME BLOKK INDUL ---");

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
    const { currentGameState, final_phase, player, banker, round_result } =
      state.gameState;
    if (currentGameState !== "MAIN_STAND" || isProcessingRef.current) return;

    isProcessingRef.current = true;
    //console.log("--- MAIN_STAND INDUL ---");
    const timings = getTiming(player.hand.length, banker.hand.length);
    const winnerTime = timings.winner * 1000 + 300;

    const iconTime =
      round_result.is_panda || round_result.is_dragon ? TIMETABLE.ICON_GS : 0;

    const hasAnyPair =
      round_result.is_p_pair ||
      round_result.is_b_pair ||
      round_result.is_perfect_p_pair ||
      round_result.is_perfect_b_pair;
    const pairTime = hasAnyPair ? TIMETABLE.CARD_PAIR_GS : 0;

    const timing = winnerTime + iconTime + pairTime + 4000;

    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        isProcessingRef.current = false;

        transitionToState(final_phase as GameState, state.gameState);
      }
    }, timing);

    return () => {
      clearTimeout(timer);
      isProcessingRef.current = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.gameState.currentGameState,
    state.gameState.final_phase,
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
          }, 9000);
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
    isGuest: state.isGuest,
    roadmapMap,
    transitionToState,
    handleAuth,
    handleUpdateUsername,
    handleConflict,
    handleCloseNewPassCase,
    handleForgotPassword,
    handleForgotPasswordSubmit,
    handleSkipAuth,
    handleStartGame,
    handlePlaceBet,
    handleRetakeBet,
    handleShoeCut,
    handleShiftingFirstPhaseEnd,
    initDeckLen: state.initDeckLen,
    isWFSR,
  };
}
