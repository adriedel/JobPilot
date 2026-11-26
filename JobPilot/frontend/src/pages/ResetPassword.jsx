import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { resetPassword } from "../services/auth";
import EyeIcon from "../assets/icons/eye.svg?react";
import EyeOffIcon from "../assets/icons/eye-off.svg?react";
import "./Auth.css";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
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
          </div>
          <div className="error-message">
            Ungültiger oder fehlender Reset-Token.
          </div>
          <p className="auth-switch" style={{ marginTop: "20px" }}>
            <Link to="/forgot-password">Neuen Link anfordern</Link>
          </p>
        </div>
      </div>
    );
  }

  const validate = () => {
    const errs = {};
    if (!password) errs.password = "Bitte gib ein neues Passwort ein.";
    else if (password.length < 8) errs.password = "Mindestens 8 Zeichen.";
    if (!confirmPassword) errs.confirm = "Bitte bestätige dein Passwort.";
    else if (password !== confirmPassword)
      errs.confirm = "Die Passwörter stimmen nicht überein.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    setLoading(true);
    try {
      await resetPassword(token, password);
      navigate("/login?reset=success");
    } catch (err) {
      setError(err.message || "Fehler beim Zurücksetzen des Passworts.");
    } finally {
      setLoading(false);
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

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <h2>Neues Passwort</h2>

          {error && <div className="error-message">{error}</div>}

          <div
            className={`form-group ${fieldErrors.password ? "has-error" : ""}`}
          >
            <label htmlFor="password">Neues Passwort</label>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors((p) => ({ ...p, password: "" }));
                }}
                placeholder="Mindestens 8 Zeichen"
                autoComplete="new-password"
                aria-invalid={Boolean(fieldErrors.password)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={
                  showPassword ? "Passwort verbergen" : "Passwort anzeigen"
                }
              >
                {showPassword ? (
                  <EyeOffIcon
                    className="password-toggle-icon"
                    aria-hidden="true"
                  />
                ) : (
                  <EyeIcon
                    className="password-toggle-icon"
                    aria-hidden="true"
                  />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="field-error">{fieldErrors.password}</p>
            )}
          </div>

          <div
            className={`form-group ${fieldErrors.confirm ? "has-error" : ""}`}
          >
            <label htmlFor="confirmPassword">Passwort bestätigen</label>
            <div className="password-wrapper">
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setFieldErrors((p) => ({ ...p, confirm: "" }));
                }}
                placeholder="••••••••••"
                autoComplete="new-password"
                aria-invalid={Boolean(fieldErrors.confirm)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirm((p) => !p)}
                aria-label={
                  showConfirm ? "Passwort verbergen" : "Passwort anzeigen"
                }
              >
                {showConfirm ? (
                  <EyeOffIcon
                    className="password-toggle-icon"
                    aria-hidden="true"
                  />
                ) : (
                  <EyeIcon
                    className="password-toggle-icon"
                    aria-hidden="true"
                  />
                )}
              </button>
            </div>
            {fieldErrors.confirm && (
              <p className="field-error">{fieldErrors.confirm}</p>
            )}
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Wird gespeichert..." : "Passwort speichern"}
          </button>

          <p className="auth-switch">
            <Link to="/login">Zurück zum Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
