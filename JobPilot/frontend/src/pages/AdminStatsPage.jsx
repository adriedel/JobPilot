import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminStats, getStoredUser } from "../services/auth";
import { STATUS_LABELS, STATUS_ORDER } from "../utils/constants";
import "./AdminPage.css";
import "./AdminStatsPage.css";

const DAY_MS = 24 * 60 * 60 * 1000;
const INACTIVE_AFTER_DAYS = 30;

// Statusfarben aus App.css (in_planung heißt dort "in-planung")
function statusColor(status) {
  const key = status === "in_planung" ? "in-planung" : status;
  return `var(--status-${key}-accent)`;
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / DAY_MS);
}

function formatRelative(dateStr) {
  const days = daysSince(dateStr);
  if (days === null) return "noch nie";
  if (days <= 0) return "heute";
  if (days === 1) return "gestern";
  if (days < 14) return `vor ${days} Tagen`;
  if (days < 60) return `vor ${Math.floor(days / 7)} Wochen`;
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

/** Rückmeldequote: Antworten (weiter/Zusage/Absage) von allen abgeschickten. */
function responseRate(counts) {
  const sent = counts.gesamt - counts.in_planung;
  if (sent <= 0) return null;
  return (counts.stufe_weiter + counts.angenommen + counts.abgelehnt) / sent;
}

function formatPercent(rate) {
  return rate === null ? "—" : `${Math.round(rate * 100)} %`;
}

/** Gestapelter Balken der Status-Verteilung (mit Lücken zwischen Segmenten). */
function StatusBar({ counts, total, size = "large", onHover }) {
  if (!total) return <div className={`stats-statusbar stats-statusbar--${size} stats-statusbar--empty`} />;
  return (
    <div
      className={`stats-statusbar stats-statusbar--${size}`}
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
          onMouseEnter={onHover ? () => onHover(s) : undefined}
          onMouseLeave={onHover ? () => onHover(null) : undefined}
        />
      ))}
    </div>
  );
}

