import React, { useState } from "react";
import { motion } from "motion/react";
import "../styles/auth.css";

interface AuthModalProps {
  onClose: () => void;
  onAuthSubmit: (username: string, password: string, isLogin: boolean) => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onAuthSubmit }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    console.log(isLogin ? "Logging in..." : "Signing up...", { username, password });

  try {
      // Itt hívjuk meg a state machine / hook által biztosított függvényt
      await onAuthSubmit(username, password, isLogin);
      onClose(); // Siker esetén bezárjuk
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Authentication failed.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="auth-overlay-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="auth-card merriweather"
        initial={{ y: -50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -50, opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <button className="close-btn" onClick={onClose}>⏻</button>
        <h2>{isLogin ? "Log In" : "Register"}</h2>

        {error && <div style={{ color: "#fca5a5", marginBottom: "1rem", fontSize: "0.9rem" }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username / Email</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Please wait..." : (isLogin ? "Log In" : "Register")}
          </button>
        </form>

        <p className="switch-text" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Don't have an account? Sign up!" : "Already registered? Sign in!"}
        </p>
      </motion.div>
    </motion.div>
  );
};
