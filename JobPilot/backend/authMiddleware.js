const jwt = require("jsonwebtoken");
const pool = require("./database");

const JWT_SECRET = require("./jwtSecret");
const JWT_EXPIRES_IN = "2d";

/**
 * Login-Token ausstellen. `tv` (token_version) erlaubt, alle bisherigen Tokens
 * eines Users ungültig zu machen – z. B. nach Passwort-Reset oder -Wechsel.
 */
function signToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, tv: user.token_version ?? 0 },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

// Middleware um geschützte Routes zu schützen.
// Token-Probleme antworten immer mit 401 und einem eindeutigen `code`, damit das
// Frontend sie von anderen 401/403-Fällen (falsches Passwort, kein Admin) unterscheiden
// und die Sitzung beenden kann.
async function authenticateToken(req, res, next) {
  // Token aus Authorization Header holen
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({
      error: "Kein Token - Zugriff verweigert",
      code: "TOKEN_MISSING",
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token abgelaufen - bitte neu einloggen",
        code: "TOKEN_EXPIRED",
      });
    }
    return res
      .status(401)
      .json({ error: "Ungültiger Token", code: "TOKEN_INVALID" });
  }

  try {
    // Gelöschte User und widerrufene Tokens (token_version erhöht) abweisen.
    // Tokens von vor dieser Prüfung haben kein `tv` und zählen als Version 0.
    const result = await pool.query(
      "SELECT token_version FROM users WHERE id = $1",
      [decoded.userId],
    );
    if (
      result.rows.length === 0 ||
      (decoded.tv ?? 0) !== result.rows[0].token_version
    ) {
      return res
        .status(401)
        .json({ error: "Ungültiger Token", code: "TOKEN_INVALID" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Interner Serverfehler" });
  }

  req.userId = decoded.userId;
  req.userEmail = decoded.email;
  next();
}

module.exports = authenticateToken;
module.exports.signToken = signToken;
