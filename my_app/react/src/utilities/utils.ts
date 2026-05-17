import type {
  GameStateData,
  RoadMapUnit,
} from "../types/game-types";

export function extractGameStateData(
  apiResponse: unknown,
): Partial<GameStateData> | undefined {
  if (
    typeof apiResponse !== "object" ||
    apiResponse === null ||
    !("current_tokens" in apiResponse) ||
    typeof (apiResponse as { current_tokens: unknown }).current_tokens !==
      "number" ||
    !("road_map" in apiResponse) ||
    !Array.isArray((apiResponse as { road_map: unknown }).road_map) ||
    !("game_state" in apiResponse) ||
    typeof (apiResponse as { game_state: unknown }).game_state !== "object" ||
    (apiResponse as { game_state: unknown }).game_state === null
  ) {
    return undefined;
  }

  const token: number = apiResponse.current_tokens as number;
  const roadMapData = apiResponse.road_map as RoadMapUnit[];
  const rawGameState = apiResponse.game_state as Partial<GameStateData>; // Típus kényszerítés itt

  try {
    const processedData: Partial<GameStateData> = {
      ...rawGameState,
      tokens: token,
      road_map: roadMapData,
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
