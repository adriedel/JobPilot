import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
const FEATURES = [
  {
    icon: PlanIcon,
    title: "Status-Tracking",
    description:
      "Von „In Planung“ bis „Angenommen“: Du siehst auf einen Blick, wo jede Bewerbung steht.",
    demo: (
      <div className="landing-mini-pills">
        <span className="landing-mini-pill status-beworben">Beworben</span>
        <span className="landing-mini-pill status-stufe_weiter">
          Stufe weiter
        </span>
        <span className="landing-mini-pill status-angenommen">Angenommen</span>
        <span className="landing-mini-pill status-abgelehnt">Abgelehnt</span>
      </div>
    ),
  },
  {
    icon: PersonIcon,
    title: "Notizen & Kontakte",
    description:
      "Ansprechperson, Gehalt und Notizen direkt an der Bewerbung – genau dort, wo du sie vor dem Gespräch brauchst.",
    demo: (
      <div className="landing-mini-note">
        <strong>Lisa Müller</strong> · Portfolio verschickt, Rückmeldung nächste
        Woche
      </div>
    ),
  },
  {
    icon: TrendingIcon,
    title: "Statistiken",
    description:
      "Wie viele Bewerbungen laufen, wie viele kommen weiter? Du erkennst, was funktioniert.",
    demo: (
      <div className="landing-mini-stats">
        <span>
          <strong>12</strong> Gesamt
        </span>
        <span>
          <strong>4</strong> Stufe weiter
        </span>
        <span>
          <strong>1</strong> Angenommen
        </span>
      </div>
    ),
  },
  {
    icon: PinIcon,
    title: "Bookmarklet & PDF-Export",
    description:
      "Stellenanzeigen mit einem Klick aus dem Jobportal übernehmen und alle Bewerbungen als PDF exportieren.",
    demo: (
      <div className="landing-mini-pills">
        <span className="landing-mini-chip">+ Aus Jobportal übernehmen</span>
        <span className="landing-mini-chip">PDF-Export</span>
      </div>
    ),
  },
];

const STEPS = [
  {
    title: "Konto anlegen",
    description:
      "Kostenlos registrieren, ohne Installation. JobPilot läuft im Browser.",
  },
  {
    title: "Bewerbungen eintragen",
    description:
      "Unternehmen, Stelle und Datum – Kontakte und Notizen ergänzt du, wann du willst.",
  },
  {
    title: "Status aktuell halten",
    description:
      "Status ändern, Termine notieren und den Fortschritt in der Übersicht verfolgen.",
  },
];

const FAQ = [
  {
    question: "Ist JobPilot wirklich kostenlos?",
    answer: "Ja. Du kannst alle Funktionen kostenlos nutzen.",
  },
  {
    question: "Muss ich etwas installieren?",
    answer:
      "Nein. JobPilot läuft im Browser – am Rechner und auf dem Handy. Das Bookmarklet zum Übernehmen von Stellenanzeigen ist optional.",
  },
  {
    question: "Gibt es JobPilot auch auf Englisch?",
    answer: "Ja. Du kannst jederzeit zwischen Deutsch und Englisch wechseln.",
  },
  {
    question: "Kann ich mein Konto löschen?",
    answer:
      "Ja. Schreib uns kurz, dann löschen wir dein Konto mit allen Bewerbungen.",
  },
];

const NAV_LINKS = [
  { href: "#funktionen", label: "Funktionen" },
  { href: "#so-funktionierts", label: "So funktioniert's" },
  { href: "#faq", label: "FAQ" },
];

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
            {NAV_LINKS.map((link) => (
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
          <h1 className="landing-hero-title">
            Dein Bewerbungsprozess{" "}
            <span className="landing-hero-highlight">organisiert</span>
          </h1>
          <p className="landing-hero-description">
            Status, Termine, Notizen und Kontakte zu jeder Bewerbung – an einem
            Ort. Damit du weißt, wo du stehst. Kostenlos, direkt im Browser.
          </p>
          <div className="landing-hero-actions">
            <button className="landing-cta-primary" onClick={handleEnterApp}>
              Kostenlos starten <span aria-hidden="true">→</span>
            </button>
            <a className="landing-cta-secondary" href="#funktionen">
              Funktionen ansehen
            </a>
          </div>
          <p className="landing-hero-login">
            Schon ein Konto?{" "}
            <a
              href="/login"
              onClick={(event) => {
                event.preventDefault();
                handleLogin();
              }}
            >
              Anmelden
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
          <p className="landing-eyebrow">Funktionen</p>
          <h2 className="landing-section-title">
            Alles, was eine Bewerbung braucht, ohne Ballast
          </h2>
          <p className="landing-section-subtitle">
            Schluss mit Excel-Listen, Notizzetteln und Suchen im Postfach.
          </p>

          <div className="landing-features-grid">
            {FEATURES.map(({ icon, title, description, demo }) => {
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
          <p className="landing-eyebrow">So funktioniert's</p>
          <h2 className="landing-section-title">In drei Schritten startklar</h2>

          <ol className="landing-steps-grid">
            {STEPS.map((step, index) => (
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
          <p className="landing-eyebrow">FAQ</p>
          <h2 className="landing-section-title">Häufige Fragen</h2>

          <div className="landing-faq-list">
            {FAQ.map((item, index) => (
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
            <h2 className="landing-cta-title">Bereit für mehr Überblick?</h2>
            <p className="landing-cta-description">
              Starte kostenlos und behalte deine Bewerbungen im Griff.
            </p>
          </div>
          <button className="landing-cta-button" onClick={handleEnterApp}>
            Jetzt kostenlos starten
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
            <p className="landing-footer-text">
              Dein persönlicher Bewerbungstracker
            </p>
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
