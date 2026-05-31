import React, { useMemo } from "react";
import "../styles/roadmap.css";
import type { HistoryUnit } from "../types/game-types";

interface RoadMapProps {
  history: HistoryUnit[] | undefined;
}

export const RoadMap: React.FC<RoadMapProps> = ({ history = [] }) => {
  const historyMap = useMemo(() => {
    return history.reduce(
      (acc, item) => {
        const [row, col] = item.coord.split(":").map(Number);
        acc[`${row}-${col}`] = item; // Kulcs: "0-0", Érték: maga a lépés objektum
        return acc;
      },
      {} as Record<string, HistoryUnit>,
    );
  }, [history]);

  console.log("Kibányászott history:", history);
  // Egyelőre létrehozunk egy üres 6 soros x 18 oszlopos rácsot teszteléshez
  const ROWS = 6;
  const COLS = Math.max(
    33,
    Math.max(
      ...(history?.map((h) => parseInt(h.coord.split(":")[1])) ?? []),
      0,
    ) + 5,
  );

  // Generálunk egy üres mátrixot a vizuális teszthez
  const gridCells = useMemo(() => {
    const cells = [];
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        cells.push({ row, col, id: `${row}-${col}` });
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
              {item && (
                <div className={`bead ${item.w === 1 ? "player" : "banker"}`}>
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
