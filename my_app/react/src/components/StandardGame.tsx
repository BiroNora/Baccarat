import { AnimatePresence, motion } from "motion/react";
import { states, type GameStateData } from "../types/game-types";
import { formatCard, useDelayedSum } from "../utilities/utils";
import "../styles/standardGame.css";

interface TableProps {
  gameState: GameStateData;
}

const StandardGame: React.FC<TableProps> = ({ gameState }) => {
  const { banker, player, round_result } = gameState;

  // A hook használata:
  const displayedBankerSum = useDelayedSum(banker.sum_2, banker.sum_3);
  const displayedPlayerSum = useDelayedSum(player.sum_2, player.sum_3);

  if (
    !gameState ||
    !gameState.player ||
    !gameState.banker ||
    !gameState.round_result
  ) {
    return null;
  }

  const p1_card = player.hand[0];
  const p2_card = player.hand[1];
  const p3_card = player.hand[2];

  const b1_card = banker.hand[0];
  const b2_card = banker.hand[1];
  const b3_card = banker.hand[2];

  const has_p_pair = round_result.is_p_pair;
  const has_b_pair = round_result.is_b_pair;

  const baseProps = {
    initial: { rotateY: 90, opacity: 0 },
    animate: { rotateY: 0, opacity: 1 },
    exit: { opacity: 0, scale: 0.8 },
    transition: { duration: 8, ease: "backOut" },
  } as const;

  return (
    <>
      <div className="game-container">
        <div className="winner-title">
          <motion.span {...baseProps} transition={{ delay: (player.hand.length === 2 && banker.hand.length === 2) ? 5.5 : 8 }}>
            <span>{states[round_result.winner]}</span>
          </motion.span>
        </div>

        <div className="card-display">
          <motion.span
            className="game_card"
            {...baseProps}
            transition={{ ...baseProps.transition, delay: 4 }}
          >
            {formatCard(b3_card, "left")}
          </motion.span>

          <motion.span
            className="game_card"
            {...baseProps} // Itt kapja meg az initial, animate, exit értékeket
            transition={{
              ...baseProps.transition,
              delay: 0.5,
            }}
          >
            {formatCard(b1_card)}
          </motion.span>

          <motion.span
            className="game_card"
            {...baseProps} // Itt kapja meg az initial, animate, exit értékeket
            transition={{
              ...baseProps.transition,
              delay: 2,
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
            <span className="label-side letter">Banker</span>
            <div className="value-side">
              <AnimatePresence mode="wait">
                {displayedBankerSum !== null && (
                  <motion.span
                    key={displayedBankerSum}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                  >
                    {displayedBankerSum}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="sum-line">
            <span className="label-side letter">Player</span>
            <div className="value-side">
              <AnimatePresence mode="wait">
                {displayedPlayerSum !== null && (
                  <motion.span
                    key={displayedPlayerSum}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                  >
                    {displayedPlayerSum}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
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
            }}
          >
            {formatCard(p1_card)}
          </motion.span>

          <motion.span
            className="game_card"
            {...baseProps} // Itt kapja meg az initial, animate, exit értékeket
            transition={{
              ...baseProps.transition,
              delay: 2,
            }}
          >
            {formatCard(p2_card)}
          </motion.span>

          <motion.span
            className="game_card"
            {...baseProps}
            transition={{ ...baseProps.transition, delay: 4 }}
          >
            {formatCard(p3_card, "right")}
          </motion.span>
        </div>
      </div>
    </>
  );
};

export default StandardGame;
