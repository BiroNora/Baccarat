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
  const BANKER_WINS = new Set([2, 5]);
  const ROWS = 6;
  const scrollRef = useRef<HTMLDivElement>(null);

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
      const maxCol =
        keys.length > 0
          ? Math.max(...keys.map((k) => parseInt(k.split(":")[1])))
          : 0;

      const columnWidth = 28.8; // A CSS-edben beállított 1.8rem pixelben

      // LOGIKA:
      // Ha maxCol >= 8, akkor a görgetést úgy állítjuk be,
      // hogy a 'maxCol - 2' pozícióra ugorjon.
      // Így mindig marad 2 oszlopnyi "látómező" az utolsó golyó előtt.
      const scrollTargetCol = maxCol >= 8 ? maxCol - 2 : 0;

      scrollRef.current.scrollTo({
        left: scrollTargetCol * columnWidth,
        behavior: "smooth",
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
              {items.map((item, index) => {
                const isBankerPair = items.some(i => i.bp);
                const isPlayerPair = items.some(i => i.pp);

                if (index > 0) return null;

                const tieEvents = items.filter((i) => i.w === 3 || i.w === 6);
                const lastTieItem =
                  tieEvents.length > 0 ? tieEvents[tieEvents.length - 1] : null;
                const hasTie = !!lastTieItem;

                const num = lastTieItem ? lastTieItem.t : 0;
                console.log("NUM item.t: ", num);

                const winnerItem =
                  items.find((i) => i.w === 1 || i.w === 4) || item;

                return (
                  <div
                    key={index}
                    className={`bead
                      ${
                        PLAYER_WINS.has(winnerItem.w)
                          ? "player"
                          : BANKER_WINS.has(winnerItem.w)
                            ? "banker"
                            : "first-cell-tie"
                      } ${hasTie ? "with-tie-line" : ""}`}
                  >
                    {/* Opcionális: jelezd a döntetlent egy szöveggel vagy ikonnal */}
                    {hasTie && <span className="tie-label">{num}</span>}
                    {isBankerPair && <div className="overlay-pair-banker" />}
                    {isPlayerPair && <div className="overlay-pair-player" />}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoadMap;
