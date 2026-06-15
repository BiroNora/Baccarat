import React from "react";
import "../styles/burningCards.css";
import type { GameStateData } from "../types/game-types";
import { formatCard } from "../utilities/utils";
import { motion } from "motion/react";

// --- KOMPONENS ---
interface BurningCardsProps {
  gameState: GameStateData;
}

const BurningCards: React.FC<BurningCardsProps> = ({ gameState }) => {
  const card = gameState.first_card;

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

      <p className="burning-info-text">
        Cards burned based on the value of the first card.
      </p>
    </div>
  );
};

export default BurningCards;
