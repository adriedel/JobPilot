import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAdminUserStats, getStoredUser } from "../services/auth";
import { STATUS_LABELS, STATUS_ORDER } from "../utils/constants";
import "./AdminPage.css";
import "./AdminUserStatsPage.css";

const DAY_MS = 24 * 60 * 60 * 1000;

// Statusfarben aus App.css (in_planung heißt dort "in-planung")
function statusColor(status) {
  const key = status === "in_planung" ? "in-planung" : status;
  return `var(--status-${key}-accent)`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatShortDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatRelative(dateStr) {
  if (!dateStr) return "noch nie";
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / DAY_MS);
  if (days <= 0) return "heute";
  if (days === 1) return "gestern";
  if (days < 14) return `vor ${days} Tagen`;
  if (days < 60) return `vor ${Math.floor(days / 7)} Wochen`;
  return formatDate(dateStr);
}

/** Rückmeldequote: Antworten (weiter/Zusage/Absage) von allen abgeschickten. */
function responseRate(counts) {
  const sent = counts.gesamt - counts.in_planung;
  if (sent <= 0) return null;
  return (counts.stufe_weiter + counts.angenommen + counts.abgelehnt) / sent;
}

/** Gestapelter Balken der Status-Verteilung (mit Lücken zwischen Segmenten). */
function StatusBar({ counts, onHover }) {
  if (!counts.gesamt) return <div className="stats-statusbar stats-statusbar--empty" />;
  return (
    <div
      className="stats-statusbar"
      role="img"
      aria-label={STATUS_ORDER.filter((s) => counts[s])
        .map((s) => `${STATUS_LABELS[s]}: ${counts[s]}`)
        .join(", ")}
    >
      {STATUS_ORDER.filter((s) => counts[s] > 0).map((s) => (
        <div
          key={s}
          className="stats-statusbar-seg"
          style={{ flexGrow: counts[s], background: statusColor(s) }}
          title={`${STATUS_LABELS[s]}: ${counts[s]}`}
          onMouseEnter={() => onHover(s)}
          onMouseLeave={() => onHover(null)}
        />
      ))}
    </div>
  );
}

/** Bewerbungen pro Woche – einfache Balken mit Hover-Tooltip. */
function WeeklyChart({ weekly }) {
  const [hovered, setHovered] = useState(null);
  const max = Math.max(1, ...weekly.map((w) => w.anzahl));

  return (
    <div className="stats-weekly">
      <div className="stats-weekly-plot">
        {weekly.map((w, i) => (
          <div
            key={w.woche}
            className="stats-weekly-col"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(i)}
            onBlur={() => setHovered(null)}
            tabIndex={0}
            aria-label={`Woche ab ${formatShortDate(w.woche)}: ${w.anzahl} Bewerbungen`}
          >
            {hovered === i && (
              <div className="stats-tooltip" role="tooltip">
                <span className="stats-tooltip-label">Woche ab {formatShortDate(w.woche)}</span>
                <strong>{w.anzahl}</strong> {w.anzahl === 1 ? "Bewerbung" : "Bewerbungen"}
              </div>
            )}
            <div
              className="stats-weekly-bar"
              style={{ height: w.anzahl ? `${(w.anzahl / max) * 100}%` : 0 }}
            />
          </div>
        ))}
      </div>
      <div className="stats-weekly-axis">
        {weekly.map((w, i) => (
          <span key={w.woche}>{i % 2 === weekly.length % 2 ? formatShortDate(w.woche) : ""}</span>
        ))}
      </div>
    </div>
  );
}

