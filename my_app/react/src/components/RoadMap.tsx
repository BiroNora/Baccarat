import React, { useMemo } from "react";
import "../styles/roadmap.css";
import type { HistoryUnit } from "../types/game-types";

interface RoadMapProps {
  roadmapMap: Record<string, HistoryUnit>;
}

export const RoadMap: React.FC<RoadMapProps> = ({ roadmapMap }) => {
  const historyMap = roadmapMap;

  console.log("Kibányászott history:", historyMap);
  // Egyelőre létrehozunk egy üres 6 soros x 18 oszlopos rácsot teszteléshez
  const PLAYER_WINS = new Set([1, 4]);
  const BANKER_WINS = new Set([2, 5]);
  const ROWS = 6;
  const COLS = Math.max(
    33,
    Math.max(
      ...Object.keys(roadmapMap).map((key) => parseInt(key.split(":")[1])),
      0,
    ) + 5,
  );

  // Generálunk egy üres mátrixot a vizuális teszthez
  const gridCells = useMemo(() => {
    const cells = [];
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        cells.push({ row, col, id: `${row}:${col}` });
      }
    }
    return cells;
  }, [COLS]);

  console.log("Feldolgozott history:", historyMap);

  return (
    <div className="betting-screen-container">
      <div className="roadmap-grid">
        {gridCells.map((cell) => {
          // 1. Kikeressük az adatot (ha van)
          const item = historyMap[cell.id];

          return (
            // 2. A cella (fészek) MINDIG kirajzolódik
            <div key={cell.id} className="roadmap-cell">
              {/* 3. A golyó csak akkor jelenik meg, ha van 'item' */}
              {item && (PLAYER_WINS.has(item.w) || BANKER_WINS.has(item.w)) && (
                <div className={`bead ${PLAYER_WINS.has(item.w) ? "player" : "banker"}`}>
                  {/* Ide jöhet a szám vagy ikon, ha szükséges */}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoadMap;
