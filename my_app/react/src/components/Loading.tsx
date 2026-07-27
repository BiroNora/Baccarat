import "../styles/loading.css";
import "../styles/auth.css";
import { useState } from "react";

interface LoadingProps {
  onOpenAuth: () => void;
  onSkipAuth: () => void;
  isAuthOpen: boolean;
}

const Loading: React.FC<LoadingProps> = ({
  onOpenAuth,
  onSkipAuth,
  isAuthOpen,
}) => {
  const [isClicked, setIsClicked] = useState(false);
  const shouldHideLoading = isClicked || isAuthOpen;

  return (
    <>
      {!shouldHideLoading && (
        <div className="loading-container-centered">
          <h1>
            L O A D I N G<span className="dot dot-1">.</span>
            <span className="dot dot-2">.</span>
            <span className="dot dot-3">.</span>
          </h1>
        </div>
      )}

      <div className="text">
        <button
          className="submit-btn"
          onClick={(e) => {
            e.preventDefault();
            setIsClicked(true);
            onOpenAuth();
          }}
        >
          Log in to save your scores
        </button>
      </div>
      <div className="text">
        <button
          className="submit-btn"
          onClick={(e) => {
            e.preventDefault();
            onSkipAuth();
          }}
        >
          No, thanks
        </button>
      </div>
    </>
  );
};

export default Loading;
