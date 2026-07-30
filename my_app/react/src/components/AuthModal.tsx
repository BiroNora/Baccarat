import React, { useState } from "react";
import { motion } from "motion/react";
import toast from "react-hot-toast";
import "../styles/auth.css";

interface AuthModalProps {
  onClose: () => void;
  onAuthSubmit: (
    username: string,
    password: string,
    isLogin: boolean,
  ) => Promise<{ status: string } | void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onClose,
  onAuthSubmit,
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = () => {
    if (!username || username.trim() === "") {
      toast("Missing email address", {
        id: "forgot-pass-error",
        duration: 2000,
      });
      return;
    }

    toast("Check your emails", {
      id: "forgot-pass-success",
      duration: 3000,
    });
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await onAuthSubmit(username, password, isLogin);

      if (result?.status === "IC") {
        throw new Error("IC");
      }

      onClose();
    } catch (err: unknown) {
      let errorMessage =
        err instanceof Error ? err.message : "Authentication failed";
      if (errorMessage === "IC") {
        errorMessage = "Invalid credentials";
      }

      toast(errorMessage, {
        id: "auth-error-toast",
        duration: 3000,
      });
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
        <button className="close-btn" onClick={onClose}>
          ⏻
        </button>
        <h2>{isLogin ? "Log In" : "Register"}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <small id="password-hint" className="helper-text">
              At least 6 characters long
            </small>
          </div>

          <div className="forget-text" onClick={handleForgotPassword}>
            {isLogin ? "Forgot password?" : " "}
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Please wait..." : isLogin ? "Log In" : "Register"}
          </button>
        </form>

        <p className="switch-text" onClick={() => setIsLogin(!isLogin)}>
          {isLogin
            ? "Don't have an account? Sign up!"
            : "Already registered? Sign in!"}
        </p>
      </motion.div>
    </motion.div>
  );
};
