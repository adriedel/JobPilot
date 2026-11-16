import { API_URL, DEMO_MODE } from "../utils/constants";
import { getToken, authFetch } from "./auth";
import { notifyBewerbungenChanged } from "../utils/syncBus";
import { todayIso } from "../utils/verlauf";

const DEMO_STORAGE_KEY = "jobpilot-demo-bewerbungen";
export const DEMO_SEED_DATA = [
  {
    id: 1,
    position: "Frontend Developer",
    firma: "SAP",
    status: "beworben",
    datum: "2026-03-15",
    standort: "Walldorf / Remote",
    ansprechpartner: "Lisa Müller",
    notizen: "Portfolio bereits verschickt, Rückmeldung nächste Woche.",
    bewerbungsart: "Stellenausschreibung",
    startdatum: "",
    link: "https://www.sap.com/germany/about/careers.html",
    gehalt: "55.000 - 60.000",
    waehrung: "EUR",
  },
  {
    id: 2,
    position: "UX Designer",
    firma: "adidas",
    status: "stufe_weiter",
    datum: "2026-03-08",
    standort: "Herzogenaurach",
    ansprechpartner: "Mark Weber",
    notizen: "Case Study im zweiten Gespräch sehr gut gelaufen.",
    bewerbungsart: "Empfehlung",
    startdatum: "2026-06-01",
    link: "https://careers.adidas-group.com/",
    gehalt: "50.000",
    waehrung: "EUR",
  },
  {
    id: 3,
    position: "Product Manager Intern",
    firma: "BMW Group",
    status: "in_planung",
    datum: "2026-04-02",
    standort: "München",
    ansprechpartner: "",
    notizen: "Stellenanzeige gespeichert, Anschreiben fast fertig.",
    bewerbungsart: "Initiativbewerbung",
    startdatum: "",
    link: "https://www.bmwgroup.jobs/de.html",
    gehalt: "",
    waehrung: "EUR",
  },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readDemoData() {
  const stored = localStorage.getItem(DEMO_STORAGE_KEY);

  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem(DEMO_STORAGE_KEY);
    }
  }

  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(DEMO_SEED_DATA));
  return clone(DEMO_SEED_DATA);
}

function writeDemoData(items) {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(items));
  return clone(items);
}

// ── Demo-Verlauf: { [bewerbungId]: Eintrag[] } im localStorage ──
const DEMO_VERLAUF_KEY = "jobpilot-demo-verlauf";

// Eindeutige, aufsteigende IDs – Date.now() allein kollidiert bei schnellen
// Aktionen hintereinander (bzw. in Tests mit eingefrorener Uhr).
let demoIdCounter = 0;
function nextDemoId() {
  demoIdCounter = (demoIdCounter + 1) % 1000;
  return Date.now() * 1000 + demoIdCounter;
}

function readDemoVerlauf() {
  try {
    return JSON.parse(localStorage.getItem(DEMO_VERLAUF_KEY)) || {};
  } catch {
    return {};
  }
}

function writeDemoVerlauf(verlauf) {
  localStorage.setItem(DEMO_VERLAUF_KEY, JSON.stringify(verlauf));
}

/** Neueste zuerst – gleiche Reihenfolge wie das Backend. */
function sortVerlauf(entries) {
  return [...entries].sort(
    (a, b) =>
      b.datum.localeCompare(a.datum) ||
      (b.created_at || "").localeCompare(a.created_at || "") ||
      b.id - a.id,
  );
}

function addDemoVerlaufEntry(bewerbungId, entry) {
  const verlauf = readDemoVerlauf();
  const newEntry = {
    id: nextDemoId(),
    text: null,
    status_von: null,
    status_nach: null,
    datum: todayIso(),
    created_at: new Date().toISOString(),
    ...entry,
  };
  verlauf[bewerbungId] = [...(verlauf[bewerbungId] || []), newEntry];
  writeDemoVerlauf(verlauf);
  return newEntry;
}

function withDemoVerlaufSummary(items) {
  const verlauf = readDemoVerlauf();
  return items.map((item) => {
    const entries = sortVerlauf(verlauf[item.id] || []);
    return {
      ...item,
      verlauf_anzahl: entries.length,
      letzter_eintrag: entries[0] || null,
    };
  });
}

