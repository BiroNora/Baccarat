import { useEffect, useRef, useState } from "react";
import type { GameStateData } from "../types/game-types";

interface PlayButtonsProps {
  gameState: GameStateData;
  isWFSR: boolean;
}

const PlayButtons: React.FC<PlayButtonsProps> = ({
  gameState,
  isWFSR,
}) => {
  const { player } = gameState;
  const hasOver21 = player.sum >= 21;
  const [showButtons, setShowButtons] = useState(false);
  const timeoutIdRef = useRef<number | null>(null);

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

  return (
    <>
      {!hasOver21 && (
        <div
          id="play-buttons"
          className={`button-container1 ${showButtons ? "show-buttons" : ""}`}
        >
          <button
            id="hit-button"

            disabled={hasOver21 || isWFSR}
          >
            Hit
          </button>
          <button
            id="stand-button"

            disabled={hasOver21 || isWFSR}
          >
            Stand
          </button>


            <button
              id="double-button"

              disabled={hasOver21 || isWFSR}
            >
              Double
            </button>



            <button
              id="split-button"

              disabled={hasOver21 || isWFSR}
            >
              Split
            </button>



            <button
              id="insurance-button"

              disabled={hasOver21 || isWFSR}
            >
              Insurance
            </button>

        </div>
      )}
    </>
  );
};

export default PlayButtons;
