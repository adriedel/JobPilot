import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { verifyEmail } from "../services/auth";
import "./Auth.css";

function VerifyEmailConfirm() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState(() => (token ? "loading" : "error"));
  const [errorMsg, setErrorMsg] = useState(() =>
    token ? "" : "Kein Verifizierungstoken gefunden.",
  );

  useEffect(() => {
    if (!token) return;

    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setErrorMsg(err.message || "Verifizierung fehlgeschlagen.");
      });
  }, [token]);

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
          {status === "loading" && (
            <>
              <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>⏳</div>
              <p style={{ color: "var(--text-secondary)" }}>
                E-Mail wird verifiziert…
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div style={{ fontSize: "3rem", marginBottom: "16px" }}>✅</div>
              <h2
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  marginBottom: "12px",
                  color: "var(--text-primary)",
                }}
              >
                E-Mail bestätigt!
              </h2>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                  marginBottom: "28px",
                }}
              >
                Dein Account ist jetzt aktiv. Du kannst dich jetzt anmelden.
              </p>
              <Link
                to="/login"
                className="auth-button"
                style={{
                  display: "inline-block",
                  textDecoration: "none",
                  textAlign: "center",
                }}
              >
                Zum Login
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div style={{ fontSize: "3rem", marginBottom: "16px" }}>❌</div>
              <h2
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  marginBottom: "12px",
                  color: "var(--text-primary)",
                }}
              >
                Verifizierung fehlgeschlagen
              </h2>
              <div className="error-message" style={{ marginBottom: "24px" }}>
                {errorMsg}
              </div>
              <p className="auth-switch">
                <Link to="/login">Zurück zum Login</Link>
                {" · "}
                <Link to="/verify-email">Neue E-Mail anfordern</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyEmailConfirm;
