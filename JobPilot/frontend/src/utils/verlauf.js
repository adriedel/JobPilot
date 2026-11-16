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
