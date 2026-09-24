import Betting from "./components/Betting";
import BurningCards from "./components/BurningCards";
import Cards from "./components/Cards";
import CutSlider from "./components/CutSlider";
import HeaderTitles from "./components/HeaderTitles";
import Loading from "./components/Loading";
import StandardGame from "./components/StandardGame";
import { AuthModal } from "./components/AuthModal";
import { ErrorPage } from "./components/ErrorPage";
import { OutOfTokens } from "./components/OutOfTokens";
import { Reloading } from "./components/Reloading";
import { Restart } from "./components/RestartGame";
import { RoadMap } from "./components/RoadMap";
import { Shifting } from "./components/Shifting";
import { Shuffling } from "./components/Shuffling";
import { useGameStateMachine } from "./hooks/useGameStateMachine";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import toast, { Toaster } from "react-hot-toast";
import { ForgotPasswordModal } from "./components/ForgotPasswordModal";
import { ProfileModal } from "./components/ProfileModal";
import { defaultToastOptions } from "./utilities/toast-config";
import { ConflictModal } from "./components/ConflictModal";

function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const {
    gameState,
    roadmapMap,
    handleAuth,
    handleUpdateUsername,
    handleConflict,
    handleCloseNewPassCase,
    handleForgotPassword,
    handleForgotPasswordSubmit,
    handleSkipAuth,
    handlePlaceBet,
    handleRetakeBet,
    handleShoeCut,
    handleShiftingFirstPhaseEnd,
    handleStartGame,
    initDeckLen,
    isWFSR,
    isGuest,
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

  // Segédfg, megnyitja a login modalt a betting felületen sikeres
  // jelszó módosítás után
  const handlePasswordResetAndOpenLogin = async (
    token: string,
    password: string,
  ) => {
    const result = await handleForgotPasswordSubmit(token, password);
    if (result?.status === "IC") {
      handleCloseNewPassCase();
      return result;
    }
    toast("Password successfully changed!", {
      duration: 3000,
      id: "password-changed-toast",
    });

    setTimeout(() => {
      setIsAuthOpen(true);
    }, 3000);
  };

  return (
    <>
      <HeaderTitles />
      <AnimatePresence>
        {isAuthOpen && (
          <AuthModal
            onClose={() => {
              setIsAuthOpen(false);
            }}
            onAuthSubmit={handleAuth}
            onHandleForgotPassword={handleForgotPassword}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isProfileOpen && (
          <ProfileModal
            onClose={() => setIsProfileOpen(false)}
            username={gameState.username || ""}
            handleSave={handleUpdateUsername}
          />
        )}
      </AnimatePresence>
      <Toaster
        position="top-center"
        containerStyle={{
          top: "40%",
        }}
        toastOptions={defaultToastOptions}
      />
      <AnimatePresence mode="wait">
        {(() => {
          const phase = gameState.currentGameState;

          switch (phase) {
            case "LOADING":
              return (
                <div>
                  <PageWrapper>
                    <Loading
                      onOpenAuth={() => setIsAuthOpen(true)}
                      onSkipAuth={() => handleSkipAuth()}
                      isAuthOpen={isAuthOpen}
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
                    transition={{ duration: 1, ease: "easeOut" }}
                  >
                    <div className="cards-wrapper">
                      <Cards
                        gameState={gameState}
                        initDeckLen={initDeckLen}
                        isGuest={isGuest}
                        username={gameState.username || ""}
                        onOpenAuth={() => setIsAuthOpen(true)}
                        onOpenProfile={() => setIsProfileOpen(true)}
                      />
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
            case "FORGOT_PASSWORD":
              return (
                <div>
                  <PageWrapper>
                    <ForgotPasswordModal
                      onCloseForm={handleCloseNewPassCase}
                      onResetSubmit={handlePasswordResetAndOpenLogin}
                    />
                  </PageWrapper>
                </div>
              );
            case "CONFLICT":
              return (
                <div>
                  <PageWrapper>
                    <ConflictModal
                      onResolve={handleConflict}
                      conflictData={gameState.conflict_data}
                    />
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
