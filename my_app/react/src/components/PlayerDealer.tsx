import React, { type JSX } from "react";
import { motion } from "motion/react";
import { type GameStateData } from "../types/game-types";
import "../styles/playerDealer.css";

interface TableProps {
  gameState: GameStateData;
}

const PlayerDealer: React.FC<TableProps> = ({ gameState }) => {
  if (!gameState || !gameState.player || !gameState.banker) {
    return null;
  }
  const { player, banker } = gameState;

  const formatCard = (card: string): JSX.Element | string => {
    const suit = card[0]; // Az első karakter a szín
    const value = card.substring(1).trim(); // A többi karakter az érték

    let suitClass = "";
    if (suit === "♥" || suit === "♦") {
      suitClass = "red-suit";
    } else if (suit === "♠" || suit === "♣") {
      suitClass = "black-suit";
    } else {
      return card; // Visszaadja a nyers stringet, ha nem felismerhető a szín
    }

    return (
      <React.Fragment>
        <span style={{ whiteSpace: "nowrap" }}>
          <span className={suitClass}>{suit}</span>
          <span className="merriweatherblack">{value}</span>
        </span>
      </React.Fragment>
    );
  };

  const formatHand = (cardStrings: string[]): JSX.Element[] => {
    const formattedElements = cardStrings.map((cardString, index) => {
      const separator =
        index > 0 ? (
          <span
            key={`hand-sep-${index}`}
            className="equal-text1 merriweather5grey"
          >
            {" "}
            +{" "}
          </span>
        ) : null;

      return (
        <React.Fragment key={cardString + index}>
          {separator} {formatCard(cardString)}{" "}
        </React.Fragment>
      );
    });

    return formattedElements;
  };

  const loop = (data: string[]): string[] => {
    return data.map((card) => String(card).trim());
  };



  //const shouldShowScore = currentGameState !== "SPLIT_FINISH";

  const playerHand = loop(player.hand);
  const dealerHand = loop(banker.hand);

  const formattedPlayerHand = formatHand(playerHand);
  const formattedDealerHand =
    dealerHand.length === 0 ? (
      <span className="opacity-0"> &nbsp;&nbsp; </span>
    ) : (
      formatHand(dealerHand)
    );

  const sum =
    banker.sum === 0 ? <span className="opacity-0"> &nbsp; </span> : banker.sum;

  const fadeProps = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: {
      duration: 1,
      delay: 0.3,
    },
  };

  /* const fadeProps1 = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: {
      duration: 0.8,
    },
  }; */

  return (
    <div>
      <div id="dealer-hand" className="play">
        <motion.div
          key={`d-hand-${dealerHand.length}`}
          {...fadeProps}
          className="hand hand-area-wrapper"
        >
          {formattedDealerHand}
        </motion.div>
        <div className="score-area-wrapper">
          <motion.span

            {...fadeProps}
            className="score-mood merriweather5grey2 animate-fade"
          >
            {}
          </motion.span>
        </div>
        <div className="band-area-wrapper">
          <span className="label-text">Dealer: </span>
          <motion.span
            key={`d-sum-${banker.sum}`}
            {...fadeProps}
            className="label-text1 animate-fade"
          >
            {sum}
          </motion.span>
        </div>
      </div>
      <div id="player-hand" className="play">
        <div className="band-area-wrapper">
          <span className="label-text">Player: </span>
          <span className="label-text1">{player.sum}</span>
        </div>
        <div className="score-area-wrapper">

        </div>
        <div className="hand hand-area-wrapper">{formattedPlayerHand}</div>
      </div>
    </div>
  );
};

export default PlayerDealer;
