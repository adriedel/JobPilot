const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const pool = require("./database");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendAccountExistsEmail,
} = require("./emailService");

const { signToken } = require("./authMiddleware");

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Für Logins mit unbekannter E-Mail: trotzdem einen bcrypt-Vergleich rechnen,
// damit die Antwortzeit nicht verrät, ob es die Adresse gibt.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("kein-echtes-passwort", 10);

const REGISTER_RESPONSE = {
  message: "Registrierung erfolgreich. Bitte bestätige deine E-Mail-Adresse.",
};

async function register(req, res) {
  const { email, password, name } = req.body;

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return res
      .status(400)
      .json({ message: "Email und Passwort sind erforderlich" });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ message: "Das Passwort muss mindestens 8 Zeichen lang sein" });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // Immer hashen – auch wenn es die Adresse schon gibt – damit beide Fälle
    // gleich lange dauern
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const existing = await pool.query(
      "SELECT id, email, name, email_verified_at FROM users WHERE email = $1",
      [normalizedEmail],
    );

    // Gibt es die Adresse schon, antwortet die API genauso wie bei einer neuen
    // Registrierung (verrät also nicht, wer registriert ist). Der Inhaber bekommt
    // eine Mail: bei bestätigtem Konto einen Hinweis, sonst einen neuen Bestätigungslink.
    if (existing.rows.length > 0) {
      const user = existing.rows[0];
      try {
        if (user.email_verified_at) {
          await sendAccountExistsEmail(user.email, user.name);
        } else {
          await pool.query(
            `UPDATE users
             SET email_verification_token = $1, email_verification_token_expires = $2
             WHERE id = $3`,
            [hashToken(verificationToken), tokenExpires, user.id],
          );
          await sendVerificationEmail(user.email, user.name, verificationToken);
        }
      } catch (emailErr) {
        console.error("Fehler beim Senden der E-Mail für bestehenden Account:", emailErr);
      }
      return res.status(201).json({ ...REGISTER_RESPONSE, email: normalizedEmail });
    }

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, email_verification_token, email_verification_token_expires)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, created_at`,
      [normalizedEmail, hashedPassword, name || null, hashToken(verificationToken), tokenExpires],
    );

    const user = result.rows[0];

    try {
      await sendVerificationEmail(user.email, user.name, verificationToken);
    } catch (emailErr) {
      console.error("Fehler beim Senden der Verifizierungs-E-Mail:", emailErr);
    }

    res.status(201).json({ ...REGISTER_RESPONSE, email: user.email });
  } catch (err) {
    console.error("Fehler bei der Registrierung:", err);
    res.status(500).json({ message: "Interner Serverfehler" });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return res
      .status(400)
      .json({ error: "Email und Passwort sind erforderlich" });
  }

  try {
    const result = await pool.query(
      "SELECT id, email, password_hash, name, role, email_verified_at, token_version FROM users WHERE email = $1",
      [email.toLowerCase()],
    );

    if (result.rows.length === 0) {
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
      return res.status(401).json({ error: "Ungültige Email oder Passwort" });
    }

    const user = result.rows[0];

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Ungültige Email oder Passwort" });
    }

    if (!user.email_verified_at) {
      return res.status(403).json({
        error: "Bitte bestätige zuerst deine E-Mail-Adresse.",
        code: "EMAIL_NOT_VERIFIED",
        email: user.email,
      });
    }

    const token = signToken(user);

    res.json({
      message: "Login erfolgreich",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Fehler beim Login" });
  }
}

async function verifyEmail(req, res) {
  const { token } = req.query;

  if (typeof token !== "string" || !token) {
    return res.status(400).json({ error: "Ungültiger Token" });
  }

  try {
    // In der DB liegt nur der Hash – ein DB-Leak verrät so keine gültigen Links.
    // Übergang: vor dieser Änderung verschickte Links enthalten den Klartext-Token
    // (läuft nach 24 h aus, danach kann der zweite Vergleich entfallen).
    const result = await pool.query(
      `SELECT id FROM users
       WHERE email_verification_token IN ($1, $2)
         AND email_verification_token_expires > NOW()
         AND email_verified_at IS NULL`,
      [hashToken(token), token],
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Ungültiger oder abgelaufener Verifizierungslink" });
    }

    await pool.query(
      `UPDATE users
       SET email_verified_at = CURRENT_TIMESTAMP,
           email_verification_token = NULL,
           email_verification_token_expires = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [result.rows[0].id],
    );

    res.json({ message: "E-Mail-Adresse erfolgreich bestätigt" });
  } catch (err) {
    console.error("Verify email error:", err);
    res.status(500).json({ error: "Fehler bei der Verifizierung" });
  }
}

