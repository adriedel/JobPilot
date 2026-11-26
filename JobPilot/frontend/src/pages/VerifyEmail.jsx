import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { resendVerification } from "../services/auth";
import "./Auth.css";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";

  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [cooldown, setCooldown] = useState(0);

  const handleResend = async () => {
    if (cooldown > 0 || status === "sending") return;
    setStatus("sending");
    try {
      await resendVerification(email);
      setStatus("sent");
      // 60-Sekunden-Cooldown
      let seconds = 60;
      setCooldown(seconds);
      const interval = setInterval(() => {
        seconds -= 1;
        setCooldown(seconds);
        if (seconds <= 0) {
          clearInterval(interval);
          setStatus("idle");
        }
      }, 1000);
    } catch {
      setStatus("error");
    }
  };

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
            Schau in dein Postfach!
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.95rem",
              lineHeight: 1.6,
              marginBottom: "8px",
            }}
          >
            Wir haben eine Bestätigungs-E-Mail an
          </p>
          {email && (
            <p
              style={{
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "16px",
                wordBreak: "break-all",
              }}
            >
              {email}
            </p>
          )}
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.9rem",
              lineHeight: 1.6,
              marginBottom: "32px",
            }}
          >
            gesendet. Klicke auf den Link in der E-Mail, um deinen Account zu
            aktivieren. Der Link ist 24 Stunden gültig.
          </p>

          {status === "sent" && (
            <div className="success-message" style={{ marginBottom: "20px" }}>
              E-Mail wurde erneut gesendet.
            </div>
          )}
          {status === "error" && (
            <div className="error-message" style={{ marginBottom: "20px" }}>
              Fehler beim Senden. Bitte versuche es später erneut.
            </div>
          )}

          <button
            onClick={handleResend}
            disabled={status === "sending" || cooldown > 0}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "10px 20px",
              color: "var(--text-primary)",
              cursor: cooldown > 0 ? "not-allowed" : "pointer",
              fontSize: "0.9rem",
              opacity: cooldown > 0 ? 0.6 : 1,
              marginBottom: "24px",
            }}
          >
            {status === "sending"
              ? "Wird gesendet..."
              : cooldown > 0
                ? `Erneut senden (${cooldown}s)`
                : "E-Mail erneut senden"}
          </button>

          <p className="auth-switch">
            <Link to="/login">Zurück zum Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
