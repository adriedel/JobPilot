import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register as registerAPI } from "../services/auth";
import ArrowLeftIcon from "../assets/icons/back.svg?react";
import EyeIcon from "../assets/icons/eye.svg?react";
import EyeOffIcon from "../assets/icons/eye-off.svg?react";
import "./Auth.css";

function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleBack = () => {
    navigate("/");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    if (error) setError("");
  };

  const validateForm = () => {
    const nextFieldErrors = {};
    const trimmedEmail = formData.email.trim();

    if (!trimmedEmail) {
      nextFieldErrors.email = "Bitte gib deine E-Mail-Adresse ein.";
    } else if (!isValidEmail(trimmedEmail)) {
      nextFieldErrors.email = "Bitte gib eine gültige E-Mail-Adresse ein.";
    }

    if (!formData.password) {
      nextFieldErrors.password = "Bitte gib ein Passwort ein.";
    } else if (formData.password.length < 8) {
      nextFieldErrors.password =
        "Dein Passwort muss mindestens 8 Zeichen lang sein.";
    }

    if (!formData.confirmPassword) {
      nextFieldErrors.confirmPassword = "Bitte bestätige dein Passwort.";
    } else if (formData.password !== formData.confirmPassword) {
      nextFieldErrors.confirmPassword = "Die Passwörter stimmen nicht überein.";
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
      await registerAPI(
        validatedData.trimmedEmail,
        formData.password,
        formData.name.trim(),
      );

      // Kein Token speichern – E-Mail muss zuerst bestätigt werden
      navigate(
        `/verify-email?email=${encodeURIComponent(validatedData.trimmedEmail)}`,
      );
    } catch (err) {
      setError(err.message || "Registrierung fehlgeschlagen");
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
          <h2>Registrieren</h2>

          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="name">Name (optional)</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Max Mustermann"
              autoComplete="name"
            />
          </div>

          <div className={`form-group ${fieldErrors.email ? "has-error" : ""}`}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="deine@email.de"
              autoComplete="email"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={
                fieldErrors.email ? "register-email-error" : undefined
              }
            />
            {fieldErrors.email && (
              <p id="register-email-error" className="field-error">
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
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                placeholder="Mindestens 8 Zeichen"
                autoComplete="new-password"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={
                  fieldErrors.password ? "register-password-error" : undefined
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
              <p id="register-password-error" className="field-error">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div
            className={`form-group ${fieldErrors.confirmPassword ? "has-error" : ""}`}
          >
            <label htmlFor="confirmPassword">Passwort bestätigen</label>
            <div className="password-wrapper">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••••"
                autoComplete="new-password"
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                aria-describedby={
                  fieldErrors.confirmPassword
                    ? "register-confirm-password-error"
                    : undefined
                }
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword((p) => !p)}
                aria-label={
                  showConfirmPassword
                    ? "Passwort verbergen"
                    : "Passwort anzeigen"
                }
              >
                {showConfirmPassword ? (
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
            {fieldErrors.confirmPassword && (
              <p id="register-confirm-password-error" className="field-error">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Wird geladen..." : "Registrieren"}
          </button>

          <p className="auth-switch">
            Schon einen Account? <Link to="/login">Jetzt anmelden</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
