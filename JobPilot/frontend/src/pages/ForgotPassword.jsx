import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/auth";
import ArrowLeftIcon from "../assets/icons/back.svg?react";
import "./Auth.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | sent
  const [error, setError] = useState("");

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();

    if (!trimmed) {
      setFieldError("Bitte gib deine E-Mail-Adresse ein.");
      return;
    }
    if (!isValidEmail(trimmed)) {
      setFieldError("Bitte gib eine gültige E-Mail-Adresse ein.");
      return;
    }

    setFieldError("");
    setError("");
    setStatus("loading");

    try {
      await forgotPassword(trimmed);
      setStatus("sent");
    } catch (err) {
      setError(err.message || "Ein Fehler ist aufgetreten.");
      setStatus("idle");
    }
  };

  if (status === "sent") {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <div className="auth-header">
            <div className="auth-brand">
              <img
                className="auth-logo"
                src="/Logo-JobPilot.svg"
                alt="JobPilot Logo"
              />
              <h1 className="auth-title">JobPilot</h1>
            </div>
            <p>Dein Bewerbungstracker</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📬</div>
            <h2
              style={{
                fontSize: "1.3rem",
                fontWeight: 700,
                marginBottom: "12px",
                color: "var(--text-primary)",
              }}
            >
              E-Mail gesendet!
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.95rem",
                lineHeight: 1.6,
                marginBottom: "28px",
              }}
            >
              Falls ein Account mit dieser E-Mail-Adresse existiert, hast du in
              Kürze eine E-Mail mit einem Link zum Zurücksetzen deines Passworts
              erhalten. Der Link ist 1 Stunde gültig.
            </p>
            <p className="auth-switch">
              <Link to="/login">Zurück zum Login</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <Link to="/login" className="auth-back-button" title="Zurück zum Login">
        <ArrowLeftIcon className="auth-back-icon" aria-hidden="true" />
      </Link>
      <div className="auth-box">
        <div className="auth-header">
          <div className="auth-brand">
            <img
              className="auth-logo"
              src="/Logo-JobPilot.svg"
              alt="JobPilot Logo"
            />
            <h1 className="auth-title">JobPilot</h1>
          </div>
          <p>Dein Bewerbungstracker</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <h2>Passwort vergessen</h2>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.9rem",
              marginTop: "-16px",
              marginBottom: "24px",
              textAlign: "center",
            }}
          >
            Wir schicken dir einen Link zum Zurücksetzen.
          </p>

          {error && <div className="error-message">{error}</div>}

          <div className={`form-group ${fieldError ? "has-error" : ""}`}>
            <label htmlFor="email">E-Mail-Adresse</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldError("");
              }}
              placeholder="deine@email.de"
              autoComplete="email"
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? "fp-email-error" : undefined}
            />
            {fieldError && (
              <p id="fp-email-error" className="field-error">
                {fieldError}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Wird gesendet..." : "Link anfordern"}
          </button>

          <p className="auth-switch">
            <Link to="/login">Zurück zum Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;