function AdminUserStatsPage() {
  const { id } = useParams();
  const [admin] = useState(getStoredUser);
  // Ergebnis inkl. ID merken, damit beim Wechsel nie Daten eines anderen Users stehen bleiben
  const [result, setResult] = useState({ id: null, data: null, error: "" });
  const [hoveredStatus, setHoveredStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (admin?.role !== "admin") {
      navigate("/dashboard", { replace: true });
      return;
    }
    let cancelled = false;
    getAdminUserStats(id)
      .then((data) => !cancelled && setResult({ id, data, error: "" }))
      .catch((err) => !cancelled && setResult({ id, data: null, error: err.message }));
    return () => {
      cancelled = true;
    };
  }, [admin, id, navigate]);

  const current = result.id === id ? result : { data: null, error: "" };
  const { data, error } = current;
  const u = data?.user;
  const rate = u ? responseRate(u) : null;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <button className="admin-back-btn" onClick={() => navigate("/admin")}>
          ← Admin-Bereich
        </button>
        <div className="admin-header-title">
          <h1>Statistik{u ? `: ${u.name || u.email}` : ""}</h1>
          <p>
            {u
              ? `${u.name ? `${u.email} · ` : ""}${u.role === "admin" ? "Admin" : "User"} · registriert am ${formatDate(u.created_at)}`
              : "Wie läuft es bei diesem User?"}
          </p>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {!data && !error && <div className="admin-loading">Lade Statistik…</div>}

      {u && (
        <>
          <div className="admin-stats">
            <div className="admin-stat-card">
              <span className="admin-stat-number">{u.gesamt}</span>
              <span className="admin-stat-label">Bewerbungen gesamt</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-number">{u.neu_30_tage}</span>
              <span className="admin-stat-label">Bewerbungen (letzte 30 Tage)</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-number">
                {rate === null ? "—" : `${Math.round(rate * 100)} %`}
              </span>
              <span className="admin-stat-label">Rückmeldequote</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-number">{u.angenommen}</span>
              <span className="admin-stat-label">Zusagen</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-number stats-stat-text">
                {formatRelative(u.letzte_aktivitaet)}
              </span>
              <span className="admin-stat-label">Letzte Aktivität</span>
            </div>
          </div>

          <div className="stats-panels">
            <section className="stats-panel">
              <h2>Status der Bewerbungen</h2>
              <p className="stats-panel-sub">{u.gesamt} Bewerbungen insgesamt</p>
              <StatusBar counts={u} onHover={setHoveredStatus} />
              <ul className="stats-legend">
                {STATUS_ORDER.map((s) => (
                  <li key={s} className={hoveredStatus && hoveredStatus !== s ? "is-dimmed" : ""}>
                    <span className="stats-legend-swatch" style={{ background: statusColor(s) }} />
                    <span className="stats-legend-label">{STATUS_LABELS[s]}</span>
                    <span className="stats-legend-value">
                      {u[s]}
                      {u.gesamt > 0 && (
                        <span className="stats-legend-pct">
                          {" "}
                          · {Math.round((u[s] / u.gesamt) * 100)} %
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="stats-panel">
              <h2>Bewerbungen pro Woche</h2>
              <p className="stats-panel-sub">Nach Bewerbungsdatum, letzte 12 Wochen</p>
              <WeeklyChart weekly={data.weekly} />
            </section>
          </div>

          <div className="stats-table-head">
            <h2>Bewerbungen</h2>
          </div>

          {data.bewerbungen.length === 0 ? (
            <div className="admin-loading">Dieser User hat noch keine Bewerbungen.</div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table stats-table">
                <thead>
                  <tr>
                    <th>Firma</th>
                    <th>Stelle</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bewerbungen.map((b) => (
                    <tr key={b.id}>
                      <td data-label="Firma">{b.firma}</td>
                      <td data-label="Stelle">{b.position}</td>
                      <td data-label="Status">
                        <span className="stats-status">
                          <span
                            className="stats-legend-swatch"
                            style={{ background: statusColor(b.status) }}
                          />
                          {STATUS_LABELS[b.status] || b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="stats-footnote">
            Rückmeldequote = Antworten (Stufe weiter, Angenommen, Abgelehnt) im Verhältnis zu
            allen abgeschickten Bewerbungen (ohne „In Planung“). Letzte Aktivität = Bewerbung
            angelegt, geändert oder Verlauf ergänzt.
          </p>
        </>
      )}
    </div>
  );
}

export default AdminUserStatsPage;
