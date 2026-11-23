require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://jobpilot:jobpilot@localhost:5432/jobpilot",
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bewerbungen (
      id SERIAL PRIMARY KEY,
      position TEXT NOT NULL,
      firma TEXT NOT NULL,
      status TEXT NOT NULL,
      datum TEXT NOT NULL,
      standort TEXT,
      ansprechpartner TEXT,
      notizen TEXT,
      bewerbungsart TEXT,
      startdatum TEXT,
      link TEXT,
      gehalt TEXT,
      waehrung TEXT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Für bestehende Datenbanken: Spalten nachrüsten falls sie noch nicht existieren
  await pool.query(
    `ALTER TABLE bewerbungen ADD COLUMN IF NOT EXISTS gehalt TEXT`,
  );
  await pool.query(
    `ALTER TABLE bewerbungen ADD COLUMN IF NOT EXISTS waehrung TEXT`,
  );
  await pool.query(
    `ALTER TABLE bewerbungen ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`,
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_bewerbungen_user_id ON bewerbungen(user_id)`,
  );

  // Zeitpunkt, an dem die Notiz zuletzt geschrieben/geändert wurde
  await pool.query(
    `ALTER TABLE bewerbungen ADD COLUMN IF NOT EXISTS notizen_updated_at TIMESTAMP`,
  );
  // Bestehende Notizen: beste Näherung ist der letzte Änderungszeitpunkt der Bewerbung
  await pool.query(
    `UPDATE bewerbungen
     SET notizen_updated_at = COALESCE(updated_at, created_at)
     WHERE notizen_updated_at IS NULL AND COALESCE(TRIM(notizen), '') <> ''`,
  );

  // Verlauf: Notizen, Gespräche, Mails und automatische Status-Änderungen
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bewerbung_updates (
      id SERIAL PRIMARY KEY,
      bewerbung_id INTEGER NOT NULL REFERENCES bewerbungen(id) ON DELETE CASCADE,
      typ TEXT NOT NULL,
      text TEXT,
      status_von TEXT,
      status_nach TEXT,
      datum DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_bewerbung_updates_bewerbung_id ON bewerbung_updates(bewerbung_id)`,
  );
  // Eigener Update-Grund (typ = 'custom'), z.B. "Absage per Telefon"
  await pool.query(
    `ALTER TABLE bewerbung_updates ADD COLUMN IF NOT EXISTS typ_label TEXT`,
  );

  // Gespeicherte eigene Update-Gründe:
  // bewerbung_id NULL = für alle Bewerbungen, sonst nur für diese eine
  await pool.query(`
    CREATE TABLE IF NOT EXISTS update_typen (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      bewerbung_id INTEGER REFERENCES bewerbungen(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_update_typen_unique
     ON update_typen (user_id, (COALESCE(bewerbung_id, 0)), (lower(label)))`,
  );
  await pool.query(
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT`,
  );
  await pool.query(
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_config TEXT`,
  );
  await pool.query(
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'`,
  );

  // Wird bei Passwort-Reset/-Wechsel erhöht und macht damit alle alten Tokens ungültig
  await pool.query(
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0`,
  );

  // E-Mail-Verifizierung
  await pool.query(
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP`,
  );
  await pool.query(
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token TEXT`,
  );
  await pool.query(
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token_expires TIMESTAMP`,
  );

  // Bestehende User (vor der E-Mail-Verifizierung angelegt) automatisch als verifiziert markieren
  await pool.query(
    `UPDATE users SET email_verified_at = created_at WHERE email_verified_at IS NULL AND email_verification_token IS NULL`,
  );

  // Passwort-Reset-Tokens
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_prt_user_id ON password_reset_tokens(user_id)`,
  );

  console.log("Datenbank initialisiert");
}

module.exports = pool;
module.exports.initDB = initDB;
