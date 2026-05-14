import React, { type JSX } from "react";
import "../styles/burningCards.css";
import type { GameStateData } from "../types/game-types";

interface BurningCardsProps {
  gameState: GameStateData;
}

const BurningCards: React.FC<BurningCardsProps> = ({ gameState }) => {
  const card = gameState.first_card;

  const formatCard = (cardStr: string | null): JSX.Element | string => {
    if (!cardStr) return "?";

    const suit = cardStr[0];
    const value = cardStr.substring(1).trim();

    let suitClass = "";
    if (suit === "♥" || suit === "♦") {
      suitClass = "red-suit";
    } else if (suit === "♠" || suit === "♣") {
      suitClass = "black-suit";
    } else {
      return cardStr;
    }

    return (
      <span style={{ whiteSpace: "nowrap" }}>
        <span className={suitClass}>{suit}</span>
        <span className="merriweatherblack">{value}</span>
      </span>
    );
  };

  return (
    <>
    <div className="cut-container">
      <div className="cut-title">B U R N</div>


      <div className="burning-card-display">
        <span className="burning_card">{formatCard(card)}</span>
      </div>

      <p className="burning-info-text">
        <i>The dealer is burning cards based on the value of the first card.</i>
      </p>
    </div>
    </>


  );
};

export default BurningCards;
