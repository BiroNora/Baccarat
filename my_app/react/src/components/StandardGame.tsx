import { motion } from "motion/react";
import { states, type GameStateData } from "../types/game-types";
import { formatCard } from "../utilities/utils";
import "../styles/standardGame.css";

interface TableProps {
  gameState: GameStateData;
}

const StandardGame: React.FC<TableProps> = ({ gameState }) => {
  // Alapvető biztonsági ellenőrzés
  if (
    !gameState ||
    !gameState.player ||
    !gameState.banker ||
    !gameState.round_result
  ) {
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

  const has_p_pair = round_result.is_p_pair;
  const has_b_pair = round_result.is_b_pair;

  const baseProps = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0, scale: 0.8 },
    transition: { duration: 7 }, // Itt csak az alapokat tartod
  };

  return (
    <>
      <div className="game-container">
        <div className="winner-title">
          <motion.span
            {...baseProps}
            transition={{ ...baseProps.transition, delay: 5 }}
          >
            <span>{states[round_result.winner]}</span>
          </motion.span>
        </div>

        <div className="card-display">
          <motion.span
            className="game_card"
            initial={{ rotateY: 90, opacity: 0 }} // Kezdeti állapot (oldalról nézve)
            animate={{ rotateY: 0, opacity: 1 }} // Végállapot (szemből)
            transition={{ duration: 1, ease: "backOut", delay: 3.5 }} // Szép "rugózó" hatás
          >
            {formatCard(b3_card, "left")}
          </motion.span>

          <motion.span
            className="game_card"
            {...baseProps} // Itt kapja meg az initial, animate, exit értékeket
            transition={{
              ...baseProps.transition,
              delay: 0.5,
              ease: "backOut",
            }}
          >
            {formatCard(b1_card)}
          </motion.span>

          <motion.span
            className="game_card"
            {...baseProps} // Itt kapja meg az initial, animate, exit értékeket
            transition={{
              ...baseProps.transition,
              delay: 1.5,
              ease: "backOut",
            }}
          >
            {formatCard(b2_card)}
          </motion.span>

          <span className="game_card">{formatCard(null)}</span>
        </div>

        <div className="pair-area-wrapper">
          {has_b_pair && (
            <motion.span
              className="pair-badge player-pair"
              {...baseProps}
              transition={{
                ...baseProps.transition,
                delay: 2.5,
                ease: "easeInOut",
              }}
            >
              Banker Pair
            </motion.span>
          )}
        </div>

        <div className="label-container">
          <div className="sum-line">
            <span className="label-side">Banker:</span>
            <span className="value-side">{banker.sum_2}</span>
          </div>
          <div className="sum-line">
            <span className="label-side">Banker:</span>
            <span className="value-side">{banker.sum_3}</span>
          </div>

          <div className="sum-line letter_p">
            <span className="label-side">Player:</span>
            <span className="value-side">{player.sum_2}</span>
          </div>
          <div className="sum-line letter_p">
            <span className="label-side">Player:</span>
            <span className="value-side">{player.sum_3}</span>
          </div>
        </div>

        <div className="pair-area-wrapper p_pair">
          {has_p_pair && (
            <motion.span
              className="pair-badge player-pair"
              {...baseProps}
              transition={{
                ...baseProps.transition,
                delay: 2.5,
                ease: "easeInOut",
              }}
            >
              Player Pair
            </motion.span>
          )}
        </div>

        <div className="card-display">
          <span className="game_card">{formatCard(null)}</span>
          <motion.span
            className="game_card"
            {...baseProps} // Itt kapja meg az initial, animate, exit értékeket
            transition={{
              ...baseProps.transition,
              delay: 0.5,
              ease: "backOut",
            }}
          >
            {formatCard(p1_card)}
          </motion.span>

          <motion.span
            className="game_card"
            {...baseProps} // Itt kapja meg az initial, animate, exit értékeket
            transition={{
              ...baseProps.transition,
              delay: 1.5,
              ease: "backOut",
            }}
          >
            {formatCard(p2_card)}
          </motion.span>

          <motion.span
            className="game_card"
            initial={{ rotateY: 90, opacity: 0 }} // Kezdeti állapot (oldalról nézve)
            animate={{ rotateY: 0, opacity: 1 }} // Végállapot (szemből)
            transition={{ duration: 1, ease: "backOut", delay: 3.5 }} // Szép "rugózó" hatás
          >
            {formatCard(p3_card, "right")}
          </motion.span>
        </div>
      </div>
    </>
  );
};

export default StandardGame;
