import type {
  ApiResponse,
  GameStateData,
  HistoryUnit,
} from "../types/game-types";
import {
  ClubIcon,
  DiamondIcon,
  HeartIcon,
  SpadeIcon,
} from "../components/CardIcons";
import type { JSX } from "react";

export function extractGameStateData(
  apiResponse: unknown,
): Partial<GameStateData> | undefined {
  if (
    typeof apiResponse !== "object" ||
    apiResponse === null ||
    !("current_tokens" in apiResponse) ||
    typeof (apiResponse as { current_tokens: unknown }).current_tokens !==
      "number" ||
    !("game_state" in apiResponse) ||
    typeof (apiResponse as { game_state: unknown }).game_state !== "object" ||
    (apiResponse as { game_state: unknown }).game_state === null
  ) {
    return undefined;
  }

  //const token: number = apiResponse.current_tokens as number;
  const typedResponse = apiResponse as ApiResponse;
  const rawGameState = (apiResponse as { game_state: GameStateData })
    .game_state;

  const historyData: HistoryUnit[] = typedResponse.history || [];

  try {
    const processedData: Partial<GameStateData> = {
      ...rawGameState,
      tokens: typedResponse.current_tokens,
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
    left: "rotate(-90deg)",
    right: "rotate(90deg)",
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
