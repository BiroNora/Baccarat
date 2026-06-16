import Cards from "./components/Cards";
import { ErrorPage } from "./components/ErrorPage";
import HeaderTitles from "./components/HeaderTitles";
import { Loading } from "./components/Loading";
import { OutOfTokens } from "./components/OutOfTokens";
import { Restart } from "./components/RestartGame";
import { Shuffling } from "./components/Shuffling";
import { useGameStateMachine } from "./hooks/useGameStateMachine";
import { AnimatePresence, motion } from "motion/react";
import { Reloading } from "./components/Reloading";
import CutSlider from "./components/CutSlider";
import { Shifting } from "./components/Shifting";
import BurningCards from "./components/BurningCards";
import Betting from "./components/Betting";
import StandardGame from "./components/StandardGame";
import { RoadMap } from "./components/RoadMap";
import Button from "./components/Button";
//import PandaIcon from "./components/PandaIcon";
//import DragonIcon from "./components/DragonIcon";
//import { mockRoadmapMap } from "./data/mockData";
//import PandaDragonIcon from "./components/PandaDragonIcon";

function App() {
  const {
    gameState,
    roadmapMap,
    handleStartBetting, // CSAK A BETTING FRONTHOZ
    handlePlaceBet,
    handleRetakeBet,
    handleShoeCut,
    handleShiftingFirstPhaseEnd,
    handleStartGame,
    initDeckLen,
    isWFSR,
  } = useGameStateMachine();

  function PageWrapper({ children }: React.PropsWithChildren<object>) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 2, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <>
      <HeaderTitles />
      <AnimatePresence mode="wait">
        {(() => {
          const phase = gameState.currentGameState;

          switch (phase) {
            case "LOADING":
              return (
                <div>
                  <PageWrapper>
                    <Loading />
                  </PageWrapper>
                </div>
              );
            case "SHUFFLING":
              return (
                <div>
                  <PageWrapper>
                    <Shuffling />
                  </PageWrapper>
                </div>
              );
            case "CUTSLIDER":
              return (
                <div>
                  <PageWrapper>
                    <div className="cards-wrapper"></div>
                    <CutSlider
                      onConfirm={handleShoeCut}
                      initDeckLen={initDeckLen}
                    />
                  </PageWrapper>
                </div>
              );
            case "SHIFTING_THE_STACKS":
              return (
                <div>
                  <PageWrapper>
                    <Shifting onAnimationEnd={handleShiftingFirstPhaseEnd} />
                  </PageWrapper>
                </div>
              );
            case "BURNING_CARDS":
              return (
                <div>
                  <PageWrapper>
                    <div className="cards-wrapper"></div>
                    <BurningCards
                      gameState={gameState}
                      initDeckLen={initDeckLen}
                    />
                  </PageWrapper>
                </div>
              );
            case "INIT_GAME":
              return <div></div>;
            case "BETTING":
              return (
                <div className="game-container-fullscreen">
                  <PageWrapper>
                    <div className="cards-wrapper">
                      <Cards gameState={gameState} initDeckLen={initDeckLen} />
                    </div>
                  </PageWrapper>

                  <RoadMap roadmapMap={roadmapMap} />
                  {/* <RoadMap roadmapMap={mockRoadmapMap} /> */}

                  <Betting
                    gameState={gameState}
                    onPlaceBet={handlePlaceBet}
                    retakeBet={handleRetakeBet}
                    onStartGame={handleStartGame}
                    isWFSR={isWFSR}
                  />
                </div>
              );
            case "MAIN_STAND":
              return (
                <div>
                  <PageWrapper>
                    <div className="cards-wrapper"></div>
                    {/* <Cards gameState={gameState} initDeckLen={initDeckLen} /> */}
                    <StandardGame gameState={gameState} />
                    <Button onClick={handleStartBetting} />
                  </PageWrapper>
                </div>
              );
            case "OUT_OF_TOKENS":
              return (
                <div>
                  <PageWrapper>
                    <OutOfTokens />
                  </PageWrapper>
                </div>
              );
            case "RESTART_GAME":
              return (
                <div>
                  <PageWrapper>
                    <Restart />
                  </PageWrapper>
                </div>
              );
            case "ERROR":
              return (
                <div>
                  <PageWrapper>
                    <ErrorPage />
                  </PageWrapper>
                </div>
              );
            case "RELOADING":
              return (
                <div>
                  <PageWrapper>
                    <Reloading />
                  </PageWrapper>
                </div>
              );
            default:
              return (
                <div>
                  <PageWrapper>
                    <ErrorPage />
                  </PageWrapper>
                </div>
              );
          }
        })()}
      </AnimatePresence>
    </>
  );
}

export default App;
