import React, { useEffect, useState } from "react";
import "../styles/burningCards.css";
import type { GameStateData } from "../types/game-types";
import { formatCard } from "../utilities/utils";
import { motion } from "motion/react";
import { BURN_TIMETABLE } from "../utilities/constans";

// --- KOMPONENS ---
interface BurningCardsProps {
  gameState: GameStateData;
  initDeckLen: number | null;
}

const BurningCards: React.FC<BurningCardsProps> = ({
  gameState,
  initDeckLen,
}) => {
  const card = gameState.first_card?.[0];

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
      // 1. Késleltetés az első csökkenésig
      const firstStepTimeout = setTimeout(() => {
        setDisplayedDeckLen((prev) => prev - 1);

        // 2. Késleltetés az interval indításáig
        const startIntervalTimeout = setTimeout(() => {
          const interval = setInterval(() => {
            setDisplayedDeckLen((prevDisplayedLen) => {
              if (prevDisplayedLen <= deck_len) {
                clearInterval(interval);
                setTmp(deck_len);
                return deck_len;
              }
              return prevDisplayedLen - 1;
            });
          }, BURN_TIMETABLE.COUNT_SPEED);
        }, BURN_TIMETABLE.PAUSE_BEFORE_COUNT);

        // Cleanup a második timeout-nak
        return () => clearTimeout(startIntervalTimeout);
      }, BURN_TIMETABLE.FIRST_STEP_DELAY);

      // Cleanup az első timeout-nak
      return () => clearTimeout(firstStepTimeout);
    } else {
      setDisplayedDeckLen(deck_len);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initDeckLen]);

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
          className="burning-card"
          {...baseProps} // Itt kapja meg az initial, animate, exit értékeket
          transition={{
            ...baseProps.transition,
            delay: 0.7,
          }}
        >
          {formatCard(card)}
        </motion.span>
      </div>

      <div className="burning-info-text">
        <span className="label">Cards:</span>
        <span className="deck-count merriweatherblack">{displayedDeckLen}</span>
      </div>
    </div>
  );
};

export default BurningCards;
