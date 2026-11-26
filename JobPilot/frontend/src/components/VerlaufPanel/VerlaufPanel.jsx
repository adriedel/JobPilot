import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "./VerlaufPanel.css";
import {
  getUpdates,
  addUpdate,
  deleteUpdate,
  getUpdateTypes,
  saveUpdateType,
  deleteUpdateType,
} from "../../services/api";
import {
  MANUAL_UPDATE_TYPES,
  MAX_REASON_LENGTH,
  todayIso,
  formatShortDate,
  describeEntry,
  entryTypeLabel,
  buildTimeline,
} from "../../utils/verlauf";
import TrashIcon from "../../assets/icons/trash.svg?react";
import PinIcon from "../../assets/icons/pin.svg?react";

// Wofür ein eigener Grund gilt: nur dieser Eintrag, diese Bewerbung, alle
const REASON_SCOPES = ["once", "bewerbung", "alle"];

/**
 * Seitenpanel mit dem Verlauf einer Bewerbung:
 * oben "Update hinzufügen" (Notiz/Gespräch/Mail/eigener Grund),
 * darunter die Timeline. Status-Wechsel trägt das Backend automatisch ein.
 */
function VerlaufPanel({ bewerbung, onClose, onChanged }) {
  const { t, i18n } = useTranslation();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typ, setTyp] = useState(MANUAL_UPDATE_TYPES[0]);
  const [typLabel, setTypLabel] = useState(null); // nur bei typ "custom"
  const [savedTypes, setSavedTypes] = useState([]);
  const [oneOffLabel, setOneOffLabel] = useState(null);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reasonLabel, setReasonLabel] = useState("");
  const [reasonScope, setReasonScope] = useState("once");
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

  // Formular zurücksetzen und gespeicherte Gründe laden,
  // wenn eine andere Bewerbung geöffnet wird
  useEffect(() => {
    let cancelled = false;
    setText("");
    setTyp(MANUAL_UPDATE_TYPES[0]);
    setTypLabel(null);
    setOneOffLabel(null);
    setReasonOpen(false);
    setReasonLabel("");
    setReasonScope("once");
    setDatum(todayIso());
    setSavedTypes([]);

    getUpdateTypes(bewerbungId)
      .then((data) => {
        if (!cancelled) setSavedTypes(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
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
        ...(typ === "custom" && { typ_label: typLabel }),
        text: text.trim(),
        datum: datum || todayIso(),
      });
      // Ein einmaliger Grund verschwindet nach dem Speichern wieder
      if (typ === "custom" && oneOffLabel && isCustomActive(oneOffLabel)) {
        setOneOffLabel(null);
        selectTyp(MANUAL_UPDATE_TYPES[0]);
      }
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

  // ── Eigene Gründe ──
  const selectTyp = (nextTyp, label = null) => {
    setTyp(nextTyp);
    setTypLabel(label);
  };

  const isCustomActive = (label) =>
    typ === "custom" && typLabel?.toLowerCase() === label.toLowerCase();

  const closeReasonEditor = () => {
    setReasonOpen(false);
    setReasonLabel("");
    setReasonScope("once");
  };

  const handleApplyReason = async () => {
    const label = reasonLabel.trim().replace(/\s+/g, " ");
    if (!label) return;
    const lower = label.toLowerCase();

    // Gibt es den Grund schon (fest eingebaut oder gespeichert)? → einfach auswählen
    const builtIn = MANUAL_UPDATE_TYPES.find(
      (type) => t(`verlauf.types.${type}`).toLowerCase() === lower,
    );
    if (builtIn) {
      selectTyp(builtIn);
      closeReasonEditor();
      return;
    }
    const saved = savedTypes.find((s) => s.label.toLowerCase() === lower);
    if (saved) {
      selectTyp("custom", saved.label);
      closeReasonEditor();
      return;
    }

    if (reasonScope === "once") {
      setOneOffLabel(label);
      selectTyp("custom", label);
      closeReasonEditor();
      return;
    }

    try {
      const created = await saveUpdateType({
        label,
        bewerbung_id: reasonScope === "bewerbung" ? bewerbungId : null,
      });
      setSavedTypes((prev) =>
        prev.some((s) => s.id === created.id) ? prev : [...prev, created],
      );
      selectTyp("custom", created.label);
      closeReasonEditor();
    } catch {
      setError(t("verlauf.saveError"));
    }
  };

  const handleRemoveType = async (saved) => {
    try {
      await deleteUpdateType(saved.id);
      setSavedTypes((prev) => prev.filter((s) => s.id !== saved.id));
      if (isCustomActive(saved.label)) selectTyp(MANUAL_UPDATE_TYPES[0]);
    } catch {
      setError(t("verlauf.saveError"));
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
  const meta = [bewerbung.firma, bewerbung.standort]
    .filter(Boolean)
    .join(" · ");

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
                onClick={() => selectTyp(type)}
              >
                {t(`verlauf.types.${type}`)}
              </button>
            ))}

            {savedTypes.map((saved) => {
              const active = isCustomActive(saved.label);
              return (
                <span
                  key={saved.id}
                  className={`verlauf-type verlauf-type--custom ${active ? "active" : ""}`}
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className="verlauf-type-label"
                    onClick={() => selectTyp("custom", saved.label)}
                    title={
                      saved.bewerbung_id === null
                        ? t("verlauf.scopeAllHint")
                        : t("verlauf.scopeBewerbungHint")
                    }
                  >
                    {saved.label}
                  </button>
                  <button
                    type="button"
                    className="verlauf-type-remove"
                    onClick={() => handleRemoveType(saved)}
                    aria-label={`${t("verlauf.removeReason")}: ${saved.label}`}
                    title={t("verlauf.removeReason")}
                  >
                    ×
                  </button>
                </span>
              );
            })}

            {oneOffLabel && (
              <button
                type="button"
                role="radio"
                aria-checked={isCustomActive(oneOffLabel)}
                className={`verlauf-type verlauf-type--once ${isCustomActive(oneOffLabel) ? "active" : ""}`}
                onClick={() => selectTyp("custom", oneOffLabel)}
                title={t("verlauf.scopeOnce")}
              >
                {oneOffLabel}
              </button>
            )}

            {!reasonOpen && (
              <button
                type="button"
                className="verlauf-type verlauf-type-add"
                onClick={() => setReasonOpen(true)}
                aria-label={t("verlauf.addReason")}
                title={t("verlauf.addReason")}
              >
                +
              </button>
            )}
          </div>

          {reasonOpen && (
            <div className="verlauf-reason">
              <label className="verlauf-reason-label">
                <span>{t("verlauf.addReason")}</span>
                <input
                  type="text"
                  autoFocus
                  value={reasonLabel}
                  maxLength={MAX_REASON_LENGTH}
                  placeholder={t("verlauf.reasonPlaceholder")}
                  onChange={(event) => setReasonLabel(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleApplyReason();
                    } else if (event.key === "Escape") {
                      event.stopPropagation();
                      closeReasonEditor();
                    }
                  }}
                />
              </label>

              <fieldset className="verlauf-reason-scope">
                <legend>{t("verlauf.scopeQuestion")}</legend>
                {REASON_SCOPES.map((scope) => (
                  <label key={scope} className="verlauf-reason-option">
                    <input
                      type="radio"
                      name="reason-scope"
                      value={scope}
                      checked={reasonScope === scope}
                      onChange={() => setReasonScope(scope)}
                    />
                    <span>{t(`verlauf.scope_${scope}`)}</span>
                  </label>
                ))}
              </fieldset>

              <div className="verlauf-reason-actions">
                <button
                  type="button"
                  className="verlauf-reason-cancel"
                  onClick={closeReasonEditor}
                >
                  {t("verlauf.cancel")}
                </button>
                <button
                  type="button"
                  className="verlauf-reason-apply"
                  onClick={handleApplyReason}
                  disabled={!reasonLabel.trim()}
                >
                  {t("verlauf.apply")}
                </button>
              </div>
            </div>
          )}

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
                <li
                  key={entry.id}
                  className={`verlauf-entry ${entry.isNote ? "verlauf-entry--initial" : ""}`}
                >
                  <span className="verlauf-dot" aria-hidden="true" />
                  <div className="verlauf-entry-body">
                    <div className="verlauf-entry-meta">
                      <time dateTime={entry.datum}>
                        {formatShortDate(entry.datum, i18n.language)}
                      </time>
                      <span className="verlauf-entry-type">
                        {entry.isNote && (
                          <PinIcon className="verlauf-pin" aria-hidden="true" />
                        )}
                        {entryTypeLabel(entry, t)}
                      </span>
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
