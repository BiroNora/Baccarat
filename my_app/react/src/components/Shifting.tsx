import { useState, useEffect } from "react";
import "../styles/loading.css";

export function Shifting() {
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsDone(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="loading-container-centered">
      {/* Ha nincs kész, a töltést mutatjuk, ha kész, a szöveget */}
      {!isDone ? (
        <h1>
          S H I F T I N G the S T A C K S<span className="dot dot-1">.</span>
          <span className="dot dot-2">.</span>
          <span className="dot dot-3">.</span>
        </h1>
      ) : (
        <div className="fade-in" style={{ textAlign: "center" }}>
          <h1>S H O E &nbsp; C U T T E D</h1>
            <p>
              Cut card placed about the last fifth of the shoe.
            </p>
        </div>
      )}
    </div>
  );
}
