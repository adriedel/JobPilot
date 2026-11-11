import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { login as loginAPI } from "../services/auth";
import ArrowLeftIcon from "../assets/icons/back.svg?react";
import EyeIcon from "../assets/icons/eye.svg?react";
import EyeOffIcon from "../assets/icons/eye-off.svg?react";
import "./Auth.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";
  const sessionExpired = searchParams.get("session") === "expired";

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleBack = () => {
    navigate("/");
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setFieldErrors((prev) => ({ ...prev, email: "" }));
    if (error) setError("");
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setFieldErrors((prev) => ({ ...prev, password: "" }));
    if (error) setError("");
  };

  const validateForm = () => {
    const nextFieldErrors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      nextFieldErrors.email = "Bitte gib deine E-Mail-Adresse ein.";
    } else if (!isValidEmail(trimmedEmail)) {
      nextFieldErrors.email = "Bitte gib eine gültige E-Mail-Adresse ein.";
    }

    if (!password) {
      nextFieldErrors.password = "Bitte gib dein Passwort ein.";
    } else if (password.length < 8) {
      nextFieldErrors.password =
        "Dein Passwort muss mindestens 8 Zeichen lang sein.";
    }

    setFieldErrors(nextFieldErrors);

    if (Object.keys(nextFieldErrors).length > 0) {
      setError("Bitte prüfe die markierten Felder.");
      return null;
    }

    return { trimmedEmail };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validatedData = validateForm();
    if (!validatedData) return;

    setLoading(true);

    try {
      const data = await loginAPI(validatedData.trimmedEmail, password);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/dashboard");
    } catch (err) {
      if (err.code === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(err.email);
        setError("Bitte bestätige zuerst deine E-Mail-Adresse.");
      } else {
        setError(err.message || "Login fehlgeschlagen");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <button className="auth-back-button" onClick={handleBack} title="Zurück">
        <ArrowLeftIcon className="auth-back-icon" aria-hidden="true" />
      </button>
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
          <h2>Anmelden</h2>

          {sessionExpired && (
            <div className="error-message session-expired-message" role="status">
              Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.
            </div>
          )}

          {resetSuccess && (
            <div className="success-message">
              Passwort erfolgreich zurückgesetzt! Du kannst dich jetzt anmelden.
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
              {unverifiedEmail && (
                <p style={{ marginTop: "8px", marginBottom: 0, fontSize: "0.85rem" }}>
                  <Link
                    to={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                    style={{ color: "inherit", textDecoration: "underline" }}
                  >
                    Neue Bestätigungs-E-Mail anfordern
                  </Link>
                </p>
              )}
            </div>
          )}

          <div className={`form-group ${fieldErrors.email ? "has-error" : ""}`}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="deine@email.de"
              autoComplete="email"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
            />
            {fieldErrors.email && (
              <p id="email-error" className="field-error">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div
            className={`form-group ${fieldErrors.password ? "has-error" : ""}`}
          >
            <label htmlFor="password">Passwort</label>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                placeholder="••••••••••"
                autoComplete="current-password"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={
                  fieldErrors.password ? "password-error" : undefined
                }
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
              <p id="password-error" className="field-error">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div style={{ textAlign: "right", marginTop: "-8px", marginBottom: "16px" }}>
            <Link to="/forgot-password" style={{ fontSize: "0.88rem", color: "var(--blue)" }}>
              Passwort vergessen?
            </Link>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Wird geladen..." : "Anmelden"}
          </button>

          <p className="auth-switch">
            Noch kein Account? <Link to="/register">Jetzt registrieren</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
