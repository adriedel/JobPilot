require("dotenv").config();

// Ohne eigenes Secret könnte jeder gültige Tokens (auch für Admins) fälschen –
// deshalb startet der Server dann gar nicht erst.
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 16) {
  throw new Error(
    "JWT_SECRET fehlt oder ist kürzer als 16 Zeichen – bitte in der Umgebung bzw. backend/.env setzen.",
  );
}

module.exports = JWT_SECRET;
