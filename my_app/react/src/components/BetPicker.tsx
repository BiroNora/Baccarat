import React, { useRef } from "react";
import "../styles/betpicker.css";

interface BetPickerProps {
  onChange: (value: string) => void;
}

const options = ["PLAYER", "TIE", "BANKER"];

const BetPicker: React.FC<BetPickerProps> = ({ onChange }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollY = scrollRef.current.scrollTop;
      const itemHeight = 50; // A CSS-ben megadott magasság
      const index = Math.round(scrollY / itemHeight);

      if (options[index]) {
        onChange(options[index]);
      }
    }
  };

  return (
    <div className="picker-container">
      <div className="wheel-picker" ref={scrollRef} onScroll={handleScroll}>
        {/* Üres hely az elején, hogy a PLAYER középre kerülhessen */}
        <div className="picker-spacer"></div>

        {options.map((opt) => (
          <div key={opt} className="picker-item">
            {opt}
          </div>
        ))}

        {/* Üres hely a végén, hogy a BANKER középre kerülhessen */}
        <div className="picker-spacer"></div>
      </div>

      {/* A középső kijelölő sáv vizuális eleme */}
      <div className="picker-selection-overlay"></div>
    </div>
  );
};

export default BetPicker;