/** Neu angelegte Bewerbungen pro Woche – einfache Balken mit Hover-Tooltip. */
function WeeklyChart({ weekly }) {
  const [hovered, setHovered] = useState(null);
  const max = Math.max(1, ...weekly.map((w) => w.anzahl));

  return (
    <div className="stats-weekly">
      <div className="stats-weekly-plot">
        {weekly.map((w, i) => (
          <div
            key={w.woche}
            className={`stats-weekly-col ${hovered === i ? "is-hovered" : ""}`}
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

const SORTS = {
  aktivitaet: {
    label: "Letzte Aktivität",
    compare: (a, b) =>
      new Date(b.letzte_aktivitaet || 0) - new Date(a.letzte_aktivitaet || 0),
  },
  gesamt: { label: "Bewerbungen", compare: (a, b) => b.gesamt - a.gesamt },
  neu: { label: "Letzte 30 Tage", compare: (a, b) => b.neu_30_tage - a.neu_30_tage },
  quote: {
    label: "Rückmeldequote",
    compare: (a, b) => (responseRate(b) ?? -1) - (responseRate(a) ?? -1),
  },
};

function AdminStatsPage() {
  const [user] = useState(getStoredUser);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [sortKey, setSortKey] = useState("aktivitaet");
  const [hoveredStatus, setHoveredStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/dashboard", { replace: true });
      return;
    }
    getAdminStats()
      .then(setData)
      .catch((err) => setError(err.message));
  }, [user, navigate]);

  const summary = useMemo(() => {
    if (!data) return null;
    const totals = { gesamt: 0 };
    STATUS_ORDER.forEach((s) => (totals[s] = 0));
    let neu30 = 0;
    let active = 0;
    data.users.forEach((u) => {
      totals.gesamt += u.gesamt;
      STATUS_ORDER.forEach((s) => (totals[s] += u[s]));
      neu30 += u.neu_30_tage;
      const days = daysSince(u.letzte_aktivitaet);
      if (days !== null && days < INACTIVE_AFTER_DAYS) active += 1;
    });
    return { totals, neu30, active, rate: responseRate(totals) };
  }, [data]);

  const sortedUsers = useMemo(
    () => (data ? [...data.users].sort(SORTS[sortKey].compare) : []),
    [data, sortKey],
  );

  return (
    <div className="admin-page">
      <div className="admin-header">
        <button className="admin-back-btn" onClick={() => navigate("/admin")}>
          ← Admin-Bereich
        </button>
        <div className="admin-header-title">
          <h1>Statistiken</h1>
          <p>Wie läuft es bei den Usern?</p>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {!data && !error && <div className="admin-loading">Lade Statistiken…</div>}

      {data && summary && (
        <>
          <div className="admin-stats">
            <div className="admin-stat-card">
              <span className="admin-stat-number">
                {summary.active}
                <span className="stats-stat-of"> / {data.users.length}</span>
              </span>
              <span className="admin-stat-label">Aktive User (letzte 30 Tage)</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-number">{summary.neu30}</span>
              <span className="admin-stat-label">Neue Bewerbungen (letzte 30 Tage)</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-number">{formatPercent(summary.rate)}</span>
              <span className="admin-stat-label">Rückmeldequote gesamt</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-number">{summary.totals.angenommen}</span>
              <span className="admin-stat-label">Zusagen gesamt</span>
            </div>
          </div>

          <div className="stats-panels">
            <section className="stats-panel">
              <h2>Status aller Bewerbungen</h2>
              <p className="stats-panel-sub">{summary.totals.gesamt} Bewerbungen insgesamt</p>
              <StatusBar
                counts={summary.totals}
                total={summary.totals.gesamt}
                onHover={setHoveredStatus}
              />
              <ul className="stats-legend">
                {STATUS_ORDER.map((s) => (
                  <li
                    key={s}
                    className={hoveredStatus && hoveredStatus !== s ? "is-dimmed" : ""}
                  >
                    <span className="stats-legend-swatch" style={{ background: statusColor(s) }} />
                    <span className="stats-legend-label">{STATUS_LABELS[s]}</span>
                    <span className="stats-legend-value">
                      {summary.totals[s]}
                      {summary.totals.gesamt > 0 && (
                        <span className="stats-legend-pct">
                          {" "}
                          · {Math.round((summary.totals[s] / summary.totals.gesamt) * 100)} %
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="stats-panel">
              <h2>Neue Bewerbungen pro Woche</h2>
              <p className="stats-panel-sub">Alle User, letzte 12 Wochen</p>
              <WeeklyChart weekly={data.weekly} />
            </section>
          </div>

          <div className="stats-table-head">
            <h2>Pro User</h2>
            <label className="stats-sort">
              Sortieren nach
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
                {Object.entries(SORTS).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table stats-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Bewerbungen</th>
                  <th>Letzte 30 Tage</th>
                  <th>Verteilung</th>
                  <th>Rückmeldequote</th>
                  <th>Zusagen</th>
                  <th>Letzte Aktivität</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((u) => {
                  const days = daysSince(u.letzte_aktivitaet);
                  const inactive = days === null || days >= INACTIVE_AFTER_DAYS;
                  return (
                    <tr key={u.id} className={u.id === user?.id ? "admin-table-row--self" : ""}>
                      <td data-label="User">
                        <div className="stats-user">
                          <span className="stats-user-name">{u.name || u.email}</span>
                          {u.name && <span className="stats-user-email">{u.email}</span>}
                        </div>
                      </td>
                      <td data-label="Bewerbungen">{u.gesamt}</td>
                      <td data-label="Letzte 30 Tage">{u.neu_30_tage}</td>
                      <td data-label="Verteilung" className="stats-dist-cell">
                        <StatusBar counts={u} total={u.gesamt} size="small" />
                      </td>
                      <td data-label="Rückmeldequote">{formatPercent(responseRate(u))}</td>
                      <td data-label="Zusagen">{u.angenommen}</td>
                      <td data-label="Letzte Aktivität">
                        <span className={inactive ? "stats-inactive" : "stats-active"}>
                          {formatRelative(u.letzte_aktivitaet)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="stats-footnote">
            Rückmeldequote = Antworten (Stufe weiter, Angenommen, Abgelehnt) im Verhältnis zu
            allen abgeschickten Bewerbungen (ohne „In Planung“). Aktiv = Bewerbung angelegt,
            geändert oder Verlauf ergänzt in den letzten {INACTIVE_AFTER_DAYS} Tagen.
          </p>
        </>
      )}
    </div>
  );
}

export default AdminStatsPage;
