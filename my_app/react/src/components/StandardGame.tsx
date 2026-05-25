import {
  states,
  type GameStateData,
} from "../types/game-types";

interface TableProps {
  gameState: GameStateData;
}

const StandardGame: React.FC<TableProps> = ({ gameState }) => {
  // Alapvető biztonsági ellenőrzés
  if (!gameState || !gameState.player || !gameState.banker) {
    return null;
  }

  // Minden kulcsot közvetlenül a gameState tetejéről húzunk ki az IntelliSense alapján
  const { player, banker, bets, target_phase, round_result } = gameState;

  return (
    <div>
      {/* Felhasználói egyenleg (a felugró ablakban 'tokens' néven van) */}

      {/* Játék fázis és pakli adatok */}
      <div>Target Phase: {target_phase}</div>

      {/* PLAYER SZEKCIÓ */}
      <div>
        <h3>Player</h3>
        <div>Sum: {player.sum}</div>
        <div>Hand: {player.hand ? player.hand.join(", ") : "No cards"}</div>
      </div>

      {/* BANKER SZEKCIÓ */}
      <div>
        <h3>Banker</h3>
        <div>Sum: {banker.sum}</div>
        <div>Hand: {banker.hand ? banker.hand.join(", ") : "No cards"}</div>
      </div>

      {/* KIFIZETÉSEK (PAYOUTS) */}
      {bets && (
        <div>
          <h3>Payouts</h3>
          <div>BANKER: {bets.BANKER}</div>
          <div>PLAYER: {bets.PLAYER}</div>
          <div>TIE: {bets.TIE}</div>
          <div>DRAGON: {bets.DRAGON}</div>
          <div>PANDA: {bets.PANDA}</div>
          <div>
            <strong>TOTAL PAYOUT: {bets.TOTAL}</strong>
          </div>
        </div>
      )}

      {/* ROADMAP KÖRÖK LISTÁZÁSA */}
      {round_result && (
        <div>
          <h3>Road Map History</h3>

          <div>
            Round — Winner: {states[round_result.winner]} | Dragon:{" "}
            {round_result.is_dragon ? "Yes" : "No"} | Panda:{" "}
            {round_result.is_panda ? "Yes" : "No"} | Natural:{" "}
            {round_result.is_natural ? "Yes" : "No"} | Pairs:{" "}
            {round_result.is_p_pair ? "P-Pair" : "No p_pair"}{" "}
            {round_result.is_b_pair ? "B-Pair" : "No b_pair"}
          </div>
        </div>
      )}
    </div>
  );
};

export default StandardGame;
