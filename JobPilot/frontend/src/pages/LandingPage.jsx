import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";
import BriefcaseIcon from "../assets/icons/briefcase-white.svg?react";
import SunIcon from "../assets/icons/sun.svg?react";
import MoonIcon from "../assets/icons/moon.svg?react";
import CheckIcon from "../assets/icons/check.svg?react";
import TrendingIcon from "../assets/icons/trending.svg?react";
import CalendarIcon from "../assets/icons/calendar.svg?react";
import PlanIcon from "../assets/icons/plan.svg?react";
import { isAuthenticated } from "../services/auth";

function LandingPage({ onEnterApp }) {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return window.matchMedia("(prefers-color-scheme: light)").matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark-mode");
    }
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const handleRegister = () => {
    navigate("/register");
  };

  const handleEnterApp = () => {
    if (onEnterApp) {
      onEnterApp();
      return;
    }
    navigate(isAuthenticated() ? "/dashboard" : "/register");
  };

  const features = [
    {
      icon: <PlanIcon className="feature-icon" />,
      title: "Alles im Blick",
      description:
        "Verwalten Sie alle Ihre Bewerbungen an einem zentralen Ort. Keine verlorenen E-Mails oder vergessenen Termine mehr.",
    },
    {
      icon: <TrendingIcon className="feature-icon" />,
      title: "Status-Tracking",
      description:
        "Verfolgen Sie den Fortschritt jeder Bewerbung - von der Einreichung bis zur finalen Entscheidung.",
    },
    {
      icon: <CalendarIcon className="feature-icon" />,
      title: "Statistiken",
      description:
        "Erhalten Sie einen klaren Überblick über Ihre Bewerbungsaktivitäten mit aussagekräftigen Statistiken.",
    },
  ];

  const stats = [
    { value: "100%", label: "Kostenlos" },
    { value: "5+", label: "Status-Kategorien" },
    { value: "24/7", label: "Verfügbar" },
  ];

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-content">
          <div className="landing-logo">
            <div className="landing-logo-icon">
              <BriefcaseIcon className="landing-logo-svg" aria-hidden="true" />
            </div>
            <span className="landing-logo-text">JobPilot</span>
          </div>

          <div className="landing-nav-top-actions">
            <div className="theme-toggle-group">
              <button
                className={`theme-btn${!darkMode ? " active" : ""}`}
                onClick={() => darkMode && toggleDarkMode()}
                aria-label="Light mode"
                title="Hell"
              >
                <SunIcon className="theme-icon" aria-hidden="true" />
              </button>
              <button
                className={`theme-btn${darkMode ? " active" : ""}`}
                onClick={() => !darkMode && toggleDarkMode()}
                aria-label="Dark mode"
                title="Dunkel"
              >
                <MoonIcon className="theme-icon" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="landing-nav-right">
            <button className="landing-nav-login" onClick={handleLogin}>
              Anmelden
            </button>
            <button className="landing-cta-nav" onClick={handleRegister}>
              Registrieren
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <div className="landing-hero-badge">
            <CheckIcon className="badge-icon" />
            <span>Kostenlos und einfach zu nutzen</span>
          </div>
          <h1 className="landing-hero-title">
            Dein Bewerbungsprozess.
            <br />
            <span className="landing-hero-highlight">Organisiert.</span>
          </h1>
          <p className="landing-hero-description">
            JobPilot hilft dir, den Überblick über all deine Bewerbungen zu
            behalten. Tracke Status, Termine und Notizen - alles an einem Ort.
          </p>
          <div className="landing-hero-actions">
            <button className="landing-cta-primary" onClick={handleEnterApp}>
              Kostenlos starten
            </button>
            <button className="landing-cta-secondary" onClick={handleLogin}>
              Zum Login
            </button>
          </div>
        </div>

        <div className="landing-hero-visual">
          {/* Beide Varianten liegen übereinander und blenden mit dem
              Dark Mode ineinander über (siehe .landing-hero-art in der CSS) */}
          <div className="landing-hero-art">
            <img
              className="landing-hero-illustration landing-hero-illustration--light"
              src="/paperplane-light.svg"
              width="560"
              height="480"
              alt=""
              aria-hidden={darkMode}
            />
            <img
              className="landing-hero-illustration landing-hero-illustration--dark"
              src="/paperplane-dark.svg"
              width="560"
              height="480"
              alt=""
              aria-hidden={!darkMode}
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="landing-stats">
        <div className="landing-stats-content">
          {stats.map((stat, index) => (
            <div key={index} className="landing-stat-item">
              <span className="landing-stat-value">{stat.value}</span>
              <span className="landing-stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-features">
        <div className="landing-features-content">
          <div className="landing-features-header">
            <h2 className="landing-features-title">Alles was du brauchst</h2>
            <p className="landing-features-subtitle">
              Einfache Tools, um deinen Bewerbungsprozess zu optimieren
            </p>
          </div>

          <div className="landing-features-grid">
            {features.map((feature, index) => (
              <div key={index} className="landing-feature-card">
                <div className="landing-feature-icon">{feature.icon}</div>
                <h3 className="landing-feature-title">{feature.title}</h3>
                <p className="landing-feature-description">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta-section">
        <div className="landing-cta-content">
          <h2 className="landing-cta-title">
            Bereit, deine Bewerbungen zu organisieren?
          </h2>
          <p className="landing-cta-description">
            Starte jetzt kostenlos und behalte den Überblick über all deine
            Karrierechancen.
          </p>
          <button className="landing-cta-button" onClick={handleEnterApp}>
            Jetzt loslegen
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-content">
          <div className="landing-footer-logo">
            <div className="landing-logo-icon small">
              <BriefcaseIcon className="landing-logo-svg" aria-hidden="true" />
            </div>
            <span className="landing-logo-text">JobPilot</span>
          </div>
          <p className="landing-footer-text">
            Dein persönlicher Bewerbungstracker
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
