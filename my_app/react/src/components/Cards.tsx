import type { GameStateData } from "../types/game-types";
import "../styles/cards.css";

interface CardsProps {
  gameState: GameStateData;
  initDeckLen: number | null;
}

const Cards: React.FC<CardsProps> = ({ gameState }) => {
  const { deck_len } = gameState;

  return (
    <div className="cards merriweather">
      <div className="cards-left">
        <span className="label">Cards:</span>
        <span className="deck-count">{deck_len}</span>
      </div>

      <div className="cards-right">
        <a href="http://" className="login-link">
        Log in / Sign up
        </a>
      </div>
    </div>
  );
};

export default Cards;
