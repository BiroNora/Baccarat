import { AnimatePresence, motion } from "motion/react";
import { states, type GameStateData } from "../types/game-types";
import { formatCard, useDelayedSum } from "../utilities/utils";
import "../styles/standardGame.css";
import PandaIcon from "./PandaIcon";
import { useEffect, useState } from "react";
import DragonIcon from "./DragonIcon";
import PandaDragonIcon from "./PandaDragonIcon";
import { TIMETABLE } from "../utilities/constans";

interface TableProps {
  gameState: GameStateData;
}

const StandardGame: React.FC<TableProps> = ({ gameState }) => {
  const { banker, player, round_result } = gameState;

  const is_panda = round_result.is_panda;
  const is_dragon = round_result.is_dragon;
  //const is_panda = true;
  //const is_dragon = true;

  const [bonusState, setBonusState] = useState({
    showPanda: false,
    showDragon: false,
    showCombined: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setBonusState({
        showCombined: !!(is_panda && is_dragon),
        showPanda: !!(is_panda && !is_dragon),
        showDragon: !!(is_dragon && !is_panda),
      });
    }, TIMETABLE.ICON);

    return () => clearTimeout(timer);
  }, [is_panda, is_dragon]);

  const bankerCard3Time = player.hand[2] ? TIMETABLE.CARD_3_B : TIMETABLE.CARD_3_P;
  const bankerScore3Time = player.hand[2] ? TIMETABLE.SCORE_3_B : TIMETABLE.SCORE_3_P;

  const displayedBankerSum = useDelayedSum(
    banker.sum_2,
    banker.sum_3,
    TIMETABLE.SCORE_2,
    banker.hand[2] ? TIMETABLE.SCORE_3_B : TIMETABLE.SCORE_2,
  );

  const displayedPlayerSum = useDelayedSum(
    player.sum_2,
    player.sum_3,
    TIMETABLE.SCORE_2,
    bankerScore3Time,
  );

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

  const displayedPlayerPair = round_result.is_perfect_p_pair
    ? "Player Perfect Pair"
    : "Player Pair";
  const displayedBankerPair = round_result.is_perfect_b_pair
    ? "Banker Perfect Pair"
    : "Banker Pair";

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
          <motion.span
            {...baseProps}
            transition={{
              delay:
                player.hand.length === 2 && banker.hand.length === 2 ? TIMETABLE.WINNER_AT_HAND_2 : TIMETABLE.WINNER_AT_HAND_3,
            }}
          >
            <span>{states[round_result.winner]}</span>
          </motion.span>
        </div>

        <div className="card-display">
          <motion.span
            className="game-card"
            {...baseProps}
            transition={{ ...baseProps.transition, delay: bankerCard3Time }}
          >
            {formatCard(b3_card, "left")}
          </motion.span>

          <motion.span
            className="game-card"
            {...baseProps} // Itt kapja meg az initial, animate, exit értékeket
            transition={{
              ...baseProps.transition,
              delay: TIMETABLE.CARD_1,
            }}
          >
            {formatCard(b1_card)}
          </motion.span>

          <motion.span
            className="game-card"
            {...baseProps} // Itt kapja meg az initial, animate, exit értékeket
            transition={{
              ...baseProps.transition,
              delay: TIMETABLE.CARD_2,
            }}
          >
            {formatCard(b2_card)}
          </motion.span>

          <span className="game-card">{formatCard(null)}</span>
        </div>

        {bonusState.showCombined && (
          <div className="panda-overlay">
            <PandaDragonIcon width={270} faceColor="#e8546d" />
          </div>
        )}

        {bonusState.showPanda && (
          <div className="panda-overlay pnda">
            <PandaIcon width={270} faceColor="#e8546d" />
          </div>
        )}

        {bonusState.showDragon && (
          <div className="panda-overlay">
            <DragonIcon width={270} />
          </div>
        )}

        <div className="pair-area-wrapper">
          {has_b_pair && (
            <motion.span
              className="pair-badge player-pair"
              {...baseProps}
              transition={{
                ...baseProps.transition,
                delay: TIMETABLE.CARD_PAIR,
                ease: "easeInOut",
              }}
            >
              {displayedBankerPair}
            </motion.span>
          )}
        </div>

        <div className="label-container">
          <div className="sum-line">
            <span className="label-side">Banker</span>
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
            <span className="label-side">Player</span>
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
                delay: TIMETABLE.CARD_PAIR,
                ease: "easeInOut",
              }}
            >
              {displayedPlayerPair}
            </motion.span>
          )}
        </div>

        <div className="card-display pl">
          <span className="game-card">{formatCard(null)}</span>
          <motion.span
            className="game-card"
            {...baseProps} // Itt kapja meg az initial, animate, exit értékeket
            transition={{
              ...baseProps.transition,
              delay: TIMETABLE.CARD_1,
            }}
          >
            {formatCard(p1_card)}
          </motion.span>

          <motion.span
            className="game-card"
            {...baseProps} // Itt kapja meg az initial, animate, exit értékeket
            transition={{
              ...baseProps.transition,
              delay: TIMETABLE.CARD_2,
            }}
          >
            {formatCard(p2_card)}
          </motion.span>

          <motion.span
            className="game-card"
            {...baseProps}
            transition={{ ...baseProps.transition, delay: TIMETABLE.CARD_3_P }}
          >
            {formatCard(p3_card, "right")}
          </motion.span>
        </div>
      </div>
    </>
  );
};

export default StandardGame;
