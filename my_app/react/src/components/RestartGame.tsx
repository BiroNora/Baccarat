import "../styles/loading.css";
import { formatNumber } from "../utilities/utils";
import DragonIcon from "./DragonIcon";
import PandaIcon from "./PandaIcon";

interface RestartProps {
  currTokens: number;
}

const Restart: React.FC<RestartProps> = ({currTokens}) => {
  return (
    <div>
      <div>
        <div className="loading-container-centered">
          <div>
            <h1>W E L C O M E</h1>
          </div>
          <div>
            <h1>B A C K</h1>
          </div>
        </div>

        <div className="bank3 merriweather">Your New Tokens: {formatNumber(currTokens)}</div>

        <div className="betting-screen-container">
          <div className="merriweather tops">
            <span className="redcolor-suit gap-right">♥</span>
            <span className="black-suit gap-right">♠</span>

            <div className="icono">
              <PandaIcon width={100} />
            </div>

            <div className="info-text">Enjoy Your Game</div>

            <div className="icono">
              <DragonIcon width={100} />
            </div>

            <span className="black-suit gap-left">♣</span>
            <span className="redcolor-suit gap-left">♦</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Restart;
