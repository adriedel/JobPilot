import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "./VerlaufPanel.css";
import { getUpdates, addUpdate, deleteUpdate } from "../../services/api";
import {
  MANUAL_UPDATE_TYPES,
  todayIso,
  formatShortDate,
  describeEntry,
  buildTimeline,
} from "../../utils/verlauf";
import TrashIcon from "../../assets/icons/trash.svg?react";

/**
 * Seitenpanel mit dem Verlauf einer Bewerbung:
 * oben "Update hinzufügen" (Notiz/Gespräch/Mail), darunter die Timeline.
 * Status-Wechsel trägt das Backend automatisch ein.
 */
function VerlaufPanel({ bewerbung, onClose, onChanged }) {
  const { t, i18n } = useTranslation();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typ, setTyp] = useState(MANUAL_UPDATE_TYPES[0]);
  const [text, setText] = useState("");
  const [datum, setDatum] = useState(todayIso);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef(null);

  const bewerbungId = bewerbung.id;
  const verlaufAnzahl = bewerbung.verlauf_anzahl;

  // Neu laden bei anderer Bewerbung oder wenn sich die Anzahl der Einträge
  // ändert (z.B. Status über das Karten-Menü gewechselt).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    getUpdates(bewerbungId)
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .catch(() => {
        if (!cancelled) setError(t("verlauf.loadError"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bewerbungId, verlaufAnzahl, t]);

  // Formular zurücksetzen, wenn eine andere Bewerbung geöffnet wird
  useEffect(() => {
    setText("");
    setTyp(MANUAL_UPDATE_TYPES[0]);
    setDatum(todayIso());
  }, [bewerbungId]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!text.trim() || saving) return;

    setSaving(true);
    setError("");
    try {
      const created = await addUpdate(bewerbungId, {
        typ,
        text: text.trim(),
        datum: datum || todayIso(),
      });
      setEntries((prev) =>
        [created, ...prev].sort(
          (a, b) => b.datum.localeCompare(a.datum) || b.id - a.id,
        ),
      );
      setText("");
      setDatum(todayIso());
      onChanged?.();
      textareaRef.current?.focus();
    } catch {
      setError(t("verlauf.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entryId) => {
    try {
      await deleteUpdate(bewerbungId, entryId);
      setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
      onChanged?.();
    } catch {
      setError(t("verlauf.saveError"));
    }
  };

  const timeline = buildTimeline(entries, bewerbung);
  const isToday = datum === todayIso();
  const meta = [bewerbung.firma, bewerbung.standort].filter(Boolean).join(" · ");

  return (
    <>
      <div className="verlauf-backdrop" onClick={onClose} aria-hidden="true" />
      <aside
        className="verlauf-panel"
        aria-label={`${t("verlauf.title")}: ${bewerbung.position}`}
      >
        <header className="verlauf-header">
          <div className="verlauf-header-top">
            <h2 className="verlauf-title">{bewerbung.position}</h2>
            <span className={`verlauf-status-pill status-${bewerbung.status}`}>
              {t(`status.${bewerbung.status}`)}
            </span>
            <button
              type="button"
              className="verlauf-close"
              onClick={onClose}
              aria-label={t("verlauf.close")}
            >
              ×
            </button>
          </div>
          {meta && <p className="verlauf-meta">{meta}</p>}
        </header>

        <form className="verlauf-form" onSubmit={handleSubmit}>
          <h3 className="verlauf-form-title">{t("verlauf.addUpdate")}</h3>

          <div className="verlauf-types" role="radiogroup">
            {MANUAL_UPDATE_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                role="radio"
                aria-checked={typ === type}
                className={`verlauf-type ${typ === type ? "active" : ""}`}
                onClick={() => setTyp(type)}
              >
                {t(`verlauf.types.${type}`)}
              </button>
            ))}
          </div>

          <textarea
            ref={textareaRef}
            className="verlauf-textarea"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                handleSubmit(event);
              }
            }}
            placeholder={t("verlauf.placeholder")}
            rows={3}
          />

          <div className="verlauf-form-footer">
            <label className="verlauf-date">
              <span>
                {t("verlauf.date")}
                {isToday ? ` (${t("verlauf.today")})` : ""}:
              </span>
              <input
                type="date"
                value={datum}
                max={todayIso()}
                onChange={(event) => setDatum(event.target.value)}
              />
            </label>
            <button
              type="submit"
              className="verlauf-save"
              disabled={!text.trim() || saving}
            >
              {saving ? t("verlauf.saving") : t("verlauf.save")}
            </button>
          </div>

          {error && <p className="verlauf-error">{error}</p>}
        </form>

        <div className="verlauf-timeline-wrap">
          {loading && timeline.length === 0 ? null : timeline.length === 0 ? (
            <p className="verlauf-empty">{t("verlauf.empty")}</p>
          ) : (
            <ol className="verlauf-timeline">
              {timeline.map((entry) => (
                <li key={entry.id} className="verlauf-entry">
                  <span className="verlauf-dot" aria-hidden="true" />
                  <div className="verlauf-entry-body">
                    <div className="verlauf-entry-meta">
                      <time dateTime={entry.datum}>
                        {formatShortDate(entry.datum, i18n.language)}
                      </time>
                      <span>{t(`verlauf.types.${entry.typ}`)}</span>
                      {/* Die Notiz der Bewerbung wird über "Bearbeiten" gepflegt */}
                      {!entry.isNote && (
                        <button
                          type="button"
                          className="verlauf-entry-delete"
                          onClick={() => handleDelete(entry.id)}
                          aria-label={t("verlauf.deleteEntry")}
                          title={t("verlauf.deleteEntry")}
                        >
                          <TrashIcon aria-hidden="true" />
                        </button>
                      )}
                    </div>
                    <p className="verlauf-entry-text">
                      {describeEntry(entry, t)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </aside>
    </>
  );
}

export default VerlaufPanel;
