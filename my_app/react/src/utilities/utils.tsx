import type {
  ConflictDetails,
  GameStateData,
  HistoryUnit,
} from "../types/game-types";
import {
  ClubIcon,
  DiamondIcon,
  HeartIcon,
  SpadeIcon,
} from "../components/CardIcons";
import { useEffect, useState, type JSX } from "react";

export function extractGameStateData(apiResponse: unknown):
  | (Partial<GameStateData> & {
      conflict_data?: ConflictDetails;
      username?: string;
    })
  | undefined {
  if (
    typeof apiResponse !== "object" ||
    apiResponse === null ||
    !("game_state" in apiResponse) ||
    typeof (apiResponse as { game_state: unknown }).game_state !== "object" ||
    (apiResponse as { game_state: unknown }).game_state === null
  ) {
    return undefined;
  }

  //const token: number = apiResponse.current_tokens as number;
  const res = apiResponse as {
    current_tokens?: number;
    game_state: Partial<GameStateData>;
    conflict_data?: ConflictDetails;
    username?: string;
  };

  const rawGameState = res.game_state as Partial<GameStateData>;

  const historyData: HistoryUnit[] = res.game_state.history || [];

  try {
    const processedData: Partial<GameStateData> = {
      ...rawGameState,
      tokens:
        res.current_tokens ?? res.conflict_data?.current_session?.balance ?? 0,
      history: historyData,
      bets: rawGameState.bets
        ? { ...rawGameState.bets }
        : {
            PLAYER: 0,
            BANKER: 0,
            TIE: 0,
            PANDA: 0,
            DRAGON: 0,
            P_PAIR: 0,
            B_PAIR: 0,
            TOTAL: 0,
          },
      ...(typeof res.username === "string" ? { username: res.username } : {}),
      ...(res.conflict_data ? { conflict_data: res.conflict_data } : {}),
    };

    return processedData;
  } catch (e) {
    console.error("extractGameStateData error: ", e);
    return undefined;
  }
}

export function formatNumber(number: number) {
  return number.toLocaleString("en-US");
}

// Segédfüggvény az ikon kiválasztásához
export const getSuitIcon = (suit: string) => {
  switch (suit) {
    case "♥":
      return <HeartIcon />;
    case "♦":
      return <DiamondIcon />;
    case "♠":
      return <SpadeIcon />;
    case "♣":
      return <ClubIcon />;
    default:
      return suit;
  }
};

export type Rotation = "left" | "right" | null;

export const formatCard = (
  cardStr: string | null | undefined,
  rotation: Rotation = null,
): JSX.Element | string => {
  if (!cardStr) {
    return (
      <span style={{ width: "40px", display: "inline-block" }}>&nbsp;</span>
    );
  }

  const rotationMap: Record<string, string> = {
    left: "rotate(-65deg)",
    right: "rotate(-65deg)",
  };

  const suit = cardStr[0];
  const value = cardStr.substring(1).trim();

  let suitClass = "";
  if (suit === "♥" || suit === "♦") {
    suitClass = "red-suit";
  } else if (suit === "♠" || suit === "♣") {
    suitClass = "black-suit";
  } else {
    return cardStr;
  }

  return (
    <div className="card-container">
      <div
        className="card-inner"
        style={{ transform: rotation ? rotationMap[rotation] : "none" }}
      >
        <span
          className="card-front"
          style={{ display: "flex", alignItems: "center" }}
        >
          <span className={suitClass}>{getSuitIcon(suit)}</span>
          <span className="merriweatherblack">{value}</span>
        </span>
      </div>
    </div>
  );
};

type TimingConfig = {
  card_3_b: number | undefined;
  card_3_p: number | undefined;
  score_3_b: number | 0;
  score_3_p: number | 0;
  winner: number;
};

export const BACCARAT_TIMINGS: Record<string, TimingConfig> = {
  // 'B-P' formátumban kulcsolva
  "2-2": {
    card_3_b: 0,
    card_3_p: 0,
    score_3_b: 0,
    score_3_p: 0,
    winner: 4.5,
  },
  "3-2": {
    card_3_b: 4.5,
    card_3_p: 0,
    score_3_b: 5.5,
    score_3_p: 0,
    winner: 6.5,
  },
  "2-3": {
    card_3_b: 0,
    card_3_p: 4.5,
    score_3_b: 0,
    score_3_p: 5.5,
    winner: 6.5,
  },
  "3-3": {
    card_3_b: 6.5,
    card_3_p: 4.5,
    score_3_b: 7.5,
    score_3_p: 5.5,
    winner: 9,
  },
};

export const getTiming = (playerLen: number, bankerLen: number) => {
  const key = `${bankerLen}-${playerLen}`;
  // Visszaadjuk a teljes configot, vagy egy defaultot, ha a kulcs nem létezne
  return BACCARAT_TIMINGS[key] || BACCARAT_TIMINGS["2-2"];
};

export const useDelayedSum = (
  sum2: number,
  sum3: number | null | undefined,
  time2: number,
  time3: number | null | undefined,
) => {
  const [displayedSum, setDisplayedSum] = useState<number | null>(null);

  useEffect(() => {
    setDisplayedSum(null);

    const timer2 = setTimeout(() => {
      setDisplayedSum(sum2);
    }, time2 * 1000);

    let timer3: ReturnType<typeof setTimeout> | undefined;
    if (
      time3 !== null &&
      time3 !== undefined &&
      time3 > time2 &&
      sum3 !== null &&
      sum3 !== undefined
    ) {
      timer3 = setTimeout(() => {
        setDisplayedSum(sum3);
      }, time3 * 1000);
    }

    return () => {
      clearTimeout(timer2);
      if (timer3) clearTimeout(timer3);
    };
  }, [sum2, sum3, time2, time3]);

  return displayedSum;
};
