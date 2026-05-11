import { useState } from "react";
import "../styles/cutslider.css";

interface CutSliderProps {
  onConfirm: (amount: number) => void;
}

const CutSlider: React.FC<CutSliderProps> = ({
  onConfirm,
  }) => {
  const deckLen = 416;
  const [cutValue, setCutValue] = useState(Math.floor(deckLen / 2));

  const percentage = (cutValue / deckLen) * 100;

  return (
    <div className="cut-container">
      <h2 className="cut-title">
        Cut the Shoe
      </h2>

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
        max={deckLen - 2}
        value={cutValue}
        onChange={(e) => setCutValue(parseInt(e.target.value))}
        className="cut-slider"
      />

      <div className="cut-info">
        <i>Selected Card: </i>
        <span className="highlight">
          <i>{cutValue}</i>
        </span>{" "}
        / <i>{deckLen}</i>
      </div>

      <button className="cut-button" onClick={() => onConfirm(cutValue)}>
        <i>Confirm Cut</i>
      </button>
    </div>
  );
};

export default CutSlider;
