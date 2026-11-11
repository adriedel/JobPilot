const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const pool = require("./database");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./swagger.yaml");
const authenticateToken = require("./authMiddleware");
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
require("dotenv").config();

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

function parseUserRow(row) {
  if (!row) return row;
  if (row.avatar_config && typeof row.avatar_config === "string") {
    try { row.avatar_config = JSON.parse(row.avatar_config); } catch { row.avatar_config = null; }
  }
  return row;
}

const app = express();
const PORT = process.env.PORT || 3001;

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

      const isLocalhostOrigin =
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
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
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
app.post("/api/auth/register", register);

// Login
app.post("/api/auth/login", login);

// E-Mail-Verifizierung
app.get("/api/auth/verify-email", verifyEmail);
app.post("/api/auth/resend-verification", resendVerification);

// Passwort vergessen / zurücksetzen
app.post("/api/auth/forgot-password", forgotPassword);
app.post("/api/auth/reset-password", resetPassword);

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
    res.status(500).json({ error: err.message });
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
      res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
});

// Change email (PROTECTED)
app.put("/api/auth/profile/email", authenticateToken, async (req, res) => {
  const { email } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ error: "E-Mail ist erforderlich" });
  }
  const newEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return res.status(400).json({ error: "Ungültige E-Mail-Adresse" });
  }
  try {
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
    res.status(500).json({ error: err.message });
  }
});

// Change password (PROTECTED)
app.put("/api/auth/profile/password", authenticateToken, async (req, res) => {
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
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
});

// ==================== BEWERBUNGEN ROUTES (PROTECTED) ====================

// GET alle Bewerbungen (NUR für eingeloggten User!)
app.get("/api/bewerbungen", authenticateToken, async (req, res) => {
  const { status } = req.query;
  const userId = req.userId; // Aus JWT Token

  let query = "SELECT * FROM bewerbungen WHERE user_id = $1";
  let params = [userId];

  if (status) {
    query += " AND status = $2";
    params.push(status);
  }

  query += " ORDER BY created_at DESC";

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
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

  const query = `
    INSERT INTO bewerbungen
    (position, firma, status, datum, standort, ansprechpartner, notizen, bewerbungsart, startdatum, link, gehalt, waehrung, user_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
    res.status(500).json({ error: err.message });
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

  const query = `
    UPDATE bewerbungen
    SET position = $1, firma = $2, status = $3, datum = $4,
        standort = $5, ansprechpartner = $6, notizen = $7,
        bewerbungsart = $8, startdatum = $9, link = $10,
        gehalt = $11, waehrung = $12, updated_at = CURRENT_TIMESTAMP
    WHERE id = $13 AND user_id = $14
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
      id,
      userId,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Bewerbung nicht gefunden" });
    }

    res.json({ message: "Bewerbung aktualisiert" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
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
