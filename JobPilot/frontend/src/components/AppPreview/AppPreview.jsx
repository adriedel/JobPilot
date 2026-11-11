import { useEffect, useRef, useState } from "react";
import "./AppPreview.css";

// Breite, in der das Dashboard im iframe gerendert wird (= max-width von .app)
const DESIGN_WIDTH = 1260;
// Sichtbare Höhe des Dashboards im Fenster (unten weich ausgeblendet)
const DESIGN_HEIGHT = 760;
// Darunter zeigt die Vorschau das echte Handy-Layout statt verkleinertem Desktop
const PHONE_MAX_WIDTH = 600;

/**
 * Größe des iframes: ab PHONE_MAX_WIDTH wird das Dashboard in Desktop-Breite
 * gerendert und auf die Fensterbreite skaliert, darunter in Fensterbreite
 * (Handy-Layout) ohne Skalierung.
 */
function usePreviewSize(ref) {
  const [size, setSize] = useState(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const update = () => {
      const width = el.clientWidth;
      setSize(
        width < PHONE_MAX_WIDTH
          ? { width, scale: 1 }
          : { width: DESIGN_WIDTH, scale: Math.min(1, width / DESIGN_WIDTH) },
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}

/**
 * Vorschau des echten Dashboards im Browserfenster (Landing Page).
 * Das Dashboard läuft in einem iframe (/preview) mit eigener Breite, damit die
 * Komponenten auch auf Tablets ihr Desktop-Layout zeigen. Der iframe ist weder
 * klick- noch fokussierbar; für Screenreader ist das Fenster ein Bild.
 */
function AppPreview() {
  const viewportRef = useRef(null);
  const size = usePreviewSize(viewportRef);

  return (
    <section className="app-preview">
      <h2 className="app-preview-title">So sieht dein Dashboard aus</h2>

      <div
        className="app-preview-window"
        role="img"
        aria-label="Vorschau des JobPilot-Dashboards"
      >
        <div className="app-preview-titlebar" aria-hidden="true">
          <span className="app-preview-dots">
            <span />
            <span />
            <span />
          </span>
          <span className="app-preview-url">bewerbungstracker.com</span>
        </div>

        <div
          className="app-preview-viewport"
          ref={viewportRef}
          style={size ? { height: DESIGN_HEIGHT * size.scale } : undefined}
        >
          {size && (
            <iframe
              className="app-preview-frame"
              src="/preview"
              title="Vorschau des JobPilot-Dashboards"
              tabIndex={-1}
              aria-hidden="true"
              style={{
                width: size.width,
                height: DESIGN_HEIGHT,
                transform: `scale(${size.scale})`,
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}

export default AppPreview;
