const { Resend } = require("resend");

// Ohne API-Key (z. B. lokal) nicht abstürzen: Mails werden dann nur in die
// Konsole geschrieben, damit Bestätigungs-/Reset-Links trotzdem nutzbar sind.
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

if (!resend) {
  console.warn(
    "[email] RESEND_API_KEY fehlt – E-Mails werden nicht verschickt, sondern nur in der Konsole ausgegeben.",
  );
}
const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const emailWrapper = `
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  max-width:560px;margin:0 auto;background:#ffffff;
  border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;
`;
const header = `
  background:linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%);
  padding:32px 40px;text-align:center;
`;
const body = `padding:40px;`;

/**
 * Nutzereingaben (z. B. der Name) landen im Mail-HTML. Ohne Escaping könnte
 * jemand mit fremder Adresse registrieren und eigene Links in eine echte
 * JobPilot-Mail an diese Adresse schmuggeln.
 */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Vorname für die Anrede, HTML-sicher und auf 50 Zeichen gekürzt. */
function greetingName(name) {
  const first = typeof name === "string" ? name.trim().split(/\s+/)[0] : "";
  return first ? escapeHtml(first.slice(0, 50)) : "dort";
}

/** Verschickt die Mail über Resend – oder gibt sie ohne API-Key in der Konsole aus. */
async function sendEmail({ to, subject, html, link }) {
  if (!resend) {
    console.log(`[email] (nicht verschickt) An: ${to} | Betreff: ${subject}
[email] Link: ${link}`);
    return;
  }
  await resend.emails.send({ from: `JobPilot <${FROM_EMAIL}>`, to, subject, html });
}

async function sendVerificationEmail(toEmail, name, token) {
  const url = `${FRONTEND_URL}/verify-email/confirm?token=${token}`;
  const hi = greetingName(name);

  await sendEmail({
    link: url,
    to: toEmail,
    subject: "Bitte bestätige deine E-Mail-Adresse – JobPilot",
    html: `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:20px;background:#f3f4f6">
<div style="${emailWrapper}">
  <div style="${header}">
    <p style="color:#fff;font-size:28px;font-weight:800;margin:0;letter-spacing:-0.5px">JobPilot</p>
    <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0">Dein Bewerbungstracker</p>
  </div>
  <div style="${body}">
    <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 12px">Hallo ${hi}!</h1>
    <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 28px">
      Willkommen bei JobPilot! Bitte bestätige deine E-Mail-Adresse,
      um deinen Account zu aktivieren. Der Link ist <strong>24&nbsp;Stunden</strong> gültig.
    </p>
    <div style="text-align:center;margin:32px 0">
      <a href="${url}"
         style="display:inline-block;background:linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%);
                color:#fff;text-decoration:none;padding:14px 36px;
                border-radius:10px;font-size:15px;font-weight:600">
        E-Mail-Adresse bestätigen
      </a>
    </div>
    <p style="color:#9ca3af;font-size:13px;margin:24px 0 0;line-height:1.5">
      Falls der Button nicht funktioniert, kopiere diesen Link:<br>
      <a href="${url}" style="color:#3b82f6;word-break:break-all">${url}</a>
    </p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0">
    <p style="color:#9ca3af;font-size:12px;margin:0">
      Falls du kein Konto erstellt hast, kannst du diese E-Mail ignorieren.
    </p>
  </div>
</div>
</body></html>`,
  });
}

async function sendPasswordResetEmail(toEmail, name, token) {
  const url = `${FRONTEND_URL}/reset-password?token=${token}`;
  const hi = greetingName(name);

  await sendEmail({
    link: url,
    to: toEmail,
    subject: "Passwort zurücksetzen – JobPilot",
    html: `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:20px;background:#f3f4f6">
<div style="${emailWrapper}">
  <div style="${header}">
    <p style="color:#fff;font-size:28px;font-weight:800;margin:0;letter-spacing:-0.5px">JobPilot</p>
    <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0">Dein Bewerbungstracker</p>
  </div>
  <div style="${body}">
    <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 12px">Passwort zurücksetzen</h1>
    <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 28px">
      Hallo ${hi}, wir haben eine Anfrage erhalten, das Passwort für deinen Account
      zurückzusetzen. Der Link ist <strong>1&nbsp;Stunde</strong> gültig.
    </p>
    <div style="text-align:center;margin:32px 0">
      <a href="${url}"
         style="display:inline-block;background:linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%);
                color:#fff;text-decoration:none;padding:14px 36px;
                border-radius:10px;font-size:15px;font-weight:600">
        Passwort zurücksetzen
      </a>
    </div>
    <p style="color:#9ca3af;font-size:13px;margin:24px 0 0;line-height:1.5">
      Falls der Button nicht funktioniert, kopiere diesen Link:<br>
      <a href="${url}" style="color:#3b82f6;word-break:break-all">${url}</a>
    </p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0">
    <p style="color:#9ca3af;font-size:12px;margin:0">
      Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.
      Dein Passwort bleibt unverändert.
    </p>
  </div>
</div>
</body></html>`,
  });
}

/**
 * Jemand hat sich mit einer bereits registrierten Adresse registriert. Statt
 * das im Formular zu verraten, bekommt der Inhaber der Adresse diesen Hinweis.
 */
async function sendAccountExistsEmail(toEmail, name) {
  const loginUrl = `${FRONTEND_URL}/login`;
  const resetUrl = `${FRONTEND_URL}/forgot-password`;
  const hi = greetingName(name);

  await sendEmail({
    link: loginUrl,
    to: toEmail,
    subject: "Du hast bereits ein Konto – JobPilot",
    html: `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:20px;background:#f3f4f6">
<div style="${emailWrapper}">
  <div style="${header}">
    <p style="color:#fff;font-size:28px;font-weight:800;margin:0;letter-spacing:-0.5px">JobPilot</p>
    <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0">Dein Bewerbungstracker</p>
  </div>
  <div style="${body}">
    <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 12px">Hallo ${hi}!</h1>
    <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 28px">
      Gerade wurde versucht, mit dieser E-Mail-Adresse ein neues Konto zu erstellen.
      Du hast aber bereits ein Konto bei JobPilot – melde dich einfach an.
    </p>
    <div style="text-align:center;margin:32px 0">
      <a href="${loginUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%);
                color:#fff;text-decoration:none;padding:14px 36px;
                border-radius:10px;font-size:15px;font-weight:600">
        Zum Login
      </a>
    </div>
    <p style="color:#9ca3af;font-size:13px;margin:24px 0 0;line-height:1.5">
      Passwort vergessen? <a href="${resetUrl}" style="color:#3b82f6">Hier zurücksetzen</a>.
    </p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0">
    <p style="color:#9ca3af;font-size:12px;margin:0">
      Falls du das nicht warst, kannst du diese E-Mail ignorieren. An deinem Konto hat sich nichts geändert.
    </p>
  </div>
</div>
</body></html>`,
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendAccountExistsEmail };
