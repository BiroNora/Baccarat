import { useState } from "react";
import "../styles/cutslider.css";

interface CutSliderProps {
  initDeckLen: number | null;
  onConfirm: (amount: number) => void;
}

const CutSlider: React.FC<CutSliderProps> = ({ initDeckLen, onConfirm }) => {
  const [cutValue, setCutValue] = useState(Math.floor(initDeckLen! / 2));

  const percentage = (cutValue / initDeckLen!) * 100;

  return (
    <div className="cut-container">
      <h2 className="cut-title">Cut the Shoe</h2>

      <div className="deck-visual">
        <div className="deck-texture">
          {[...Array(25)].map((_, i) => (
            <div key={i} className="deck-line"></div>
          ))}
        </div>

        <div className="cut-card-indicator" style={{ left: `${percentage}%` }}>
          <div className="cut-card-diamond"></div>
        </div>
      </div>

      <input
        type="range"
        min="2"
        max={initDeckLen! - 2}
        value={cutValue}
        onChange={(e) => setCutValue(parseInt(e.target.value))}
        className="cut-slider"
      />

      <div className="cut-info">
        <i>Selected Card: </i>
        <div>
          <span className="highlight">
            <i
              style={{
                display: "inline-block",
                width: "40px",
                textAlign: "center",
              }}
            >
              {cutValue}
            </i>
          </span>{" "}
          / <i>{initDeckLen}</i>
        </div>
      </div>

      <button className="cut-button" onClick={() => onConfirm(cutValue)}>
        <i>Confirm Cut</i>
      </button>
    </div>
  );
};

export default CutSlider;
