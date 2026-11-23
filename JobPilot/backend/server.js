require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const pool = require("./database");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./swagger.yaml");
const authenticateToken = require("./authMiddleware");
const {
  loginLimiter,
  registerLimiter,
  emailLimiter,
  tokenLimiter,
} = require("./rateLimits");
const {
  register,
  login,
  getCurrentUser,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} = require("./authController");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = (buffer, publicId) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        folder: "avatars",
        overwrite: true,
        resource_type: "image",
        transformation: [{ width: 300, height: 300, crop: "fill", gravity: "face" }],
      },
      (error, result) => (error ? reject(error) : resolve(result)),
    );
    stream.end(buffer);
  });

const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Nur JPEG, PNG, GIF und WebP erlaubt"));
  },
});

/** Fehler nur loggen – DB-Details o. Ä. gehen nicht an den Client. */
function serverError(res, err) {
  console.error(err);
  res.status(500).json({ error: "Interner Serverfehler" });
}

function parseUserRow(row) {
  if (!row) return row;
  if (row.avatar_config && typeof row.avatar_config === "string") {
    try { row.avatar_config = JSON.parse(row.avatar_config); } catch { row.avatar_config = null; }
  }
  return row;
}

const app = express();
const PORT = process.env.PORT || 3001;

// Hinter dem Proxy von Render/Vercel: echte Client-IP aus X-Forwarded-For
// lesen (Anzahl vertrauenswürdiger Proxys), sonst teilen sich alle ein Rate-Limit.
app.set("trust proxy", Number(process.env.TRUST_PROXY ?? 1));

// CORS Configuration - Allow multiple origins
const configuredOrigins = [
  "https://jobpilot-jade.vercel.app", // Production (Vercel)
  "https://www.bewerbungstracker.com", // Custom Domain
  "https://bewerbungstracker.com", // Custom Domain (ohne www)
  ...(process.env.FRONTEND_URLS
    ? process.env.FRONTEND_URLS.split(",").map((origin) => origin.trim())
    : []),
];
const allowedOrigins = new Set(configuredOrigins.filter(Boolean));

// Optional (nur Staging): Regex für wechselnde Origins, z.B. Vercel-Preview-URLs
//   FRONTEND_ORIGIN_REGEX=^https://jobpilot-[a-z0-9-]+-adriedel\.vercel\.app$
// Auf Produktion NICHT setzen.
let allowedOriginPattern = null;
if (process.env.FRONTEND_ORIGIN_REGEX) {
  try {
    allowedOriginPattern = new RegExp(process.env.FRONTEND_ORIGIN_REGEX);
  } catch (error) {
    console.error("Ungültige FRONTEND_ORIGIN_REGEX:", error.message);
  }
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, curl)
      if (!origin) return callback(null, true);

      // Beliebige localhost-Ports nur in der Entwicklung; in Produktion (auch im
      // lokalen Docker-Setup) müssen Origins explizit in FRONTEND_URLS stehen.
      const isLocalhostOrigin =
        process.env.NODE_ENV !== "production" &&
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

      if (
        isLocalhostOrigin ||
        allowedOrigins.has(origin) ||
        allowedOriginPattern?.test(origin)
      ) {
        return callback(null, true);
      }

      const msg = `CORS not allowed for origin: ${origin}`;
      console.error(msg);
      return callback(new Error(msg), false);
    },
    // PATCH wird für das Ändern von Rollen im Admin-Bereich gebraucht.
    // Keine Cookies im Einsatz (Token im Authorization-Header) → kein credentials.
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "JobPilot Backend läuft",
    api: "/api",
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api", (req, res) => {
  res.json({
    status: "ok",
    message: "JobPilot API erreichbar",
    endpoints: [
      "/api/bewerbungen",
      "/api/statistiken",
      "/api/auth/login",
      "/api/auth/register",
    ],
  });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));


// ==================== AUTH ROUTES (UNPROTECTED) ====================

// Register
app.post("/api/auth/register", registerLimiter, register);

// Login
app.post("/api/auth/login", loginLimiter, login);

