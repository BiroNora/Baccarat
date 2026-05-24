import {
  BetTypes,
  type BetKey,
  type BetTypeValue,
  type GameStateData,
} from "../types/game-types";
import "../styles/betting.css";
import { formatNumber } from "../utilities/utils";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

interface BettingProps {
  gameState: GameStateData;
  onPlaceBet: (amount: number, selectedBetType: BetTypeValue) => void;
  retakeBet: (type: BetTypeValue) => void;
  onStartGame: () => void;
  isWFSR: boolean;
}

const Betting: React.FC<BettingProps> = ({
  gameState,
  onPlaceBet,
  retakeBet,
  onStartGame,
  isWFSR,
}) => {
  const { tokens, bets } = gameState;

  const [showButtons, setShowButtons] = useState(false);
  const timeoutIdRef = useRef<number | null>(null);
  const [selectedBetType, setSelectedBetType] = useState<BetTypeValue | null>(
    null,
  );

  const betAmounts = [1, 5, 10, 50, 100, 500, 1000, 5000, 10000];

  // Fogadási lehetőségek listája a rendereléshez
  const betOptions = [
    {
      id: BetTypes.DRAGON,
      label: "DRAGON",
      backendKey: "DRAGON",
      class: "dragon",
    },
    { id: BetTypes.PANDA, label: "PANDA", backendKey: "PANDA", class: "panda" },
    {
      id: BetTypes.B_PAIR,
      label: "B PAIR",
      backendKey: "B_PAIR",
      class: "b-pair",
    },
    {
      id: BetTypes.P_PAIR,
      label: "P PAIR",
      backendKey: "P_PAIR",
      class: "p-pair",
    },
    { id: BetTypes.TIE, label: "TIE", backendKey: "TIE", class: "tie" },
    {
      id: BetTypes.BANKER,
      label: "BANKER",
      backendKey: "BANKER",
      class: "banker",
    },
    {
      id: BetTypes.PLAYER,
      label: "PLAYER",
      backendKey: "PLAYER",
      class: "player",
    },
  ] as const;

  useEffect(() => {
    timeoutIdRef.current = window.setTimeout(() => {
      setShowButtons(true);
    }, 1000);

    return () => {
      if (timeoutIdRef.current !== null) {
        window.clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  const hasActiveBet = betOptions.some((option) => {
    const betKey = Object.keys(BetTypes).find(
      (key) => BetTypes[key as keyof typeof BetTypes] === option.id,
    ) as BetKey | undefined;
    return betKey ? (bets[betKey] || 0) > 0 : false;
  });

  const isTypeDisabled = (typeId: BetTypeValue) => {
    if (isWFSR) return true;

    const betKey = Object.keys(BetTypes).find(
      (key) => BetTypes[key as keyof typeof BetTypes] === typeId,
    ) as BetKey | undefined;

    if (!betKey) return false;

    if (betKey === "BANKER" && (bets["PLAYER"] || 0) > 0) return true;
    if (betKey === "PLAYER" && (bets["BANKER"] || 0) > 0) return true;

    return false;
  };

  const handleBetTypeClick = (typeId: BetTypeValue) => {
    if (isTypeDisabled(typeId)) return;
    console.log("typeId: ", typeId);
    setSelectedBetType(typeId);
    console.log("selectedBetType: ", selectedBetType);
  };

  const variants = {
    enabled: { opacity: 1, scale: 1, transition: { duration: 0.7 } },
    disabled: { opacity: 0.5, scale: 0.95, transition: { duration: 0.3 } },
    disabledByUser: { opacity: 0.7, scale: 1 },
    disabledByServer: { opacity: 0.7, scale: 1 },
  };

  const textVariants = {
    disabled: { opacity: 0.4, transition: { duration: 1 } },
    enabled: { opacity: 1, transition: { duration: 1 } },
  };

  const fadeProps = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  };

  return (
    <div className="betting-screen-container">
      {/* START GOMB */}
      <motion.button
        id="start-button"
        onClick={() => onStartGame()}
        disabled={!hasActiveBet || isWFSR}
        variants={variants}
        animate={!hasActiveBet || isWFSR ? "disabled" : "enabled"}
      >
        <motion.span variants={textVariants}>Start Game</motion.span>
      </motion.button>

      {/* FŐ FOGADÁSI TERÜLET GRID */}
      <div className="bet-type-grid">
        {betOptions.map((option) => {
          const currentBetValue = bets[option.backendKey] || 0;

          return (
            <div key={option.id} className={`bet-slot ${option.class}`}>
              <motion.button
                className={`target-selector-btn ${selectedBetType === option.id || currentBetValue > 0 ? "active" : ""}`}
                onClick={() => handleBetTypeClick(option.id)}
                disabled={isTypeDisabled(option.id)}
              >
                <span>{option.label}</span>
              </motion.button>

              {/* MINI BET KIJELZŐ - Mindig mutatja a backend szerinti összeget! */}
              <motion.button
                className={`mini-bet-display ${selectedBetType === option.id ? "focused" : ""}`}
                onClick={(e) => {
                  e.stopPropagation(); // Ne váltsa ki a szülő clicket
                  if (currentBetValue > 0) {
                    // Ha már ki volt jelölve, és újra rákattint a kis kijelzőre, akkor vonja vissza a tétet (retake)
                    retakeBet(option.id);
                  }
                }}
                disabled={isWFSR || currentBetValue === 0}
                animate={currentBetValue > 0 ? "enabled" : "disabled"}
                variants={variants}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`${option.id}-${currentBetValue}`}
                    {...fadeProps}
                  >
                    {formatNumber(currentBetValue)}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            </div>
          );
        })}
      </div>

      {/* JAVÍTVA: Szöveges logikai kiírás */}
      <div>hasActiveBet: {hasActiveBet ? "TRUE" : "FALSE"}</div>

      {/* BANK SZEKCIÓ */}
      <div className="bank-display merriweather">
        Player's bank:{"\u00A0"}
        <div className="bank-value-wrapper">
          <AnimatePresence mode="popLayout">
            <motion.span key={tokens} {...fadeProps}>
              {formatNumber(tokens)}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* ZSETONOK SZEKCIÓ */}
      <div className={`chips-section ${showButtons ? "visible" : ""}`}>
        <div className="chips-wrapper">
          <motion.button
            className="chip-btn all-in"
            onClick={() => {
              if (selectedBetType !== null) onPlaceBet(tokens, selectedBetType);
            }}
            disabled={tokens === 0 || isWFSR || selectedBetType === null}
            variants={variants}
            animate={
              tokens === 0 || selectedBetType === null ? "disabled" : "enabled"
            }
          >
            All In
          </motion.button>

          {betAmounts.map((amount) => (
            <motion.button
              key={amount}
              className="chip-btn"
              onClick={() => {
                if (selectedBetType !== null)
                  onPlaceBet(amount, selectedBetType);
              }}
              disabled={tokens < amount || isWFSR || selectedBetType === null}
              variants={variants}
              animate={
                tokens < amount || selectedBetType === null
                  ? "disabled"
                  : "enabled"
              }
            >
              {formatNumber(amount)}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Betting;
