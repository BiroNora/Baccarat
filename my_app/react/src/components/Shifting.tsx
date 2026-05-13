import { useState, useEffect } from "react";
import "../styles/loading.css";

interface ShiftingProps {
  onAnimationEnd: () => void;
}

export function Shifting({ onAnimationEnd }: ShiftingProps) {
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsDone(true);
      onAnimationEnd();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onAnimationEnd]);

  return (
    <div className="loading-container-centered">
      {/* Ha nincs kész, a töltést mutatjuk, ha kész, a szöveget */}
      {!isDone ? (
        <>
          <div>
            <h1>S H I F T I N G</h1>
          </div>
          <div>
            <h1>the</h1>
          </div>
          <div>
            <h1>
              S T A C K S<span className="dot dot-1">.</span>
              <span className="dot dot-2">.</span>
              <span className="dot dot-3">.</span>
            </h1>
          </div>
        </>
      ) : (
        <div className="fade-in" style={{ textAlign: "center" }}>
          <h1>S H O E &nbsp; C U T T E D</h1>
          <p>Cut card placed about the last fifth of the shoe.</p>
        </div>
      )}
    </div>
  );
}