// E-Mail-Verifizierung
app.get("/api/auth/verify-email", tokenLimiter, verifyEmail);
app.post("/api/auth/resend-verification", emailLimiter, resendVerification);

// Passwort vergessen / zurücksetzen
app.post("/api/auth/forgot-password", emailLimiter, forgotPassword);
app.post("/api/auth/reset-password", tokenLimiter, resetPassword);

// Get current user (PROTECTED)
app.get("/api/auth/me", authenticateToken, getCurrentUser);

// Update profile name (PROTECTED)
app.put("/api/auth/profile", authenticateToken, async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name ist erforderlich" });
  }
  try {
    const result = await pool.query(
      "UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, name, profile_image_url, avatar_config, created_at",
      [name.trim(), req.userId],
    );
    res.json({ user: parseUserRow(result.rows[0]) });
  } catch (err) {
    serverError(res, err);
  }
});

// Upload profile image (PROTECTED)
app.post(
  "/api/auth/profile/image",
  authenticateToken,
  uploadAvatar.single("image"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Kein Bild hochgeladen" });
    }
    try {
      const cloudResult = await uploadToCloudinary(
        req.file.buffer,
        `user_${req.userId}`,
      );
      const result = await pool.query(
        "UPDATE users SET profile_image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, name, profile_image_url, avatar_config, created_at",
        [cloudResult.secure_url, req.userId],
      );
      res.json({ user: parseUserRow(result.rows[0]) });
    } catch (err) {
      serverError(res, err);
    }
  },
);

// Delete profile image (PROTECTED)
app.delete("/api/auth/profile/image", authenticateToken, async (req, res) => {
  try {
    await cloudinary.uploader.destroy(`avatars/user_${req.userId}`);
    await pool.query(
      "UPDATE users SET profile_image_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [req.userId],
    );
    res.json({ message: "Profilbild gelöscht" });
  } catch (err) {
    serverError(res, err);
  }
});

// Change email (PROTECTED)
app.put("/api/auth/profile/email", authenticateToken, tokenLimiter, async (req, res) => {
  const { email, currentPassword } = req.body;
  if (typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ error: "E-Mail ist erforderlich" });
  }
  // Ohne Passwort-Abfrage könnte ein gestohlenes Token die E-Mail umstellen und
  // über "Passwort vergessen" den Account dauerhaft übernehmen.
  if (typeof currentPassword !== "string" || !currentPassword) {
    return res.status(400).json({ error: "Aktuelles Passwort ist erforderlich" });
  }
  const newEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return res.status(400).json({ error: "Ungültige E-Mail-Adresse" });
  }
  try {
    const current = await pool.query("SELECT password_hash FROM users WHERE id = $1", [
      req.userId,
    ]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: "User nicht gefunden" });
    }
    if (!(await bcrypt.compare(currentPassword, current.rows[0].password_hash))) {
      return res.status(401).json({ error: "Das aktuelle Passwort ist falsch" });
    }
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND id != $2",
      [newEmail, req.userId],
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Diese E-Mail-Adresse ist bereits vergeben" });
    }
    const result = await pool.query(
      "UPDATE users SET email = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, name, profile_image_url, avatar_config, created_at",
      [newEmail, req.userId],
    );
    res.json({ user: parseUserRow(result.rows[0]) });
  } catch (err) {
    serverError(res, err);
  }
});

// Change password (PROTECTED)
app.put("/api/auth/profile/password", authenticateToken, tokenLimiter, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Aktuelles und neues Passwort sind erforderlich" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "Das neue Passwort muss mindestens 8 Zeichen lang sein" });
  }
  try {
    const result = await pool.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [req.userId],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User nicht gefunden" });
    }
    const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ error: "Das aktuelle Passwort ist falsch" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [hashed, req.userId],
    );
    res.json({ message: "Passwort erfolgreich geändert" });
  } catch (err) {
    serverError(res, err);
  }
});

