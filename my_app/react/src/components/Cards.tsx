import type { GameStateData } from "../types/game-types";
import "../styles/cards.css";

interface CardsProps {
  gameState: GameStateData;
  initDeckLen: number | null;
  isGuest?: boolean;
  username?: string;
  onOpenAuth?: () => void;
  onOpenProfile?: () => void;
}

const Cards: React.FC<CardsProps> = ({
  gameState,
  isGuest,
  username,
  onOpenAuth,
  onOpenProfile,
}) => {
  const { deck_len } = gameState;
  const truncateUsername = (name: string, maxLen = 12) => {
    return name.length > maxLen ? name.substring(0, maxLen) + "..." : name;
  };

  return (
    <div className="cards merriweather">
      <div className="cards-left">
        <span className="label">Cards:</span>
        <span className="deck-count">{deck_len}</span>
      </div>

      <div className="cards-right">
        {isGuest ? (
          <a
            href="#auth"
            className="login-link"
            onClick={(e) => {
              e.preventDefault();
              onOpenAuth?.();
            }}
          >
            Log in / Sign up
          </a>
        ) : (
          <a
            href="#profile"
            className="login-link"
            onClick={(e) => {
              e.preventDefault();
              onOpenProfile?.();
            }}
          >
            {truncateUsername(username || "")}'s profile
          </a>
        )}
      </div>
    </div>
  );
};

export default Cards;
