import React, { useEffect, useState } from "react";
import "../styles/burningCards.css";
import type { GameStateData } from "../types/game-types";
import { formatCard } from "../utilities/utils";
import { motion } from "motion/react";

// --- KOMPONENS ---
interface BurningCardsProps {
  gameState: GameStateData;
  initDeckLen: number | null;
}

const BurningCards: React.FC<BurningCardsProps> = ({
  gameState,
  initDeckLen,
}) => {
  const card = gameState.first_card;
  console.log("initDeckLen: ", initDeckLen);

  const { deck_len } = gameState;
  const [displayedDeckLen, setDisplayedDeckLen] = useState(deck_len);
  const [tmp, setTmp] = useState(initDeckLen);

  useEffect(() => {
    if (initDeckLen === null || initDeckLen <= deck_len) {
    setDisplayedDeckLen(deck_len);
    return;
  }
  
    setDisplayedDeckLen(tmp!);
    if (initDeckLen !== null && initDeckLen > deck_len) {
      const startDelay = setTimeout(() => {
        const interval = setInterval(() => {
          setDisplayedDeckLen((prevDisplayedLen) => {
            if (prevDisplayedLen <= deck_len) {
              clearInterval(interval);
              setTmp(deck_len);
              return deck_len;
            }
            return prevDisplayedLen - 1;
          });
        }, 400);
        return () => clearInterval(interval);
      }, 1700);

      return () => clearTimeout(startDelay);
    } else {
      setDisplayedDeckLen(deck_len);
    }
  }, [deck_len, initDeckLen, tmp]);

  const baseProps = {
    initial: { rotateY: 90, opacity: 0 },
    animate: { rotateY: 0, opacity: 1 },
    exit: { opacity: 0, scale: 0.8 },
    transition: { duration: 2, ease: "backOut" },
  } as const;

  return (
    <div className="cut-container">
      <div className="cut-title">B U R N</div>

      <div className="burning-card-display">
        <motion.span
          className="burning_card"
          {...baseProps} // Itt kapja meg az initial, animate, exit értékeket
          transition={{
            ...baseProps.transition,
            delay: 0.7,
          }}
        >
          {formatCard(card)}
        </motion.span>
      </div>

      <div className="burning-info-text" id="cards">
        <span className="label">Cards:</span>
        <span className="deck-count merriweatherblack">{displayedDeckLen}</span>
      </div>
    </div>
  );
};

export default BurningCards;
