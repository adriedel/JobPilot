export const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://jobpilot-backend-d6yj.onrender.com/api";

export const API_BASE_URL = API_URL.replace(/\/api$/, "");

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

export const STATUS = {
  IN_PLANUNG: "in_planung",
  BEWORBEN: "beworben",
  STUFE_WEITER: "stufe_weiter",
  ANGENOMMEN: "angenommen",
  ABGELEHNT: "abgelehnt",
  KEINE_ANTWORT: "keine_antwort",
  UNKLAR: "unklar",
  GESAMT: "gesamt",
};

export const STATUS_LABELS = {
  [STATUS.IN_PLANUNG]: "In Planung",
  [STATUS.BEWORBEN]: "Beworben",
  [STATUS.STUFE_WEITER]: "Stufe weiter",
  [STATUS.ANGENOMMEN]: "Angenommen",
  [STATUS.ABGELEHNT]: "Abgelehnt",
  [STATUS.KEINE_ANTWORT]: "Keine Antwort",
  [STATUS.UNKLAR]: "Unklar",
  [STATUS.GESAMT]: "Gesamt",
};

// Reihenfolge des Bewerbungs-"Trichters" — von der ersten bis zur letzten Phase.
export const STATUS_ORDER = [
  STATUS.IN_PLANUNG,
  STATUS.BEWORBEN,
  STATUS.STUFE_WEITER,
  STATUS.ANGENOMMEN,
  STATUS.ABGELEHNT,
  STATUS.KEINE_ANTWORT,
  STATUS.UNKLAR,
];

export const STATUS_ICONS = {
  [STATUS.IN_PLANUNG]: "/plan.svg",
  [STATUS.BEWORBEN]: "/paperplane-applied.svg",
  [STATUS.STUFE_WEITER]: "/arrow-step-further.svg",
  [STATUS.ANGENOMMEN]: "/check-circle-accepted.svg",
  [STATUS.ABGELEHNT]: "/cross-circle-denied.svg",
  [STATUS.KEINE_ANTWORT]: "/clock-no-answer.svg",
  [STATUS.UNKLAR]: "/questionmark.svg",
  [STATUS.GESAMT]: "/trending.svg",
};

export const BEWERBUNGSARTEN = [
  "Initiativbewerbung",
  "Stellenausschreibung",
  "Empfehlung",
];

export const WAEHRUNGEN = ["EUR", "USD", "CHF"];

export const WAEHRUNG_LABELS = {
  EUR: "Euro (EUR)",
  USD: "US-Dollar (USD)",
  CHF: "Schweizer Franken (CHF)",
};
