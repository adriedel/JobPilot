import { useEffect, useRef, useState } from "react";
import Header from "../Header/header";
import StatCards from "../StatCards/StatCards";
import SearchBar from "../SearchBar/SearchBar";
import BewerbungsCard from "../BewerbungsCard/BewerbungsCard";
import { DEMO_SEED_DATA, buildDemoStats } from "../../services/api";
import "./AppPreview.css";

const noop = () => {};
const PREVIEW_ITEMS = DEMO_SEED_DATA.slice(0, 3);
const PREVIEW_STATS = buildDemoStats(PREVIEW_ITEMS);
const PREVIEW_USER = { name: "Alex Berger", email: "alex@example.com" };

// Breite, in der das Dashboard auf dem Desktop gerendert wird (= max-width von .app)
const DASHBOARD_WIDTH = 1260;
// Ab dieser Viewport-Breite zeigt die Vorschau das Desktop-Layout verkleinert
const DESKTOP_MIN_VIEWPORT = 1024;

/**
 * Berechnet den Zoom-Faktor, damit das Dashboard in voller Desktop-Breite
 * ins Fenster passt. Unter DESKTOP_MIN_VIEWPORT bleibt es beim normalen
 * (mobilen/Tablet-)Layout ohne Zoom.
 */
function usePreviewZoom(ref) {
  const [zoom, setZoom] = useState(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const update = () => {
      if (window.innerWidth < DESKTOP_MIN_VIEWPORT) {
        setZoom(null);
        return;
      }
      setZoom(Math.min(1, el.clientWidth / DASHBOARD_WIDTH));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return zoom;
}

/**
 * Vorschau des echten Dashboards im Browserfenster (Landing Page).
 * Nutzt dieselben Komponenten wie die App mit den Demo-Daten, ist aber über
 * `inert` weder klick- noch fokussierbar und für Screenreader ein Bild.
 */
function AppPreview({ darkMode }) {
  const contentRef = useRef(null);
  const zoom = usePreviewZoom(contentRef);
  const appStyle = zoom === null ? undefined : { width: DASHBOARD_WIDTH, zoom };

  return (
    <section className="app-preview">
      <h2 className="app-preview-title">So könnte dein Dashboard aussehen</h2>

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
          className="app-preview-content"
          ref={contentRef}
          inert
          aria-hidden="true"
        >
          <section className="app" style={appStyle}>
            <Header
              darkMode={darkMode}
              toggleDarkMode={noop}
              onNewBewerbung={noop}
              onExportPdf={noop}
              user={PREVIEW_USER}
              onUserUpdate={noop}
            />
            <div className="stat-cards">
              <StatCards stats={PREVIEW_STATS} />
              <SearchBar
                searchQuery=""
                onSearchChange={noop}
                filterStatus="alle"
                onFilterChange={noop}
                sortBy="datum"
                onSortByChange={noop}
                sortDirection="desc"
                onToggleSortDirection={noop}
              />
            </div>
            <section className="bewerbungen-grid">
              {PREVIEW_ITEMS.map((bewerbung) => (
                <BewerbungsCard
                  key={bewerbung.id}
                  bewerbung={bewerbung}
                  onEdit={noop}
                  onDelete={noop}
                  onStatusChange={noop}
                />
              ))}
            </section>
          </section>
        </div>
      </div>
    </section>
  );
}

export default AppPreview;