async function resendVerification(req, res) {
  const { email } = req.body;

  if (typeof email !== "string" || !email) {
    return res.status(400).json({ error: "E-Mail-Adresse ist erforderlich" });
  }

  try {
    const result = await pool.query(
      "SELECT id, email, name, email_verified_at FROM users WHERE email = $1",
      [email.toLowerCase()],
    );

    // Immer Success zurückgeben (verhindert E-Mail-Enumeration)
    if (result.rows.length === 0 || result.rows[0].email_verified_at) {
      return res.json({ message: "Falls ein unbestätigter Account existiert, wurde eine neue E-Mail gesendet." });
    }

    const user = result.rows[0];
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE users
       SET email_verification_token = $1,
           email_verification_token_expires = $2
       WHERE id = $3`,
      [hashToken(verificationToken), tokenExpires, user.id],
    );

    try {
      await sendVerificationEmail(user.email, user.name, verificationToken);
    } catch (emailErr) {
      console.error("Fehler beim Senden:", emailErr);
    }

    res.json({ message: "Falls ein unbestätigter Account existiert, wurde eine neue E-Mail gesendet." });
  } catch (err) {
    console.error("Resend verification error:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
}

async function forgotPassword(req, res) {
  const { email } = req.body;

  if (typeof email !== "string" || !email) {
    return res.status(400).json({ error: "E-Mail-Adresse ist erforderlich" });
  }

  const genericResponse = { message: "Falls ein Account mit dieser E-Mail existiert, wurde ein Zurücksetzen-Link gesendet." };

  try {
    const result = await pool.query(
      "SELECT id, email, name FROM users WHERE email = $1 AND email_verified_at IS NOT NULL",
      [email.toLowerCase()],
    );

    if (result.rows.length === 0) {
      return res.json(genericResponse);
    }

    const user = result.rows[0];
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(resetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await pool.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [user.id]);
    await pool.query(
      "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
      [user.id, tokenHash, expiresAt],
    );

    try {
      await sendPasswordResetEmail(user.email, user.name, resetToken);
    } catch (emailErr) {
      console.error("Fehler beim Senden:", emailErr);
    }

    res.json(genericResponse);
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
}

async function resetPassword(req, res) {
  const { token, password } = req.body;

  if (typeof token !== "string" || typeof password !== "string" || !token || !password) {
    return res.status(400).json({ error: "Token und Passwort sind erforderlich" });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Das Passwort muss mindestens 8 Zeichen lang sein" });
  }

  try {
    const tokenHash = hashToken(token);

    const result = await pool.query(
      `SELECT user_id FROM password_reset_tokens WHERE token_hash = $1 AND expires_at > NOW()`,
      [tokenHash],
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Ungültiger oder abgelaufener Zurücksetzen-Link" });
    }

    const userId = result.rows[0].user_id;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await pool.query(
      // token_version erhöhen → alle bisherigen Logins (auch ein evtl. gestohlener) enden
      `UPDATE users SET password_hash = $1, token_version = token_version + 1,
                        updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [hashedPassword, userId],
    );
    await pool.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [userId]);

    res.json({ message: "Passwort erfolgreich zurückgesetzt" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
}

async function getCurrentUser(req, res) {
  try {
    const result = await pool.query(
      "SELECT id, email, name, role, profile_image_url, avatar_config, created_at FROM users WHERE id = $1",
      [req.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User nicht gefunden" });
    }

    const user = result.rows[0];
    if (user.avatar_config && typeof user.avatar_config === "string") {
      try { user.avatar_config = JSON.parse(user.avatar_config); } catch { user.avatar_config = null; }
    }
    res.json({ user });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Fehler beim Laden des Users" });
  }
}

module.exports = {
  register,
  login,
  getCurrentUser,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
};
