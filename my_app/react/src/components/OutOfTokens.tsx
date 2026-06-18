import "../styles/loading.css";

export function OutOfTokens() {
  return (
    <div className="loading-container-centered">
      <div>
        <h1>O U T</h1>
      </div>
      <div>
        <h1>of</h1>
      </div>
      <div>
        <h1>
          T O K E N S<span className="dot dot-1">.</span>
          <span className="dot dot-2">.</span>
          <span className="dot dot-3">.</span>
        </h1>
      </div>
      
      <div className="bank merriweather">Restart in 5sec</div>
    </div>
  );
}