// Update avatar config (PROTECTED)
app.put("/api/auth/profile/avatar-config", authenticateToken, async (req, res) => {
  const { avatar_config } = req.body;
  try {
    const configStr = avatar_config ? JSON.stringify(avatar_config) : null;
    const result = await pool.query(
      "UPDATE users SET avatar_config = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, name, profile_image_url, avatar_config, created_at",
      [configStr, req.userId],
    );
    res.json({ user: parseUserRow(result.rows[0]) });
  } catch (err) {
    serverError(res, err);
  }
});

// ==================== BEWERBUNGEN ROUTES (PROTECTED) ====================

// Verlauf: manuell anlegbare Typen ("status" wird nur automatisch erzeugt)
const MANUAL_UPDATE_TYPES = ["notiz", "gespraech", "mail", "custom"];
const MAX_TYP_LABEL_LENGTH = 40;
const UPDATE_SELECT_FIELDS = `u.id, u.typ, u.typ_label, u.text, u.status_von, u.status_nach,
  to_char(u.datum, 'YYYY-MM-DD') AS datum, u.created_at`;
const UPDATE_JSON_FIELDS = `'id', u.id, 'typ', u.typ, 'typ_label', u.typ_label, 'text', u.text,
  'status_von', u.status_von, 'status_nach', u.status_nach,
  'datum', to_char(u.datum, 'YYYY-MM-DD')`;
const UPDATE_ORDER = "u.datum DESC, u.created_at DESC, u.id DESC";

/** Gibt das getrimmte Label zurück oder null, wenn es ungültig ist. */
function normalizeTypLabel(value) {
  if (typeof value !== "string") return null;
  const label = value.trim().replace(/\s+/g, " ");
  return label && label.length <= MAX_TYP_LABEL_LENGTH ? label : null;
}

function isIsoDate(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime())
  );
}

async function findOwnBewerbung(client, id, userId, { lock = false } = {}) {
  const result = await client.query(
    `SELECT id, status, notizen FROM bewerbungen WHERE id = $1 AND user_id = $2${lock ? " FOR UPDATE" : ""}`,
    [id, userId],
  );
  return result.rows[0] || null;
}

// GET alle Bewerbungen (NUR für eingeloggten User!)
app.get("/api/bewerbungen", authenticateToken, async (req, res) => {
  const { status } = req.query;
  const userId = req.userId; // Aus JWT Token

  // Pro Bewerbung: Anzahl der Verlaufseinträge + der neueste Eintrag (für die Karte)
  let query = `
    SELECT b.*,
           COALESCE(v.anzahl, 0)::int AS verlauf_anzahl,
           l.eintrag AS letzter_eintrag
    FROM bewerbungen b
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS anzahl FROM bewerbung_updates u WHERE u.bewerbung_id = b.id
    ) v ON true
    LEFT JOIN LATERAL (
      SELECT json_build_object(${UPDATE_JSON_FIELDS}) AS eintrag
      FROM bewerbung_updates u
      WHERE u.bewerbung_id = b.id
      ORDER BY ${UPDATE_ORDER}
      LIMIT 1
    ) l ON true
    WHERE b.user_id = $1`;
  let params = [userId];

  if (status) {
    query += " AND b.status = $2";
    params.push(status);
  }

  query += " ORDER BY b.created_at DESC";

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    serverError(res, err);
  }
});

// GET einzelne Bewerbung (NUR für eingeloggten User!)
app.get("/api/bewerbungen/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const result = await pool.query(
      "SELECT * FROM bewerbungen WHERE id = $1 AND user_id = $2",
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Bewerbung nicht gefunden" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    serverError(res, err);
  }
});

