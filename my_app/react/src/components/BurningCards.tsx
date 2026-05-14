import React, { type JSX } from "react";
import "../styles/burningCards.css";
import type { GameStateData } from "../types/game-types";
import { ClubIcon, DiamondIcon, HeartIcon, SpadeIcon } from "./CardIcons";

// --- KOMPONENS ---
interface BurningCardsProps {
  gameState: GameStateData;
}

const BurningCards: React.FC<BurningCardsProps> = ({ gameState }) => {
  const card = gameState.first_card;

  // Segédfüggvény az ikon kiválasztásához
  const getSuitIcon = (suit: string) => {
    switch (suit) {
      case "♥": return <HeartIcon />;
      case "♦": return <DiamondIcon />;
      case "♠": return <SpadeIcon />;
      case "♣": return <ClubIcon />;
      default: return suit;
    }
  };

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
      <span style={{ display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
        <span className={suitClass}>{getSuitIcon(suit)}</span>
        <span className="merriweatherblack">{value}</span>
      </span>
    );
  };

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
