import { test, expect } from "./fixtures";

/**
 * Session-Ablauf: Wer ein abgelaufenes oder ungültiges Token hat, wird
 * automatisch abgemeldet und landet auf dem Login.
 *
 * Läuft nur gegen Builds ohne Demo-Modus (PLAYWRIGHT_BASE_URL gesetzt),
 * denn im Demo-Modus gibt es keinen Login. Die API wird im Browser gemockt,
 * ein echtes Backend ist nicht nötig.
 */
test.skip(!process.env.PLAYWRIGHT_BASE_URL, "Nur ohne Demo-Modus (PLAYWRIGHT_BASE_URL)");

const USER = { id: 1, email: "e2e@jobpilot.test", name: "E2E Test", role: "user" };

/** Baut ein (unsigniertes) JWT mit Ablaufzeit – das Frontend liest nur `exp`. */
function fakeToken(expSecondsFromNow) {
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + expSecondsFromNow;
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ userId: 1, email: USER.email, exp })}.sig`;
}

async function loginWith(page, token) {
  await page.addInitScript(
    ([t, u]) => {
      if (!sessionStorage.getItem("e2e-seeded")) {
        localStorage.setItem("token", t);
        localStorage.setItem("user", JSON.stringify(u));
        sessionStorage.setItem("e2e-seeded", "1");
      }
    },
    [token, USER],
  );
}

/** API-Antworten: gültige Session → leere Liste/Statistik, sonst 401. */
async function mockApi(page, { expired }) {
  await page.route("**/api/**", (route) => {
    if (expired) {
      return route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Token abgelaufen - bitte neu einloggen" }),
      });
    }
    const url = route.request().url();
    const body = url.includes("statistiken") ? { gesamt: 0 } : [];
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
}

test.describe("Session-Ablauf @smoke", () => {
  test("gültige Session bleibt auf dem Dashboard", async ({ page }) => {
    await loginWith(page, fakeToken(3600));
    await mockApi(page, { expired: false });
    await page.goto("/dashboard");
    await expect(page.locator(".header-title")).toBeVisible();
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/dashboard$/);
    expect(await page.evaluate(() => localStorage.getItem("token"))).not.toBeNull();
  });

  test("abgelaufenes Token beim Öffnen → Login", async ({ page }) => {
    await loginWith(page, fakeToken(-60));
    await mockApi(page, { expired: true });
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
    expect(await page.evaluate(() => localStorage.getItem("token"))).toBeNull();
    await expect(page.locator(".session-expired-message")).toBeVisible();
  });

  test("API meldet 401 während der Nutzung → Login", async ({ page }) => {
    // Token sieht lokal noch gültig aus, der Server lehnt es aber ab
    // (z. B. JWT_SECRET geändert oder Token widerrufen)
    await loginWith(page, fakeToken(3600));
    await mockApi(page, { expired: true });
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
    expect(await page.evaluate(() => localStorage.getItem("token"))).toBeNull();
  });

  test("andere 401/403-Fehler melden nicht ab", async ({ page }) => {
    // z. B. "aktuelles Passwort falsch" (401 ohne Code) oder "kein Admin" (403)
    await loginWith(page, fakeToken(3600));
    await page.route("**/api/**", (route) => {
      const isStats = route.request().url().includes("statistiken");
      return route.fulfill({
        status: isStats ? 403 : 401,
        contentType: "application/json",
        body: JSON.stringify({ error: isStats ? "Kein Zugriff" : "Das aktuelle Passwort ist falsch" }),
      });
    });
    await page.goto("/dashboard");
    await expect(page.locator(".header-title")).toBeVisible();
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/dashboard$/);
    expect(await page.evaluate(() => localStorage.getItem("token"))).not.toBeNull();
  });

  test("Token läuft ab, während die App offen ist → Login", async ({ page }) => {
    await page.clock.install();
    await loginWith(page, fakeToken(120));
    await mockApi(page, { expired: false });
    await page.goto("/dashboard");
    await expect(page.locator(".header-title")).toBeVisible();

    await page.clock.fastForward("02:05");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator(".session-expired-message")).toBeVisible();
  });
});