// POST neue Bewerbung erstellen (NUR für eingeloggten User!)
app.post("/api/bewerbungen", authenticateToken, async (req, res) => {
  const {
    position,
    firma,
    status,
    datum,
    standort,
    ansprechpartner,
    notizen,
    bewerbungsart,
    startdatum,
    link,
    gehalt,
    waehrung,
  } = req.body;

  const userId = req.userId; // Aus JWT Token

  if (!position || !firma || !status || !datum) {
    return res
      .status(400)
      .json({ error: "Position, Firma, Status und Datum sind erforderlich" });
  }

  // Das Anlegen selbst wird bewusst NICHT im Verlauf geloggt –
  // Datum und Status sind auf der Karte ohnehin sichtbar.
  const query = `
    INSERT INTO bewerbungen
    (position, firma, status, datum, standort, ansprechpartner, notizen, bewerbungsart, startdatum, link, gehalt, waehrung, user_id, notizen_updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
            CASE WHEN COALESCE(TRIM($7), '') <> '' THEN CURRENT_TIMESTAMP END)
    RETURNING id
  `;

  try {
    const result = await pool.query(query, [
      position,
      firma,
      status,
      datum,
      standort,
      ansprechpartner,
      notizen,
      bewerbungsart,
      startdatum,
      link,
      gehalt,
      waehrung,
      userId,
    ]);

    res.status(201).json({
      id: result.rows[0].id,
      message: "Bewerbung erstellt",
    });
  } catch (err) {
    serverError(res, err);
  }
});

// PUT Bewerbung aktualisieren (NUR für eingeloggten User!)
app.put("/api/bewerbungen/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const {
    position,
    firma,
    status,
    datum,
    standort,
    ansprechpartner,
    notizen,
    bewerbungsart,
    startdatum,
    link,
    gehalt,
    waehrung,
  } = req.body;

  // notizen_updated_at nur anfassen, wenn sich der Notiztext wirklich ändert
  const query = `
    UPDATE bewerbungen
    SET position = $1, firma = $2, status = $3, datum = $4,
        standort = $5, ansprechpartner = $6, notizen = $7,
        bewerbungsart = $8, startdatum = $9, link = $10,
        gehalt = $11, waehrung = $12, updated_at = CURRENT_TIMESTAMP,
        notizen_updated_at = CASE
          WHEN COALESCE(TRIM($7), '') = '' THEN NULL
          WHEN COALESCE(notizen, '') IS DISTINCT FROM $7 THEN CURRENT_TIMESTAMP
          ELSE notizen_updated_at
        END
    WHERE id = $13 AND user_id = $14
  `;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await findOwnBewerbung(client, id, userId, { lock: true });
    if (!existing) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Bewerbung nicht gefunden" });
    }

    const result = await client.query(query, [
      position,
      firma,
      status,
      datum,
      standort,
      ansprechpartner,
      notizen,
      bewerbungsart,
      startdatum,
      link,
      gehalt,
      waehrung,
      id,
      userId,
    ]);

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Bewerbung nicht gefunden" });
    }

    // Status-Wechsel automatisch im Verlauf festhalten
    if (status && existing.status !== status) {
      await client.query(
        `INSERT INTO bewerbung_updates (bewerbung_id, typ, status_von, status_nach)
         VALUES ($1, 'status', $2, $3)`,
        [id, existing.status, status],
      );
    }

    await client.query("COMMIT");
    res.json({ message: "Bewerbung aktualisiert" });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    serverError(res, err);
  } finally {
    client.release();
  }
});

// GET Verlauf einer Bewerbung (neueste zuerst)
app.get("/api/bewerbungen/:id/updates", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    if (!(await findOwnBewerbung(pool, id, req.userId))) {
      return res.status(404).json({ error: "Bewerbung nicht gefunden" });
    }

    const result = await pool.query(
      `SELECT ${UPDATE_SELECT_FIELDS}
       FROM bewerbung_updates u
       WHERE u.bewerbung_id = $1
       ORDER BY ${UPDATE_ORDER}`,
      [id],
    );
    res.json(result.rows);
  } catch (err) {
    serverError(res, err);
  }
});

