import React from "react";
import "../styles/burningCards.css";
import type { GameStateData } from "../types/game-types";
import { formatCard } from "../utilities/utils";

// --- KOMPONENS ---
interface BurningCardsProps {
  gameState: GameStateData;
}

const BurningCards: React.FC<BurningCardsProps> = ({ gameState }) => {
  const card = gameState.first_card;

  return (
    <div className="cut-container">
      <div className="cut-title">B U R N</div>

      <div className="burning-card-display">
        <span className="burning_card">{formatCard(card)}</span>
      </div>

      <p className="burning-info-text">
        Cards burned based on the value of the first card.
      </p>
    </div>
  );
};

export default BurningCards;
