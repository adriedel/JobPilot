const { rateLimit } = require("express-rate-limit");

// Begrenzt Anfragen pro IP auf die öffentlichen Auth-Endpunkte:
// gegen Passwort-Raten und gegen massenhaften Mailversand über Resend.
function limiter({ windowMinutes, limit, skipSuccessfulRequests = false }) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    skipSuccessfulRequests,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
      error:
        "Zu viele Anfragen – bitte versuche es in ein paar Minuten erneut.",
      code: "RATE_LIMITED",
    },
  });
}

module.exports = {
  // Nur fehlgeschlagene Logins zählen, normales Anmelden bleibt unbegrenzt
  loginLimiter: limiter({
    windowMinutes: 15,
    limit: 10,
    skipSuccessfulRequests: true,
  }),
  registerLimiter: limiter({ windowMinutes: 60, limit: 10 }),
  // Endpunkte, die E-Mails verschicken
  emailLimiter: limiter({ windowMinutes: 60, limit: 5 }),
  // Token-Endpunkte (Verifizierung, Reset) und Passwort-Abfragen im Profil
  tokenLimiter: limiter({ windowMinutes: 15, limit: 20 }),
};
