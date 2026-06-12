import React, { useEffect, useMemo, useRef } from "react";
import "../styles/roadmap.css";
import type { HistoryUnit } from "../types/game-types";
import PandaIcon from "./PandaIcon";
import DragonIcon from "./DragonIcon";
import PandaDragonIcon from "./PandaDragonIcon";

interface RoadMapProps {
  roadmapMap: Record<string, HistoryUnit[]>;
}

const RoadMapComponent = ({ roadmapMap }: RoadMapProps) => {
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

      // Ha még kevés az oszlop, maradj az elején
      if (maxCol <= 7) {
        scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
        return;
      }

      // 1. Megkeressük a gridben azokat a cellákat, amik a cél oszlopban vannak.
      // Mivel a grided flex/grid layout, keressünk egy példa cellát,
      // ami az adott oszlopban van (pl. a 0. sor, target oszlop).
      const targetCol = maxCol - 1;

      // A DOM-ból kérjük le az oszlop szélességét dinamikusan
      const grid = scrollRef.current;
      const firstCell = grid.querySelector(".roadmap-cell") as HTMLElement;

      if (firstCell) {
        // Az oszlop szélessége = cella szélessége + esetleges margin/gap
        const style = window.getComputedStyle(firstCell);
        const colWidth =
          firstCell.offsetWidth +
          parseFloat(style.marginRight || "0") +
          parseFloat(style.marginLeft || "0");

        grid.scrollTo({
          left: targetCol * colWidth,
          //behavior: "smooth",
        });
      }
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
                const isBankerPair = items.some((i) => i.bp);
                const isPlayerPair = items.some((i) => i.pp);
                const isPanda = items.some((i) => i.p);
                const isDragon = items.some((i) => i.d);
                const isNatural = items.some((i) => i.n);

                if (index > 0) return null;

                const tieEvents = items.filter((i) => i.w === 3 || i.w === 6);
                const lastTieItem =
                  tieEvents.length > 0 ? tieEvents[tieEvents.length - 1] : null;
                const hasTie = !!lastTieItem;
                const num = lastTieItem?.t ?? 0;
                const tieText = hasTie && num > 1 ? num.toString() : "";
                const naturalText = isNatural ? "N" : "";
                const displayLabel = naturalText + tieText;
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
                    {displayLabel && (
                      <span className={`tie-label ${isNatural ? "nat" : ""}`}>
                        {displayLabel}
                      </span>
                    )}
                    {isBankerPair && <div className="overlay-pair-banker" />}
                    {isPlayerPair && <div className="overlay-pair-player" />}
                    {isPanda && isDragon ? (
                      <div className="overlay-panda">
                        <PandaDragonIcon width={20} />
                      </div>
                    ) : (
                      <>
                        {isPanda && (
                          <div className="overlay-panda">
                            <PandaIcon width={20} />
                          </div>
                        )}
                        {isDragon && (
                          <div className="overlay-panda">
                            <DragonIcon width={20} />
                          </div>
                        )}
                      </>
                    )}
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

export const RoadMap = React.memo(RoadMapComponent);