// POST neuen Verlaufseintrag (Notiz, Gespräch, Mail)
app.post("/api/bewerbungen/:id/updates", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { typ, datum } = req.body;
  const text = typeof req.body.text === "string" ? req.body.text.trim() : "";

  if (!MANUAL_UPDATE_TYPES.includes(typ)) {
    return res
      .status(400)
      .json({ error: `Typ muss einer von ${MANUAL_UPDATE_TYPES.join(", ")} sein` });
  }
  if (!text) {
    return res.status(400).json({ error: "Text ist erforderlich" });
  }
  const typLabel = typ === "custom" ? normalizeTypLabel(req.body.typ_label) : null;
  if (typ === "custom" && !typLabel) {
    return res.status(400).json({
      error: `Eigener Grund (typ_label) ist erforderlich, max. ${MAX_TYP_LABEL_LENGTH} Zeichen`,
    });
  }
  if (datum !== undefined && datum !== null && datum !== "" && !isIsoDate(datum)) {
    return res.status(400).json({ error: "Datum muss im Format YYYY-MM-DD sein" });
  }

  try {
    if (!(await findOwnBewerbung(pool, id, req.userId))) {
      return res.status(404).json({ error: "Bewerbung nicht gefunden" });
    }

    const result = await pool.query(
      `INSERT INTO bewerbung_updates AS u (bewerbung_id, typ, typ_label, text, datum)
       VALUES ($1, $2, $3, $4, COALESCE($5::date, CURRENT_DATE))
       RETURNING ${UPDATE_SELECT_FIELDS}`,
      [id, typ, typLabel, text, datum || null],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    serverError(res, err);
  }
});

// GET gespeicherte eigene Update-Gründe für eine Bewerbung
// (alle globalen + die nur für diese Bewerbung)
app.get("/api/bewerbungen/:id/update-typen", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    if (!(await findOwnBewerbung(pool, id, req.userId))) {
      return res.status(404).json({ error: "Bewerbung nicht gefunden" });
    }

    const result = await pool.query(
      `SELECT id, label, bewerbung_id
       FROM update_typen
       WHERE user_id = $1 AND (bewerbung_id IS NULL OR bewerbung_id = $2)
       ORDER BY created_at, id`,
      [req.userId, id],
    );
    res.json(result.rows);
  } catch (err) {
    serverError(res, err);
  }
});

// POST eigenen Update-Grund speichern
// bewerbung_id gesetzt → nur für diese Bewerbung, sonst für alle
app.post("/api/update-typen", authenticateToken, async (req, res) => {
  const label = normalizeTypLabel(req.body.label);
  const bewerbungId = req.body.bewerbung_id ?? null;

  if (!label) {
    return res
      .status(400)
      .json({ error: `Label ist erforderlich, max. ${MAX_TYP_LABEL_LENGTH} Zeichen` });
  }

  try {
    if (bewerbungId !== null && !(await findOwnBewerbung(pool, bewerbungId, req.userId))) {
      return res.status(404).json({ error: "Bewerbung nicht gefunden" });
    }

    const inserted = await pool.query(
      `INSERT INTO update_typen (user_id, bewerbung_id, label)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, (COALESCE(bewerbung_id, 0)), (lower(label))) DO NOTHING
       RETURNING id, label, bewerbung_id`,
      [req.userId, bewerbungId, label],
    );
    if (inserted.rows[0]) {
      return res.status(201).json(inserted.rows[0]);
    }

    // Gibt es schon → bestehenden Eintrag zurückgeben
    const existing = await pool.query(
      `SELECT id, label, bewerbung_id FROM update_typen
       WHERE user_id = $1 AND COALESCE(bewerbung_id, 0) = COALESCE($2::int, 0)
         AND lower(label) = lower($3)`,
      [req.userId, bewerbungId, label],
    );
    res.json(existing.rows[0]);
  } catch (err) {
    serverError(res, err);
  }
});

// DELETE gespeicherten Update-Grund (bestehende Verlaufseinträge bleiben)
app.delete("/api/update-typen/:typId", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM update_typen WHERE id = $1 AND user_id = $2",
      [req.params.typId, req.userId],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Grund nicht gefunden" });
    }
    res.json({ message: "Grund gelöscht" });
  } catch (err) {
    serverError(res, err);
  }
});

// DELETE Verlaufseintrag
app.delete(
  "/api/bewerbungen/:id/updates/:updateId",
  authenticateToken,
  async (req, res) => {
    const { id, updateId } = req.params;

    try {
      const result = await pool.query(
        `DELETE FROM bewerbung_updates u
         USING bewerbungen b
         WHERE u.id = $1 AND u.bewerbung_id = $2
           AND b.id = u.bewerbung_id AND b.user_id = $3`,
        [updateId, id, req.userId],
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Eintrag nicht gefunden" });
      }

      res.json({ message: "Eintrag gelöscht" });
    } catch (err) {
      serverError(res, err);
    }
  },
);

