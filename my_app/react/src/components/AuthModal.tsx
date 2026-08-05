import React, { useState } from "react";
import { motion } from "motion/react";
import toast from "react-hot-toast";
import "../styles/auth.css";

export const EyeOpen = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

export const EyeClosed = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

interface AuthModalProps {
  onClose: () => void;
  onAuthSubmit: (
    email: string,
    password: string,
    isLogin: boolean,
  ) => Promise<{ status: string } | void>;
  onHandleForgotPassword: (email: string) => Promise<{ status: string } | void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onClose,
  onAuthSubmit,
  onHandleForgotPassword,
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleForgotPassword = async () => {
    if (!email || email.trim() === "") {
      toast("Missing email address", {
        id: "forgot-pass-error",
        duration: 2000,
      });
      return;
    }

    setLoading(true);

    try {
      const res = await onHandleForgotPassword(email);
      if (res?.status && res.status !== "OK") {
        throw new Error(res.status);
      }

      toast("Check your emails", {
        id: "forgot-pass-success",
        duration: 3000,
      });
    } catch (err: unknown) {
      let errorMessage =
        err instanceof Error ? err.message : "Error sending email";

      // Ha a backend azt küldi, hogy "User does not exist", azt átírhatod emberibbre is ha akarod:
      if (errorMessage === "User does not exist") {
        errorMessage = "User does not exist";
      }

      toast(errorMessage, {
        id: "forgot-pass-error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await onAuthSubmit(email, password, isLogin);

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
              value={email}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>

            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOpen /> : <EyeClosed />}
              </button>
            </div>

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
