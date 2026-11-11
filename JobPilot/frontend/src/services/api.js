import { API_URL, DEMO_MODE } from "../utils/constants";
import { getToken, authFetch } from "./auth";
import { notifyBewerbungenChanged } from "../utils/syncBus";

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
    const items = readDemoData();
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
    const updatedItems = items.map((item) =>
      String(item.id) === String(id)
        ? { ...item, ...bewerbung, id: item.id }
        : item,
    );

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