// DELETE Bewerbung löschen (NUR für eingeloggten User!)
app.delete("/api/bewerbungen/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const result = await pool.query(
      "DELETE FROM bewerbungen WHERE id = $1 AND user_id = $2",
      [id, userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Bewerbung nicht gefunden" });
    }

    res.json({ message: "Bewerbung gelöscht" });
  } catch (err) {
    serverError(res, err);
  }
});

// GET Statistiken (NUR für eingeloggten User!)
app.get("/api/statistiken", authenticateToken, async (req, res) => {
  const userId = req.userId;

  const query = `
    SELECT
      status,
      COUNT(*)::int AS anzahl
    FROM bewerbungen
    WHERE user_id = $1
    GROUP BY status
  `;

  try {
    const result = await pool.query(query, [userId]);

    const stats = {
      beworben: 0,
      stufe_weiter: 0,
      angenommen: 0,
      abgelehnt: 0,
      keine_antwort: 0,
      gesamt: 0,
    };

    result.rows.forEach((row) => {
      stats[row.status] = row.anzahl;
      stats.gesamt += row.anzahl;
    });

    res.json(stats);
  } catch (err) {
    serverError(res, err);
  }
});

// ==================== ADMIN ROUTES (PROTECTED + ADMIN ONLY) ====================

async function requireAdmin(req, res, next) {
  try {
    const result = await pool.query("SELECT role FROM users WHERE id = $1", [req.userId]);
    if (!result.rows[0] || result.rows[0].role !== "admin") {
      return res.status(403).json({ error: "Kein Zugriff" });
    }
    next();
  } catch (err) {
    serverError(res, err);
  }
}

// GET alle User mit Bewerbungsanzahl
app.get("/api/admin/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.name, u.role, u.created_at, u.email_verified_at,
             COUNT(b.id)::int AS bewerbungen_count
      FROM users u
      LEFT JOIN bewerbungen b ON b.user_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    res.json({ users: result.rows });
  } catch (err) {
    serverError(res, err);
  }
});

// GET Statistik eines einzelnen Users (nur Zahlen + Firma/Stelle/Status)
app.get("/api/admin/users/:id/stats", authenticateToken, requireAdmin, async (req, res) => {
  const targetId = parseInt(req.params.id);
  if (!Number.isInteger(targetId)) {
    return res.status(400).json({ error: "Ungültige User-ID" });
  }
  try {
    const userResult = await pool.query(
      `SELECT u.id, u.email, u.name, u.role, u.created_at,
              COUNT(b.id)::int AS gesamt,
              COUNT(b.id) FILTER (WHERE b.status = 'in_planung')::int AS in_planung,
              COUNT(b.id) FILTER (WHERE b.status = 'beworben')::int AS beworben,
              COUNT(b.id) FILTER (WHERE b.status = 'stufe_weiter')::int AS stufe_weiter,
              COUNT(b.id) FILTER (WHERE b.status = 'angenommen')::int AS angenommen,
              COUNT(b.id) FILTER (WHERE b.status = 'abgelehnt')::int AS abgelehnt,
              COUNT(b.id) FILTER (WHERE b.status = 'keine_antwort')::int AS keine_antwort,
              COUNT(b.id) FILTER (
                WHERE (CASE WHEN b.datum ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN b.datum::date END)
                      BETWEEN CURRENT_DATE - 30 AND CURRENT_DATE
              )::int AS neu_30_tage,
              GREATEST(
                MAX(b.created_at),
                MAX(b.updated_at),
                (SELECT MAX(bu.created_at)
                 FROM bewerbung_updates bu
                 JOIN bewerbungen b2 ON b2.id = bu.bewerbung_id
                 WHERE b2.user_id = u.id)
              ) AS letzte_aktivitaet
       FROM users u
       LEFT JOIN bewerbungen b ON b.user_id = u.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [targetId],
    );
    if (userResult.rowCount === 0) return res.status(404).json({ error: "User nicht gefunden" });

    // Bewerbungen pro Woche nach Bewerbungsdatum (letzte 12 Wochen).
    // datum ist TEXT – nur gültige YYYY-MM-DD-Werte zählen.
    const weeklyResult = await pool.query(
      `SELECT to_char(w.woche, 'YYYY-MM-DD') AS woche, COUNT(b.id)::int AS anzahl
       FROM generate_series(
         date_trunc('week', NOW()) - INTERVAL '11 weeks',
         date_trunc('week', NOW()),
         INTERVAL '1 week'
       ) AS w(woche)
       LEFT JOIN bewerbungen b
         ON b.user_id = $1
        AND date_trunc(
              'week',
              CASE WHEN b.datum ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN b.datum::date END
            ) = w.woche
       GROUP BY w.woche
       ORDER BY w.woche`,
      [targetId],
    );

    // Bewerbungen: bewusst nur Firma, Stelle und Status – keine Notizen o. Ä.
    const bewerbungenResult = await pool.query(
      `SELECT id, firma, position, status
       FROM bewerbungen
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [targetId],
    );

    res.json({
      user: userResult.rows[0],
      weekly: weeklyResult.rows,
      bewerbungen: bewerbungenResult.rows,
    });
  } catch (err) {
    serverError(res, err);
  }
});

