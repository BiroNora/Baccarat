import { states, type GameStateData, type RoadMapUnit } from "../types/game-types";

interface TableProps {
  gameState: GameStateData;
}

const StandardGame: React.FC<TableProps> = ({ gameState }) => {
  // Alapvető biztonsági ellenőrzés
  if (!gameState || !gameState.player || !gameState.banker) {
    return null;
  }

  // Minden kulcsot közvetlenül a gameState tetejéről húzunk ki az IntelliSense alapján
  const { player, banker, bets, target_phase, road_map } = gameState;

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
          <div><strong>TOTAL PAYOUT: {bets.TOTAL}</strong></div>
        </div>
      )}

      {/* ROADMAP KÖRÖK LISTÁZÁSA */}
      {road_map && road_map.length > 0 && (
        <div>
          <h3>Road Map History</h3>
          {road_map.map((round: RoadMapUnit, index: number) => (
            <div key={index}>
              Round {index + 1} — Winner ID: {states[round.winner]} |
              Player Score: {round.player_score} |
              Banker Score: {round.banker_score} |
              Dragon: {round.is_dragon ? "Yes" : "No"} |
              Panda: {round.is_panda ? "Yes" : "No"} |
              Natural: {round.is_natural ? "Yes" : "No"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StandardGame;