export function buildDemoStats(items) {
  return items.reduce(
    (accumulator, item) => {
      accumulator[item.status] = (accumulator[item.status] || 0) + 1;
      accumulator.gesamt += 1;
      return accumulator;
    },
    {
      in_planung: 0,
      beworben: 0,
      stufe_weiter: 0,
      angenommen: 0,
      abgelehnt: 0,
      keine_antwort: 0,
      gesamt: 0,
    },
  );
}

// Helper: Headers mit Authorization
function getHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// GET alle Bewerbungen
export async function getAll(status = null) {
  if (DEMO_MODE) {
    const items = withDemoVerlaufSummary(readDemoData());
    return status ? items.filter((item) => item.status === status) : items;
  }

  const url = status
    ? `${API_URL}/bewerbungen?status=${status}`
    : `${API_URL}/bewerbungen`;

  const response = await authFetch(url, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Fehler beim Laden");
  }

  return response.json();
}

// GET einzelne Bewerbung
export async function getById(id) {
  if (DEMO_MODE) {
    const item = readDemoData().find(
      (bewerbung) => String(bewerbung.id) === String(id),
    );

    if (!item) {
      throw new Error("Bewerbung nicht gefunden");
    }

    return item;
  }

  const response = await authFetch(`${API_URL}/bewerbungen/${id}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Bewerbung nicht gefunden");
  }

  return response.json();
}

// POST neue Bewerbung
export async function create(bewerbung) {
  if (DEMO_MODE) {
    const items = readDemoData();
    const newItem = {
      ...bewerbung,
      id: Date.now(),
      notizen_updated_at: bewerbung.notizen?.trim()
        ? new Date().toISOString()
        : null,
    };

    writeDemoData([newItem, ...items]);
    notifyBewerbungenChanged();
    return { id: newItem.id, message: "Demo-Bewerbung erstellt" };
  }

  const response = await authFetch(`${API_URL}/bewerbungen`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(bewerbung),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Fehler beim Erstellen");
  }

  const result = await response.json();
  notifyBewerbungenChanged();
  return result;
}

// PUT Bewerbung aktualisieren
export async function update(id, bewerbung) {
  if (DEMO_MODE) {
    const items = readDemoData();
    const updatedItems = items.map((item) => {
      if (String(item.id) !== String(id)) return item;

      // Gleiche Regeln wie im Backend: Status-Wechsel loggen,
      // Notiz-Datum nur bei geändertem Text aktualisieren.
      if (bewerbung.status && bewerbung.status !== item.status) {
        addDemoVerlaufEntry(item.id, {
          typ: "status",
          status_von: item.status,
          status_nach: bewerbung.status,
        });
      }

      const newNote = bewerbung.notizen ?? "";
      let notizenUpdatedAt = item.notizen_updated_at ?? null;
      if (!newNote.trim()) notizenUpdatedAt = null;
      else if (newNote !== (item.notizen ?? "")) {
        notizenUpdatedAt = new Date().toISOString();
      }

      // Abgeleitete Listenfelder nicht mitspeichern
      // eslint-disable-next-line no-unused-vars
      const { verlauf_anzahl, letzter_eintrag, ...fields } = bewerbung;
      return {
        ...item,
        ...fields,
        id: item.id,
        notizen_updated_at: notizenUpdatedAt,
      };
    });

    writeDemoData(updatedItems);
    notifyBewerbungenChanged();
    return { message: "Demo-Bewerbung aktualisiert" };
  }

  const response = await authFetch(`${API_URL}/bewerbungen/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(bewerbung),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Fehler beim Aktualisieren");
  }

  const result = await response.json();
  notifyBewerbungenChanged();
  return result;
}

