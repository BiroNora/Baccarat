import type { GameStateData } from "../types/game-types";
import "../styles/cards.css";

interface CardsProps {
  gameState: GameStateData;
  initDeckLen: number | null;
  onOpenAuth: () => void;
}

const Cards: React.FC<CardsProps> = ({ gameState, onOpenAuth }) => {
  const { deck_len, currentGameState } = gameState;

  return (
    <div className="cards merriweather">
      <div className="cards-left">
        <span className="label">Cards:</span>
        <span className="deck-count">{deck_len}</span>
      </div>
      
      {currentGameState === "BETTING" && (
        <div className="cards-right">
          <a
            href="#auth"
            className="login-link"
            onClick={(e) => {
              e.preventDefault();
              onOpenAuth();
            }}
          >
            Log in / Sign up
          </a>
        </div>
      )}
    </div>
  );
};

export default Cards;
