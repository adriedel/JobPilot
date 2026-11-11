import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./LandingPage.css";
import BriefcaseIcon from "../assets/icons/briefcase-white.svg?react";
import SunIcon from "../assets/icons/sun.svg?react";
import MoonIcon from "../assets/icons/moon.svg?react";
import PlanIcon from "../assets/icons/plan.svg?react";
import PersonIcon from "../assets/icons/person-2.svg?react";
import TrendingIcon from "../assets/icons/trending.svg?react";
import PinIcon from "../assets/icons/pin.svg?react";
import { isAuthenticated } from "../services/auth";
import AppPreview from "../components/AppPreview/AppPreview";

// Nur Funktionen, die die App wirklich hat
function getFeatures(t) {
  return [
    {
      icon: PlanIcon,
      title: t("landing.features.statusTitle"),
      description: t("landing.features.statusText"),
      demo: (
        <div className="landing-mini-pills">
          <span className="landing-mini-pill status-beworben">
            {t("status.beworben")}
          </span>
          <span className="landing-mini-pill status-stufe_weiter">
            {t("status.stufe_weiter")}
          </span>
          <span className="landing-mini-pill status-angenommen">
            {t("status.angenommen")}
          </span>
          <span className="landing-mini-pill status-abgelehnt">
            {t("status.abgelehnt")}
          </span>
        </div>
      ),
    },
    {
      icon: PersonIcon,
      title: t("landing.features.notesTitle"),
      description: t("landing.features.notesText"),
      demo: (
        <div className="landing-mini-note">
          <strong>Lisa Müller</strong> · {t("landing.features.notesDemo")}
        </div>
      ),
    },
    {
      icon: TrendingIcon,
      title: t("landing.features.statsTitle"),
      description: t("landing.features.statsText"),
      demo: (
        <div className="landing-mini-stats">
          <span>
            <strong>12</strong> {t("statCards.total")}
          </span>
          <span>
            <strong>4</strong> {t("status.stufe_weiter")}
          </span>
          <span>
            <strong>1</strong> {t("status.angenommen")}
          </span>
        </div>
      ),
    },
    {
      icon: PinIcon,
      title: t("landing.features.toolsTitle"),
      description: t("landing.features.toolsText"),
      demo: (
        <div className="landing-mini-pills">
          <span className="landing-mini-chip">
            {t("landing.features.toolsDemoBookmarklet")}
          </span>
          <span className="landing-mini-chip">
            {t("landing.features.toolsDemoPdf")}
          </span>
        </div>
      ),
    },
  ];
}

function getSteps(t) {
  return [
    { title: t("landing.steps.accountTitle"), description: t("landing.steps.accountText") },
    { title: t("landing.steps.addTitle"), description: t("landing.steps.addText") },
    { title: t("landing.steps.trackTitle"), description: t("landing.steps.trackText") },
  ];
}

function getFaq(t) {
  return ["free", "install", "language", "delete"].map((key) => ({
    question: t(`landing.faq.${key}Q`),
    answer: t(`landing.faq.${key}A`),
  }));
}

function getNavLinks(t) {
  return [
    { href: "#funktionen", label: t("landing.nav.features") },
    { href: "#so-funktionierts", label: t("landing.nav.howItWorks") },
    { href: "#faq", label: t("landing.nav.faq") },
  ];
}

function LandingPage({ onEnterApp }) {
  const { t } = useTranslation();
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

          <div className="landing-nav-links">
            {getNavLinks(t).map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
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
              {t("landing.nav.login")}
            </button>
            <button className="landing-cta-nav" onClick={handleRegister}>
              {t("landing.nav.register")}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <h1 className="landing-hero-title">
            {t("landing.hero.title")}{" "}
            <span className="landing-hero-highlight">
              {t("landing.hero.highlight")}
            </span>
          </h1>
          <p className="landing-hero-description">
            {t("landing.hero.description")}
          </p>
          <div className="landing-hero-actions">
            <button className="landing-cta-primary" onClick={handleEnterApp}>
              {t("landing.hero.start")} <span aria-hidden="true">→</span>
            </button>
            <a className="landing-cta-secondary" href="#funktionen">
              {t("landing.hero.seeFeatures")}
            </a>
          </div>
          <p className="landing-hero-login">
            {t("landing.hero.hasAccount")}{" "}
            <a
              href="/login"
              onClick={(event) => {
                event.preventDefault();
                handleLogin();
              }}
            >
              {t("landing.hero.login")}
            </a>
          </p>
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

      {/* App-Vorschau */}
      <AppPreview />

      {/* Funktionen */}
      <section className="landing-section landing-features" id="funktionen">
        <div className="landing-section-content">
          <p className="landing-eyebrow">{t("landing.features.eyebrow")}</p>
          <h2 className="landing-section-title">{t("landing.features.title")}</h2>
          <p className="landing-section-subtitle">
            {t("landing.features.subtitle")}
          </p>

          <div className="landing-features-grid">
            {getFeatures(t).map(({ icon, title, description, demo }) => {
              const Icon = icon;
              return (
                <article key={title} className="landing-feature-card">
                  <Icon className="landing-feature-icon" aria-hidden="true" />
                  <h3 className="landing-feature-title">{title}</h3>
                  <p className="landing-feature-description">{description}</p>
                  <div className="landing-feature-demo" aria-hidden="true">
                    {demo}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* So funktioniert's */}
      <section className="landing-section landing-steps" id="so-funktionierts">
        <div className="landing-section-content">
          <p className="landing-eyebrow">{t("landing.steps.eyebrow")}</p>
          <h2 className="landing-section-title">{t("landing.steps.title")}</h2>

          <ol className="landing-steps-grid">
            {getSteps(t).map((step, index) => (
              <li key={step.title} className="landing-step">
                <span className="landing-step-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="landing-step-title">{step.title}</h3>
                <p className="landing-step-description">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="landing-section landing-faq" id="faq">
        <div className="landing-section-content landing-faq-content">
          <p className="landing-eyebrow">{t("landing.faq.eyebrow")}</p>
          <h2 className="landing-section-title">{t("landing.faq.title")}</h2>

          <div className="landing-faq-list">
            {getFaq(t).map((item, index) => (
              <details key={item.question} open={index === 0}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta-section">
        <div className="landing-cta-box">
          <div>
            <h2 className="landing-cta-title">{t("landing.cta.title")}</h2>
            <p className="landing-cta-description">
              {t("landing.cta.description")}
            </p>
          </div>
          <button className="landing-cta-button" onClick={handleEnterApp}>
            {t("landing.cta.button")}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-content">
          <div className="landing-footer-brand">
            <div className="landing-footer-logo">
              <div className="landing-logo-icon small">
                <BriefcaseIcon
                  className="landing-logo-svg"
                  aria-hidden="true"
                />
              </div>
              <span className="landing-logo-text">JobPilot</span>
            </div>
            <p className="landing-footer-text">{t("landing.footer.tagline")}</p>
          </div>
          <p className="landing-footer-copy">
            © {new Date().getFullYear()} JobPilot
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
