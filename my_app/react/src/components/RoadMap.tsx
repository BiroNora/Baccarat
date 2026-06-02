import React, { useEffect, useMemo, useRef } from "react";
import "../styles/roadmap.css";
import type { HistoryUnit } from "../types/game-types";

interface RoadMapProps {
  roadmapMap: Record<string, HistoryUnit[]>;
}

export const RoadMap: React.FC<RoadMapProps> = ({ roadmapMap }) => {
  const historyMap = roadmapMap;

  console.log("Kibányászott history:", historyMap);
  // Egyelőre létrehozunk egy üres 6 soros x 18 oszlopos rácsot teszteléshez
  const PLAYER_WINS = new Set([1, 4]);
  const ROWS = 6;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Nem kell COLS számolgatás!
  const gridCells = useMemo(() => {
    const keys = Object.keys(roadmapMap);
    const maxCol =
      keys.length > 0
        ? Math.max(...keys.map((k) => parseInt(k.split(":")[1])))
        : 0;

    // 1. Induláskor minimum 12 oszlop.
    // 2. Ha maxCol elérte a 11-et (vagy többet), akkor maxCol + 2 legyen.
    // Ez biztosítja, hogy a 11. oszlop után mindig legyen 2 szabad oszlop.
    const totalCols = Math.max(12, maxCol + 2);

    const cells = [];
    for (let col = 0; col < totalCols; col++) {
      for (let row = 0; row < ROWS; row++) {
        cells.push({ row, col, id: `${row}:${col}` });
      }
    }
    return cells;
  }, [roadmapMap]);

  useEffect(() => {
  if (scrollRef.current) {
    const keys = Object.keys(roadmapMap);
    const maxCol = keys.length > 0
      ? Math.max(...keys.map((k) => parseInt(k.split(":")[1])))
      : 0;

    const columnWidth = 28.8; // A CSS-edben beállított 1.8rem pixelben

    // LOGIKA:
    // Ha maxCol >= 8, akkor a görgetést úgy állítjuk be,
    // hogy a 'maxCol - 2' pozícióra ugorjon.
    // Így mindig marad 2 oszlopnyi "látómező" az utolsó golyó előtt.
    const scrollTargetCol = maxCol >= 8 ? (maxCol - 2) : 0;

    scrollRef.current.scrollTo({
      left: scrollTargetCol * columnWidth,
      behavior: "smooth"
    });
  }
}, [roadmapMap]);

  console.log("Feldolgozott history:", historyMap);

  return (
    <div className="roadmap-screen-container">
      <div className="roadmap-grid" ref={scrollRef}>
        {gridCells.map((cell) => {
          // 1. Kikeressük az adatot (ha van)
          const items = historyMap[cell.id] || [];

          return (
            // 2. A cella (fészek) MINDIG kirajzolódik
            <div key={cell.id} className="roadmap-cell">
              {/* 3. A golyó csak akkor jelenik meg, ha van 'item' */}
              {items.map((item, index) => (
                <div
                  key={index}
                  className={`bead ${PLAYER_WINS.has(item.w) ? "player" : "banker"} ${item.w === 3 || item.w === 6 ? "tie" : ""}`}
                >
                  {/* Opcionális: jelezd a döntetlent egy szöveggel vagy ikonnal */}
                  {item.w === 3 && <span className="tie-label">T</span>}
                  {item.bp && <div className="overlay-pair-banker" />}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoadMap;
