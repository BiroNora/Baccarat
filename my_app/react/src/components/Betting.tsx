import { type BetKey, type GameStateData } from "../types/game-types";
import "../styles/betting.css";
import { formatNumber } from "../utilities/utils";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

interface BettingProps {
  gameState: GameStateData;
  onPlaceBet: (amount: number, selectedBetType: BetKey) => void;
  retakeBet: (type: BetKey) => void;
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
  const [selectedBetType, setSelectedBetType] = useState<BetKey | null>(null);

  const betAmounts = [1, 5, 10, 50, 100, 500, 1000, 5000, 10000];

  // Fogadási lehetőségek listája a rendereléshez
  const betOptions = [
    { id: "DRAGON", label: "DRAGON", class: "dragon" },
    { id: "PANDA", label: "PANDA", class: "panda" },
    { id: "TIE", label: "TIE", class: "tie" },
    { id: "BANKER", label: "BANKER", class: "banker" },
    { id: "PLAYER", label: "PLAYER", class: "player" },
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

  const hasActiveBet = betOptions.some((option) => (bets[option.id] || 0) > 0);

  const isTypeDisabled = (typeKey: BetKey) => {
    if (isWFSR) return true;

    if (typeKey === "BANKER" && (bets["PLAYER"] || 0) > 0) return true;
    if (typeKey === "PLAYER" && (bets["BANKER"] || 0) > 0) return true;

    return false;
  };

  const handleBetTypeClick = (typeKey: BetKey) => {
    if (isTypeDisabled(typeKey)) return;
    setSelectedBetType(typeKey);
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
        animate={
          !hasActiveBet || isWFSR
            ? "disabled"
            : "enabled"
        }
      >
        <motion.span variants={textVariants}>Start Game</motion.span>
      </motion.button>

      {/* FŐ FOGADÁSI TERÜLET GRID */}
      <div className="bet-type-grid">
        {betOptions.map((option) => (
          <div key={option.id} className={`bet-slot ${option.class}`}>
            <motion.button
              className={`target-selector-btn ${selectedBetType === option.id ? "active" : ""}`}
              onClick={() => handleBetTypeClick(option.id)}
              disabled={isTypeDisabled(option.id)}
            >
              <span>{option.label}</span>
            </motion.button>

            {/* MINI BET KIJELZŐ - Mindig mutatja a backend szerinti összeget! */}
            <motion.button
              className="mini-bet-display"
              onClick={(e) => {
                e.stopPropagation(); // Ne váltsa ki a szülő clicket
                const currentBet = bets[option.id] || 0;
                if (currentBet > 0) retakeBet(option.id);
                if (selectedBetType === option.id) {
                    setSelectedBetType(null);
                  }
              }}
              disabled={isWFSR || (bets[option.id] || 0) === 0}
              animate={(bets[option.id] || 0) > 0 ? "enabled" : "disabled"}
              variants={variants}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={`${option.id}-${bets[option.id]}`}
                  {...fadeProps}
                >
                  {formatNumber(bets[option.id] || 0)}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>
        ))}
      </div>

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
