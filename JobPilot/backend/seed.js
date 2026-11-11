/**
 * Test-Accounts und Beispiel-Bewerbungen für die STAGING-Umgebung.
 *
 * NIEMALS auf Produktion ausführen. Läuft nur, wenn explizit aktiviert:
 *
 *   Automatisch beim Serverstart:   SEED_DEMO_DATA=true   (+ SEED_PASSWORD)
 *   Zurücksetzen beim Serverstart:  SEED_DEMO_DATA=reset  (danach wieder auf true!)
 *   Manuell:                        npm run seed            (DATABASE_URL + SEED_PASSWORD)
 *   Manuell zurücksetzen:           npm run seed -- --reset
 *
 * Verhalten:
 * - Accounts werden nur angelegt, wenn sie fehlen (bereits verifiziert, kein E-Mail-Versand).
 * - Bewerbungen werden nur eingefügt, wenn der Account noch keine hat –
 *   Änderungen beim Testen bleiben also erhalten.
 * - Mit --reset werden Passwort, Rolle und Bewerbungen der Seed-Accounts
 *   auf den Ausgangszustand zurückgesetzt. Andere Accounts bleiben unberührt.
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");

/** Datum relativ zu heute als YYYY-MM-DD (negativ = Vergangenheit). */
function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function app(position, firma, status, daysAgo, extra = {}) {
  return {
    position,
    firma,
    status,
    datum: daysFromNow(-daysAgo),
    standort: "",
    ansprechpartner: "",
    notizen: "",
    bewerbungsart: "Stellenausschreibung",
    startdatum: "",
    link: "",
    gehalt: "",
    waehrung: "EUR",
    ...extra,
  };
}

const SEED_ACCOUNTS = [
  {
    email: "demo@jobpilot.test",
    name: "Demo Nutzer",
    role: "user",
    bewerbungen: [
      app("Frontend Developer", "SAP", "beworben", 5, {
        standort: "Walldorf / Remote",
        ansprechpartner: "Lisa Müller",
        notizen: "Portfolio verschickt, Rückmeldung nächste Woche.",
        link: "https://www.sap.com/germany/about/careers.html",
        gehalt: "55.000 - 60.000",
      }),
      app("UX Designer", "adidas", "stufe_weiter", 12, {
        standort: "Herzogenaurach",
        ansprechpartner: "Mark Weber",
        notizen: "Zweites Gespräch mit Case Study am Donnerstag.",
        bewerbungsart: "Empfehlung",
        startdatum: daysFromNow(60),
        gehalt: "50.000",
      }),
      app("Product Manager Intern", "BMW Group", "in_planung", 1, {
        standort: "München",
        notizen: "Anschreiben fast fertig.",
        bewerbungsart: "Initiativbewerbung",
      }),
      app("Full-Stack Developer", "Zalando", "angenommen", 40, {
        standort: "Berlin",
        ansprechpartner: "Anna Schmidt",
        notizen: "Angebot erhalten 🎉",
        startdatum: daysFromNow(30),
        gehalt: "62.000",
      }),
      app("Software Engineer", "Siemens", "abgelehnt", 30, {
        standort: "Erlangen",
        notizen: "Absage nach technischem Interview.",
      }),
      app("React Developer", "Personio", "keine_antwort", 45, {
        standort: "München / Hybrid",
      }),
      app("Junior Developer", "Celonis", "beworben", 8, {
        standort: "München",
        link: "https://www.celonis.com/careers/",
      }),
      app("Web Developer", "Check24", "stufe_weiter", 15, {
        standort: "München",
        ansprechpartner: "Tom Becker",
        notizen: "Coding Challenge abgegeben.",
        gehalt: "52.000",
      }),
      app("Frontend Engineer", "N26", "abgelehnt", 60, {
        standort: "Berlin",
        waehrung: "EUR",
      }),
      app("Software Developer", "Google", "beworben", 3, {
        standort: "Zürich",
        gehalt: "120.000",
        waehrung: "CHF",
      }),
      app("Frontend Developer", "Spotify", "keine_antwort", 50, {
        standort: "Stockholm / Remote",
        gehalt: "70.000",
        waehrung: "USD",
      }),
      app("Werkstudent Webentwicklung", "Bosch", "in_planung", 0, {
        standort: "Stuttgart",
        bewerbungsart: "Initiativbewerbung",
      }),
    ],
  },
  {
    // Leerer Account → Empty-State / Onboarding testen
    email: "leer@jobpilot.test",
    name: "Leerer Account",
    role: "user",
    bewerbungen: [],
  },
  {
    email: "admin@jobpilot.test",
    name: "Staging Admin",
    role: "admin",
    bewerbungen: [
      app("DevOps Engineer", "Telekom", "beworben", 7, { standort: "Bonn" }),
      app("Cloud Engineer", "IONOS", "stufe_weiter", 14, { standort: "Karlsruhe" }),
    ],
  },
  {
    // Für die automatischen Playwright-Smoke-Tests (legen eigene Daten an und löschen sie)
    email: "e2e@jobpilot.test",
    name: "E2E Test",
    role: "user",
    bewerbungen: [],
  },
];

