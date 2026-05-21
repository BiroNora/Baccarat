import { motion } from "motion/react";
import { states, type GameStateData } from "../types/game-types";

interface TableProps {
  gameState: GameStateData;
}

const Winner: React.FC<TableProps> = ({ gameState }) => {
  const { road_map } = gameState;

  if (!road_map || road_map.length === 0) {
    return <div>No rounds played yet.</div>;
  }

  const lastRound = road_map[road_map.length - 1];
  const lastWinnerName = (states)[lastRound.winner] || "Unknown";

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
    <div className="winners merriweather9black">
      <motion.span {...props}>{lastWinnerName}</motion.span>
    </div>
  );
};

export default Winner;
