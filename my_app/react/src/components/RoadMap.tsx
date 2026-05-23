import React from "react";
import "../styles/roadmap.css"; // Mindjárt megírjuk hozzá
import type { GameStateData } from "../types/game-types";

interface RoadMapProps {
  gameState: GameStateData; // Később pontosítjuk a típusát a nyereménytörténethez
}

export const RoadMap: React.FC<RoadMapProps> = () => {
  // Egyelőre létrehozunk egy üres 6 soros x 18 oszlopos rácsot teszteléshez
  const ROWS = 6;
  const COLS = 33;

  // Generálunk egy üres mátrixot a vizuális teszthez
  const gridCells = Array.from({ length: ROWS * COLS }, (_, index) => {
    const row = index % ROWS;
    const col = Math.floor(index / ROWS);
    return { row, col, id: `${row}-${col}` };
  });

  return (
    <div className="betting-screen-container">
      <div className="roadmap-grid">
        {gridCells.map((cell) => (
          <div
            key={cell.id}
            className="roadmap-cell"
            data-row={cell.row}
            data-col={cell.col}
          >
            {/* Ide jönnek majd a színes gömbök (P, B, T, Dragon, Panda) */}
            {/* <div className="bead player"></div> */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoadMap;