// DELETE Bewerbung
export async function deleteBewerbung(id) {
  if (DEMO_MODE) {
    const items = readDemoData();
    const filteredItems = items.filter(
      (item) => String(item.id) !== String(id),
    );

    writeDemoData(filteredItems);
    notifyBewerbungenChanged();
    return { message: "Demo-Bewerbung gelöscht" };
  }

  const response = await authFetch(`${API_URL}/bewerbungen/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Fehler beim Löschen");
  }

  const result = await response.json();
  notifyBewerbungenChanged();
  return result;
}

// ==================== VERLAUF ====================

// GET Verlauf einer Bewerbung (neueste zuerst)
export async function getUpdates(bewerbungId) {
  if (DEMO_MODE) {
    return sortVerlauf(readDemoVerlauf()[bewerbungId] || []);
  }

  const response = await authFetch(
    `${API_URL}/bewerbungen/${bewerbungId}/updates`,
    { headers: getHeaders() },
  );

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Fehler beim Laden des Verlaufs");
  }

  return response.json();
}

// POST Verlaufseintrag ({ typ: "notiz" | "gespraech" | "mail", text, datum })
export async function addUpdate(bewerbungId, entry) {
  if (DEMO_MODE) {
    const created = addDemoVerlaufEntry(bewerbungId, {
      typ: entry.typ,
      typ_label: entry.typ === "custom" ? entry.typ_label.trim() : null,
      text: entry.text.trim(),
      datum: entry.datum || todayIso(),
    });
    notifyBewerbungenChanged();
    return created;
  }

  const response = await authFetch(
    `${API_URL}/bewerbungen/${bewerbungId}/updates`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(entry),
    },
  );

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Fehler beim Speichern");
  }

  const result = await response.json();
  notifyBewerbungenChanged();
  return result;
}

// DELETE Verlaufseintrag
export async function deleteUpdate(bewerbungId, updateId) {
  if (DEMO_MODE) {
    const verlauf = readDemoVerlauf();
    verlauf[bewerbungId] = (verlauf[bewerbungId] || []).filter(
      (entry) => String(entry.id) !== String(updateId),
    );
    writeDemoVerlauf(verlauf);
    notifyBewerbungenChanged();
    return { message: "Demo-Eintrag gelöscht" };
  }

  const response = await authFetch(
    `${API_URL}/bewerbungen/${bewerbungId}/updates/${updateId}`,
    { method: "DELETE", headers: getHeaders() },
  );

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Fehler beim Löschen");
  }

  const result = await response.json();
  notifyBewerbungenChanged();
  return result;
}

// ==================== EIGENE UPDATE-GRÜNDE ====================
// bewerbung_id null = für alle Bewerbungen, sonst nur für diese eine

const DEMO_UPDATE_TYPEN_KEY = "jobpilot-demo-update-typen";

function readDemoUpdateTypen() {
  try {
    return JSON.parse(localStorage.getItem(DEMO_UPDATE_TYPEN_KEY)) || [];
  } catch {
    return [];
  }
}

// GET gespeicherte Gründe (global + nur für diese Bewerbung)
export async function getUpdateTypes(bewerbungId) {
  if (DEMO_MODE) {
    return readDemoUpdateTypen().filter(
      (typ) =>
        typ.bewerbung_id === null ||
        String(typ.bewerbung_id) === String(bewerbungId),
    );
  }

  const response = await authFetch(
    `${API_URL}/bewerbungen/${bewerbungId}/update-typen`,
    { headers: getHeaders() },
  );

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Fehler beim Laden der Gründe");
  }

  return response.json();
}

// POST Grund speichern ({ label, bewerbung_id })
export async function saveUpdateType({ label, bewerbung_id = null }) {
  if (DEMO_MODE) {
    const typen = readDemoUpdateTypen();
    const existing = typen.find(
      (typ) =>
        String(typ.bewerbung_id) === String(bewerbung_id) &&
        typ.label.toLowerCase() === label.trim().toLowerCase(),
    );
    if (existing) return existing;

    const created = { id: nextDemoId(), label: label.trim(), bewerbung_id };
    localStorage.setItem(
      DEMO_UPDATE_TYPEN_KEY,
      JSON.stringify([...typen, created]),
    );
    return created;
  }

  const response = await authFetch(`${API_URL}/update-typen`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ label, bewerbung_id }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Fehler beim Speichern des Grunds");
  }

  return response.json();
}

// DELETE gespeicherten Grund (Verlaufseinträge behalten ihren Grund)
export async function deleteUpdateType(typId) {
  if (DEMO_MODE) {
    localStorage.setItem(
      DEMO_UPDATE_TYPEN_KEY,
      JSON.stringify(
        readDemoUpdateTypen().filter((typ) => String(typ.id) !== String(typId)),
      ),
    );
    return { message: "Demo-Grund gelöscht" };
  }

  const response = await authFetch(`${API_URL}/update-typen/${typId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Fehler beim Löschen des Grunds");
  }

  return response.json();
}

// GET Statistiken
export async function getStats() {
  if (DEMO_MODE) {
    return buildDemoStats(readDemoData());
  }

  const response = await authFetch(`${API_URL}/statistiken`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Fehler beim Laden der Statistiken");
  }

  return response.json();
}
