import { useState, useEffect } from "react";
import { login as loginAPI } from "../services/auth";
import { create } from "../services/api";
import {
  STATUS,
  STATUS_LABELS,
  BEWERBUNGSARTEN,
  WAEHRUNGEN,
  WAEHRUNG_LABELS,
} from "../utils/constants";
import EyeIcon from "../assets/icons/eye.svg?react";
import EyeOffIcon from "../assets/icons/eye-off.svg?react";
import "./QuickAdd.css";

function QuickAdd() {
  const params = new URLSearchParams(window.location.search);

  const [darkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved !== null
      ? JSON.parse(saved)
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark-mode");
    else document.documentElement.classList.remove("dark-mode");
  }, [darkMode]);

  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    position: params.get("position") || "",
    firma: params.get("firma") || "",
    status: STATUS.BEWORBEN,
    datum: new Date().toISOString().split("T")[0],
    standort: "",
    notizen: params.get("notizen") || "",
    bewerbungsart: "Stellenausschreibung",
    link: params.get("link") || "",
    gehalt: "",
    waehrung: "EUR",
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const data = await loginAPI(email, password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setIsLoggedIn(true);
    } catch (err) {
      setLoginError(err.message || "Login fehlgeschlagen");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError("");
    setSaveLoading(true);
    try {
      await create(formData);
      setSaved(true);
      setTimeout(() => window.close(), 2500);
    } catch (err) {
      setSaveError(err.message || "Fehler beim Speichern");
    } finally {
      setSaveLoading(false);
    }
  };

  if (saved) {
    return (
      <div className="qa-root">
        <div className="qa-success">
          <div className="qa-success-icon">✓</div>
          <h2>Gespeichert!</h2>
          <p>
            <strong>{formData.position}</strong>
            {formData.firma && (
              <>
                {" "}
                bei <strong>{formData.firma}</strong>
              </>
            )}
          </p>
          <p className="qa-close-hint">Fenster schließt automatisch…</p>
          <button className="qa-btn-secondary" onClick={() => window.close()}>
            Jetzt schließen
          </button>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="qa-root">
        <div className="qa-card">
          <div className="qa-header">
            <img src="/Logo-JobPilot.svg" alt="JobPilot" className="qa-logo" />
            <h1 className="qa-title">JobPilot</h1>
          </div>
          <p className="qa-subtitle">
            Melde dich an, um diese Stelle zu speichern.
          </p>

          <form onSubmit={handleLogin} className="qa-form">
            {loginError && <div className="qa-error">{loginError}</div>}

            <div className="qa-field">
              <label htmlFor="qa-email">Email</label>
              <input
                id="qa-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deine@email.de"
                autoComplete="email"
                autoFocus
                required
              />
            </div>

            <div className="qa-field">
              <label htmlFor="qa-password">Passwort</label>
              <div className="qa-pw-wrap">
                <input
                  id="qa-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="qa-pw-toggle"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={
                    showPassword ? "Passwort verbergen" : "Passwort anzeigen"
                  }
                >
                  {showPassword ? (
                    <EyeOffIcon className="qa-pw-icon" aria-hidden="true" />
                  ) : (
                    <EyeIcon className="qa-pw-icon" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="qa-btn-primary"
              disabled={loginLoading}
            >
              {loginLoading ? "Wird geladen…" : "Anmelden & speichern"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const statusOptions = Object.entries(STATUS_LABELS).filter(
    ([k]) => k !== STATUS.GESAMT,
  );

  return (
    <div className="qa-root">
      <div className="qa-card">
        <div className="qa-header">
          <img src="/Logo-JobPilot.svg" alt="JobPilot" className="qa-logo" />
          <h1 className="qa-title">Job speichern</h1>
        </div>

        <form onSubmit={handleSave} className="qa-form">
          {saveError && <div className="qa-error">{saveError}</div>}

          <div className="qa-row">
            <div className="qa-field qa-field--grow">
              <label htmlFor="qa-position">Position *</label>
              <input
                id="qa-position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                placeholder="z.B. Frontend Developer"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="qa-row">
            <div className="qa-field qa-field--grow">
              <label htmlFor="qa-firma">Firma *</label>
              <input
                id="qa-firma"
                name="firma"
                value={formData.firma}
                onChange={handleChange}
                placeholder="z.B. SAP SE"
                required
              />
            </div>
          </div>

          <div className="qa-row qa-row--split">
            <div className="qa-field">
              <label htmlFor="qa-status">Status</label>
              <select
                id="qa-status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                {statusOptions.map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="qa-field">
              <label htmlFor="qa-datum">Datum</label>
              <input
                id="qa-datum"
                type="date"
                name="datum"
                value={formData.datum}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="qa-row qa-row--split">
            <div className="qa-field">
              <label htmlFor="qa-bewerbungsart">Bewerbungsart</label>
              <select
                id="qa-bewerbungsart"
                name="bewerbungsart"
                value={formData.bewerbungsart}
                onChange={handleChange}
              >
                {BEWERBUNGSARTEN.map((art) => (
                  <option key={art} value={art}>
                    {art}
                  </option>
                ))}
              </select>
            </div>
            <div className="qa-field">
              <label htmlFor="qa-standort">Standort</label>
              <input
                id="qa-standort"
                name="standort"
                value={formData.standort}
                onChange={handleChange}
                placeholder="z.B. Berlin"
              />
            </div>
          </div>

          <div className="qa-row qa-row--split">
            <div className="qa-field">
              <label htmlFor="qa-gehalt">Gehalt</label>
              <input
                id="qa-gehalt"
                name="gehalt"
                value={formData.gehalt}
                onChange={handleChange}
                placeholder="z.B. 60.000"
              />
            </div>
            <div className="qa-field qa-field--narrow">
              <label htmlFor="qa-waehrung">Währung</label>
              <select
                id="qa-waehrung"
                name="waehrung"
                value={formData.waehrung}
                onChange={handleChange}
              >
                {WAEHRUNGEN.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="qa-field">
            <label htmlFor="qa-notizen">Notizen</label>
            <textarea
              id="qa-notizen"
              name="notizen"
              value={formData.notizen}
              onChange={handleChange}
              placeholder="Notizen zur Stelle…"
              rows={3}
            />
          </div>

          <div className="qa-field">
            <label htmlFor="qa-link">Link</label>
            <input
              id="qa-link"
              name="link"
              value={formData.link}
              onChange={handleChange}
              placeholder="URL der Stellenanzeige"
            />
          </div>

          <div className="qa-actions">
            <button
              type="button"
              className="qa-btn-secondary"
              onClick={() => window.close()}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="qa-btn-primary"
              disabled={saveLoading}
            >
              {saveLoading ? "Speichern…" : "Speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuickAdd;