// PATCH Rolle eines Users ändern
app.patch("/api/admin/users/:id/role", authenticateToken, requireAdmin, async (req, res) => {
  const { role } = req.body;
  const targetId = parseInt(req.params.id);
  if (!["user", "admin"].includes(role)) {
    return res.status(400).json({ error: "Ungültige Rolle" });
  }
  if (targetId === req.userId) {
    return res.status(400).json({ error: "Eigene Rolle kann nicht geändert werden" });
  }
  try {
    const result = await pool.query(
      "UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id",
      [role, targetId],
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "User nicht gefunden" });
    res.json({ message: "Rolle aktualisiert" });
  } catch (err) {
    serverError(res, err);
  }
});

// DELETE User löschen
app.delete("/api/admin/users/:id", authenticateToken, requireAdmin, async (req, res) => {
  const targetId = parseInt(req.params.id);
  if (targetId === req.userId) {
    return res.status(400).json({ error: "Eigener Account kann nicht gelöscht werden" });
  }
  try {
    const result = await pool.query("DELETE FROM users WHERE id = $1", [targetId]);
    if (result.rowCount === 0) return res.status(404).json({ error: "User nicht gefunden" });
    res.json({ message: "User gelöscht" });
  } catch (err) {
    serverError(res, err);
  }
});

// Zentrale Fehlerbehandlung (Upload, CORS, kaputtes JSON …) statt der
// Express-Standardseite, die in der Entwicklung Stacktraces ausgibt.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "Das Bild darf maximal 5 MB groß sein" : "Ungültiger Upload";
    return res.status(400).json({ error: message });
  }
  if (err.message === "Nur JPEG, PNG, GIF und WebP erlaubt") {
    return res.status(400).json({ error: err.message });
  }
  if (err.message?.startsWith("CORS not allowed")) {
    return res.status(403).json({ error: "Origin nicht erlaubt" });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Ungültiges JSON" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Anfrage zu groß" });
  }
  serverError(res, err);
});

pool
  .initDB()
  .then(async () => {
    // Nur Staging: Test-Accounts & Beispieldaten anlegen (siehe seed.js)
    //   SEED_DEMO_DATA=true   → anlegen, falls nicht vorhanden
    //   SEED_DEMO_DATA=reset  → bei jedem Start auf Ausgangszustand zurücksetzen
    const seedMode = process.env.SEED_DEMO_DATA;
    if (seedMode === "true" || seedMode === "reset") {
      const { seedDemoData } = require("./seed");
      await seedDemoData(pool, { reset: seedMode === "reset" }).catch((error) =>
        console.error("[seed] Fehler beim Anlegen der Testdaten:", error),
      );
    }
  })
  .catch((error) => {
    console.error("Fehler bei der Datenbankinitialisierung:", error);
  })
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`Server läuft auf Port ${PORT}`);
    });
  });
