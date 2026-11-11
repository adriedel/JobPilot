import { useEffect, useState } from "react";
import i18n from "../i18n";
import DashboardPreview from "../components/AppPreview/DashboardPreview";
import "./PreviewPage.css";

function readDarkMode() {
  try {
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) return JSON.parse(saved);
  } catch {
    // ignorieren, Systemeinstellung verwenden
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Eigenständige Seite für die Dashboard-Vorschau der Landing Page (/preview).
 * Läuft in einem iframe mit eigener Breite, damit die Komponenten ihr
 * Desktop-Layout zeigen, auch wenn das Gerät schmaler ist.
 * Dark Mode und Sprache folgen der Landing Page über localStorage-Events.
 */
function PreviewPage() {
  const [darkMode, setDarkMode] = useState(readDarkMode);

  useEffect(() => {
    document.documentElement.classList.toggle("dark-mode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === "darkMode") setDarkMode(readDarkMode());
      if (event.key === "language" && event.newValue) {
        i18n.changeLanguage(event.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <div className="preview-page" inert>
      <DashboardPreview darkMode={darkMode} />
    </div>
  );
}

export default PreviewPage;