const COLUMNS = [
  "position", "firma", "status", "datum", "standort", "ansprechpartner", "notizen",
  "bewerbungsart", "startdatum", "link", "gehalt", "waehrung",
];

async function seedDemoData(pool, { reset = false } = {}) {
  const password = process.env.SEED_PASSWORD;
  if (!password || password.length < 8) {
    console.warn("[seed] SEED_PASSWORD fehlt oder ist kürzer als 8 Zeichen – übersprungen.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const account of SEED_ACCOUNTS) {
      const existing = await client.query("SELECT id FROM users WHERE email = $1", [
        account.email,
      ]);

      let userId;
      if (existing.rows.length === 0) {
        const inserted = await client.query(
          `INSERT INTO users (email, password_hash, name, role, email_verified_at)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
           RETURNING id`,
          [account.email, passwordHash, account.name, account.role],
        );
        userId = inserted.rows[0].id;
        console.log(`[seed] Account angelegt: ${account.email}`);
      } else {
        userId = existing.rows[0].id;
        if (reset) {
          await client.query(
            `UPDATE users
             SET password_hash = $2, name = $3, role = $4,
                 email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [userId, passwordHash, account.name, account.role],
          );
          await client.query("DELETE FROM bewerbungen WHERE user_id = $1", [userId]);
          console.log(`[seed] Account zurückgesetzt: ${account.email}`);
        }
      }

      const count = await client.query(
        "SELECT COUNT(*)::int AS n FROM bewerbungen WHERE user_id = $1",
        [userId],
      );
      if (count.rows[0].n > 0) continue;

      for (const bewerbung of account.bewerbungen) {
        const values = COLUMNS.map((column) => bewerbung[column]);
        const placeholders = COLUMNS.map((_, i) => `$${i + 2}`).join(", ");
        await client.query(
          `INSERT INTO bewerbungen (user_id, ${COLUMNS.join(", ")}) VALUES ($1, ${placeholders})`,
          [userId, ...values],
        );
      }
      if (account.bewerbungen.length > 0) {
        console.log(
          `[seed] ${account.bewerbungen.length} Bewerbungen für ${account.email} angelegt`,
        );
      }
    }

    await client.query("COMMIT");
    console.log("[seed] Fertig.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { seedDemoData, SEED_ACCOUNTS };

// Direkter Aufruf: npm run seed [-- --reset]
if (require.main === module) {
  const pool = require("./database");
  pool
    .initDB()
    .then(() => seedDemoData(pool, { reset: process.argv.includes("--reset") }))
    .catch((error) => {
      console.error("[seed] Fehler:", error);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
