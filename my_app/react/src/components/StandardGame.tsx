import { motion } from "motion/react";
import { states, type GameStateData } from "../types/game-types";
import { formatCard } from "../utilities/utils";
import "../styles/standardGame.css";

interface TableProps {
  gameState: GameStateData;
}

const StandardGame: React.FC<TableProps> = ({ gameState }) => {
  // Alapvető biztonsági ellenőrzés
  if (!gameState || !gameState.player || !gameState.banker) {
    return null;
  }

  // Minden kulcsot közvetlenül a gameState tetejéről húzunk ki az IntelliSense alapján
  const { player, banker, round_result } = gameState;
  const p1_card = player.hand[0];
  const p2_card = player.hand[1];
  const p3_card = player.hand[2];

  const b1_card = banker.hand[0];
  const b2_card = banker.hand[1];
  const b3_card = banker.hand[2];

  const props = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0, scale: 0.8 },
    transition: {
      duration: 1,
      delay: 0.9,
    },
  };

  return (
    <>
      <div className="game-container">
        <div className="winner-title">
          <motion.span {...props}>
            <span>{states[round_result.winner]}</span>
          </motion.span>
        </div>

        <div className="card-display">
          <motion.span
            className="game_card"
            initial={{ rotateY: 90, opacity: 0 }} // Kezdeti állapot (oldalról nézve)
            animate={{ rotateY: 0, opacity: 1 }} // Végállapot (szemből)
            transition={{ duration: 1, ease: "backOut", delay: 0.8 }} // Szép "rugózó" hatás
          >
            {formatCard(b3_card, "left")}
          </motion.span>
          <span className="game_card">{formatCard(b1_card)}</span>
          <span className="game_card">{formatCard(b2_card)}</span>
          <span className="game_card">{formatCard(null)}</span>
        </div>
        <div>
          <div className="sum-title" style={{ paddingTop: "1rem" }}>
            Banker: {banker.sum}
          </div>
          <div className="sum-title" style={{ paddingBottom: "1rem" }}>
            Player: {player.sum}
          </div>
        </div>
        <div className="card-display">
          <span className="game_card">{formatCard(null)}</span>
          <span className="game_card">{formatCard(p1_card)}</span>
          <span className="game_card">{formatCard(p2_card)}</span>
          <motion.span
            className="game_card"
            initial={{ rotateY: 90, opacity: 0 }} // Kezdeti állapot (oldalról nézve)
            animate={{ rotateY: 0, opacity: 1 }} // Végállapot (szemből)
            transition={{ duration: 1, ease: "backOut", delay: 0.8 }} // Szép "rugózó" hatás
          >
            {formatCard(p3_card, "right")}
          </motion.span>
        </div>
      </div>
    </>
  );
};

export default StandardGame;
