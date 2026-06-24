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
import { Toaster } from "react-hot-toast";

function App() {
  const {
    gameState,
    roadmapMap,
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
      <Toaster
        position="top-center"
        containerStyle={{
          top: "40%",
        }}
        toastOptions={{
          duration: 2000,
          style: {
            background:
              "radial-gradient(circle, #f91e43 0%, #e01f3f 40%, #a31e34 100%)",
            color: "#fef3c7",
            borderRadius: "10px",
            border: "1px solid #ca8a04",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            padding: "0.5rem",
            fontStyle: "italic",
          },
        }}
      />
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
                  <motion.div
                    key="betting-container"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  >
                    <div className="cards-wrapper">
                      <Cards gameState={gameState} initDeckLen={initDeckLen} />
                    </div>

                    <RoadMap roadmapMap={roadmapMap} />

                    <Betting
                      gameState={gameState}
                      onPlaceBet={handlePlaceBet}
                      retakeBet={handleRetakeBet}
                      onStartGame={handleStartGame}
                      isWFSR={isWFSR}
                    />
                  </motion.div>
                </div>
              );
            case "MAIN_STAND":
              return (
                <div>
                  <PageWrapper>
                    <div className="cards-wrapper"></div>
                    <StandardGame gameState={gameState} />
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
