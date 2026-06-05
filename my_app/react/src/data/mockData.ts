import type { HistoryUnit } from "../types/game-types";

export const mockRoadmapMap: Record<string, HistoryUnit[]> = {
  // A 0:0-s cellában két esemény van: egy Tie és egy Banker
  "0:0": [
    { coord: '0:0', w: 3, t: 1, bp: false }, // Az 1. kör: Tie
    { coord: '0:0', w: 3, t: 2, bp: false }, // A 2. kör: Tie
    { coord: '0:0', w: 1, t: 0, bp: true }   // A 3. kör: Player piros pöttyel
  ],
  // A 0:1-es cellában egy sima Banker
  "0:1": [
    { coord: '0:1', w: 2, t: 0, bp: true } // A 4. kör: Banker piros pöttyel
  ],
  "0:2": [
    { coord: '0:2', w: 1, t: 0, bp: true, pp: true } // Az 5. kör: Player piros/kék pöttyel
  ],
  "0:3": [
    { coord: '0:3', w: 5, t: 0, bp: true, pp: true }, // A 6. kör: Banker piros/kék pöttyel
    { coord: '0:3', w: 3, t: 1, bp: false }
  ],
  "0:4": [
    { coord: '0:4', w: 1, t: 0, p: true, bp: true } // Az 5. kör: Player piros/kék pöttyel
  ],
  "0:5": [
    { coord: '0:5', w: 5, t: 0, d: true } // Az 5. kör: Player piros/kék pöttyel
  ],
  "0:6": [
    { coord: '0:5', w: 5, t: 0, d: true } // Az 5. kör: Player piros/kék pöttyel
  ],
  "0:7": [
    { coord: '0:5', w: 5, t: 0, d: true } // Az 5. kör: Player piros/kék pöttyel
  ],
};
