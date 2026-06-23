import type { GameStateData } from "../types/game-types";
import "../styles/burningCards.css";

interface CardsProps {
  gameState: GameStateData;
  initDeckLen: number | null;
}

const Cards: React.FC<CardsProps> = ({ gameState }) => {
  const { deck_len } = gameState;

  return (
    <div className="cards merriweather">
      <span className="label">Cards:</span>
      <span className="deck-count">{deck_len}</span>
    </div>
  );
};

export default Cards;
