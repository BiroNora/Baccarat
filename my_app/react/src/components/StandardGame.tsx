import { AnimatePresence, motion } from "motion/react";
import { states, type GameStateData } from "../types/game-types";
import { formatCard, useDelayedSum } from "../utilities/utils";
import "../styles/standardGame.css";

interface TableProps {
  gameState: GameStateData;
}

const StandardGame: React.FC<TableProps> = ({ gameState }) => {
  const { banker, player, round_result } = gameState;

  // timetable
  const CARD_1 = 0.5;
  const CARD_2 = 2;
  const SCORE_2 = 3.5;
  const CARD_3_P = 4.5;
  const SCORE_3_P = 5.5;
  const CARD_3_B = 6.5;
  const SCORE_3_B = 7.5;
  const CARD_PAIR = 3;

  const bankerCard3Time = player.hand[2] ? CARD_3_B : CARD_3_P;
  const bankerScore3Time = player.hand[2] ? SCORE_3_B : SCORE_3_P;

  const displayedBankerSum = useDelayedSum(banker.sum_2,
    banker.sum_3,
    SCORE_2,
    banker.hand[2] ? SCORE_3_B : SCORE_2);

  const displayedPlayerSum = useDelayedSum(player.sum_2,
    player.sum_3,
    SCORE_2,
    bankerScore3Time);

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

  const displayedPlayerPair = round_result.is_perfect_p_pair ? "Player Perfect Pair" : "Player Pair";
  const displayedBankerPair = round_result.is_perfect_b_pair ? "Banker Perfect Pair" : "Banker Pair";


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
          <motion.span {...baseProps} transition={{ delay: (player.hand.length === 2 && banker.hand.length === 2) ? 5.5 : 9 }}>
            <span>{states[round_result.winner]}</span>
          </motion.span>
        </div>

        <div className="card-display">
          <motion.span
            className="game_card"
            {...baseProps}
            transition={{ ...baseProps.transition, delay: bankerCard3Time }}
          >
            {formatCard(b3_card, "left")}
          </motion.span>

          <motion.span
            className="game_card"
            {...baseProps} // Itt kapja meg az initial, animate, exit értékeket
            transition={{
              ...baseProps.transition,
              delay: CARD_1,
            }}
          >
            {formatCard(b1_card)}
          </motion.span>

          <motion.span
            className="game_card"
            {...baseProps} // Itt kapja meg az initial, animate, exit értékeket
            transition={{
              ...baseProps.transition,
              delay: CARD_2,
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
                delay: CARD_PAIR,
                ease: "easeInOut",
              }}
            >
              {displayedBankerPair}
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
                    transition={{ duration: 1 }}
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
                    transition={{ duration: 1 }}
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
                delay: CARD_PAIR,
                ease: "easeInOut",
              }}
            >
              {displayedPlayerPair}
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
              delay: CARD_1,
            }}
          >
            {formatCard(p1_card)}
          </motion.span>

          <motion.span
            className="game_card"
            {...baseProps} // Itt kapja meg az initial, animate, exit értékeket
            transition={{
              ...baseProps.transition,
              delay: CARD_2,
            }}
          >
            {formatCard(p2_card)}
          </motion.span>

          <motion.span
            className="game_card"
            {...baseProps}
            transition={{ ...baseProps.transition, delay: CARD_3_P }}
          >
            {formatCard(p3_card, "right")}
          </motion.span>
        </div>
      </div>
    </>
  );
};

export default StandardGame;
