import type { ApiResponse, GameStateData, RoadMapData } from "../types/game-types";

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
  const rawGameState = (apiResponse as { game_state: GameStateData }).game_state;

  const roadMapData: RoadMapData = typedResponse.road_map || {};

  try {
    const processedData: Partial<GameStateData> = {
      ...rawGameState,
      tokens: typedResponse.current_tokens,
      road_map: roadMapData,
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
