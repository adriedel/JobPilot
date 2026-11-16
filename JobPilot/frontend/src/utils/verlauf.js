// Hilfsfunktionen für den Bewerbungs-Verlauf (Karte + Seitenpanel)

export const MANUAL_UPDATE_TYPES = ["notiz", "gespraech", "mail"];

function localeFor(language) {
  return language === "de" ? "de-DE" : "en-GB";
}

/** Heutiges Datum als YYYY-MM-DD in lokaler Zeit (nicht UTC). */
export function todayIso() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Formatiert ein Datum als 16.11.2026 (DE) bzw. 16/11/2026 (EN).
 * Reine YYYY-MM-DD-Werte werden als lokales Datum gelesen, damit es
 * keine Verschiebung um einen Tag durch die Zeitzone gibt.
 */
export function formatShortDate(value, language) {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(localeFor(language), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Zeitstempel → YYYY-MM-DD in lokaler Zeit (für Sortierung mit Verlaufsdaten). */
export function toIsoDay(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Datum der Notiz als YYYY-MM-DD: letzte Änderung, sonst Anlegedatum,
 * sonst Bewerbungsdatum (ältere Notizen / Demo-Daten haben keinen Zeitstempel).
 */
export function noteDay(bewerbung) {
  return (
    toIsoDay(bewerbung.notizen_updated_at) ||
    toIsoDay(bewerbung.created_at) ||
    bewerbung.datum ||
    ""
  );
}

/**
 * Timeline fürs Panel: Verlaufseinträge plus die Notiz der Bewerbung
 * (mit Datum der letzten Änderung), neueste zuerst. Bei gleichem Datum
 * steht die Notiz unten, weil sie meist der Ausgangspunkt war.
 */
export function buildTimeline(entries, bewerbung) {
  const note = bewerbung.notizen?.trim();
  const all = note
    ? [
        ...entries,
        {
          id: "notiz-feld",
          typ: "notiz",
          text: bewerbung.notizen,
          datum: noteDay(bewerbung),
          isNote: true,
        },
      ]
    : entries;

  return [...all].sort(
    (a, b) =>
      b.datum.localeCompare(a.datum) ||
      Number(!!a.isNote) - Number(!!b.isNote) ||
      Number(b.id) - Number(a.id),
  );
}

export const MAX_REASON_LENGTH = 40;

/** Typ-Bezeichnung eines Eintrags ("Gespräch", "Status" oder eigener Grund). */
export function entryTypeLabel(entry, t) {
  if (entry.typ === "custom") return entry.typ_label;
  return t(`verlauf.types.${entry.typ}`);
}

/** Anzeigetext eines Eintrags (Status-Einträge haben keinen eigenen Text). */
export function describeEntry(entry, t) {
  if (entry.typ === "status") {
    return t("verlauf.statusChanged", {
      from: t(`status.${entry.status_von}`),
      to: t(`status.${entry.status_nach}`),
    });
  }
  return entry.text;
}
