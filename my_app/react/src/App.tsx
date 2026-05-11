import Cards from "./components/Cards";
import { ErrorPage } from "./components/ErrorPage";
import HeaderTitles from "./components/HeaderTitles";
import { Loading } from "./components/Loading";
import { OutOfTokens } from "./components/OutOfTokens";
import PlayButtons from "./components/PlayButtons";
import PlayerDealer from "./components/PlayerDealer";
import PlayerDealerMasked from "./components/PlayerDealerMasked";
import { Restart } from "./components/RestartGame";
import { Shuffling } from "./components/Shuffling";
import Winner from "./components/Winner";
import { useGameStateMachine } from "./hooks/useGameStateMachine";
import Betting from "./components/Betting";
import { AnimatePresence, motion } from "motion/react";
import { Reloading } from "./components/Reloading";
import RecoveryDec from "./components/RecoveryDec";
import UniqueBetBank from "./components/UniqueBetBank";
import CutSlider from "./components/CutSlider";

function App() {
  const {
    gameState,
    handleOnContinue,
    handleOnStartNew,
    handlePlaceBet,
    handleRetakeBet,
    handleShoeCut,
    handleStartGame,
    preRewardBet,
    preRewardTokens,
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
          switch (gameState.currentGameState) {
            case "LOADING":
              return (
                <div>
                  <PageWrapper>
                    <Loading />
                  </PageWrapper>
                </div>
              );
            case "RECOVERY_DECISION":
              return (
                <div>
                  <PageWrapper>
                    <RecoveryDec
                      gameState={gameState}
                      onContinue={handleOnContinue}
                      onStartNew={handleOnStartNew}
                      isWFSR={isWFSR}
                    />
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
                    <CutSlider onConfirm={handleShoeCut}/>
                  </PageWrapper>
                </div>
              );
            case "SHIFTING_THE_STACKS":
              return (
                <div>
                  <PageWrapper>
                    <CutSlider onConfirm={handleShoeCut}/>
                  </PageWrapper>
                </div>
              );
            case "INIT_GAME":
              return (
                <div>
                  <Cards gameState={gameState} initDeckLen={initDeckLen} />
                </div>
              );
            case "BETTING":
              return (
                <div>
                  <Cards gameState={gameState} initDeckLen={initDeckLen} />
                  <Betting
                    gameState={gameState}
                    onPlaceBet={handlePlaceBet}
                    retakeBet={handleRetakeBet}
                    onStartGame={handleStartGame}
                    isWFSR={isWFSR}
                  />
                </div>
              );
            case "MAIN_TURN":
              return (
                <div>
                  <Cards gameState={gameState} initDeckLen={initDeckLen} />
                  <div className="player-dealer-area-wrapper">
                    <PlayerDealerMasked
                      gameState={gameState}
                    />
                  </div>
                  <div className="game-action-area-wrapper">
                    <PlayButtons
                      gameState={gameState}
                      isWFSR={isWFSR}
                    />
                  </div>
                  <UniqueBetBank
                    gameState={gameState} // Ez a JUTALMAKKAL MÓDOSÍTOTT állapot
                    preRewardBet={preRewardBet}
                    preRewardTokens={preRewardTokens} // Ez a JUTALOM ELŐTTI token érték
                    isResultPhase={false}
                  />
                </div>
              );
            case "MAIN_STAND":
              return (
                <div>
                  <Cards gameState={gameState} initDeckLen={initDeckLen} />
                  <div className="player-dealer-area-wrapper">
                    <PlayerDealer gameState={gameState} />
                  </div>
                  <div className="game-action-area-wrapper">
                    <Winner gameState={gameState} />
                  </div>
                  <UniqueBetBank
                    gameState={gameState} // Ez a JUTALMAKKAL MÓDOSÍTOTT állapot
                    preRewardBet={preRewardBet}
                    preRewardTokens={preRewardTokens} // Ez a JUTALOM ELŐTTI token érték
                    isResultPhase={true}
                  />
                </div>
              );
            case "MAIN_STAND_REWARDS_TRANSIT":
              return (
                <div>
                  <Cards gameState={gameState} initDeckLen={initDeckLen} />
                  <div className="player-dealer-area-wrapper">
                    <PlayerDealerMasked
                      gameState={gameState}
                    />
                  </div>
                  <div className="game-action-area-wrapper">
                    {/* <Winner gameState={gameState} /> */}
                  </div>
                  <UniqueBetBank
                    gameState={gameState} // Ez a JUTALMAKKAL MÓDOSÍTOTT állapot
                    preRewardBet={preRewardBet}
                    preRewardTokens={preRewardTokens} // Ez a JUTALOM ELŐTTI token érték
                    isResultPhase={true}
                  />
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
