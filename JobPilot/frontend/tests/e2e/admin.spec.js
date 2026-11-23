import { test, expect } from "./fixtures";

/**
 * Admin-Bereich: Erreichbarkeit direkt nach dem Login (ohne Seiten-Reload)
 * und die Statistik-Seite.
 *
 * Läuft nur gegen Builds ohne Demo-Modus (PLAYWRIGHT_BASE_URL gesetzt),
 * denn im Demo-Modus gibt es keinen Login. Die API wird im Browser gemockt.
 */
test.skip(!process.env.PLAYWRIGHT_BASE_URL, "Nur ohne Demo-Modus (PLAYWRIGHT_BASE_URL)");

const ADMIN = { id: 1, email: "admin@jobpilot.test", name: "Admin", role: "admin" };

function fakeToken() {
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ userId: 1, email: ADMIN.email, exp })}.sig`;
}

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

function statsUser(id, name, email, counts, neu30, lastActivityDaysAgo) {
  const base = { in_planung: 0, beworben: 0, stufe_weiter: 0, angenommen: 0, abgelehnt: 0, keine_antwort: 0 };
  const all = { ...base, ...counts };
  return {
    id,
    name,
    email,
    role: id === 1 ? "admin" : "user",
    created_at: daysAgo(90),
    ...all,
    gesamt: Object.values(all).reduce((a, b) => a + b, 0),
    neu_30_tage: neu30,
    letzte_aktivitaet: lastActivityDaysAgo === null ? null : daysAgo(lastActivityDaysAgo),
  };
}

const STATS = {
  users: [
    // 10 abgeschickt, 6 Antworten → 60 %
    statsUser(2, "Lena Fleißig", "lena@jobpilot.test",
      { in_planung: 2, beworben: 3, stufe_weiter: 3, angenommen: 1, abgelehnt: 2, keine_antwort: 1 }, 5, 2),
    statsUser(3, null, "leer@jobpilot.test", {}, 0, null),
    statsUser(1, "Admin", "admin@jobpilot.test", { beworben: 2, abgelehnt: 2 }, 0, 45),
  ],
  weekly: Array.from({ length: 12 }, (_, i) => ({
    woche: daysAgo((11 - i) * 7).slice(0, 10),
    anzahl: [0, 1, 3, 2, 0, 4, 1, 2, 5, 3, 1, 2][i],
  })),
};

async function mockApi(page) {
  await page.route("**/api/**", (route) => {
    const url = route.request().url();
    const json = (body) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });

    if (url.includes("/auth/login")) return json({ token: fakeToken(), user: ADMIN });
    if (url.includes("/auth/me")) return json({ user: ADMIN });
    if (url.includes("/admin/stats")) return json(STATS);
    if (url.includes("/admin/users")) return json({ users: [] });
    if (url.includes("statistiken")) return json({ gesamt: 0 });
    return json([]);
  });
}

test.describe("Admin-Bereich @smoke", () => {
  test("Admin-Seite ist direkt nach dem Login ohne Reload erreichbar", async ({ page }) => {
    await mockApi(page);
    await page.goto("/login");
    await page.locator("#email").fill(ADMIN.email);
    await page.locator("#password").fill("geheim123");
    await page.locator("button[type=submit]").click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.locator(".user-avatar-btn").click();
    await page.getByRole("menuitem", { name: "Admin" }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: "Admin-Bereich" })).toBeVisible();
  });

  test("Statistik-Seite zeigt Kennzahlen und User", async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(
      ([t, u]) => {
        localStorage.setItem("token", t);
        localStorage.setItem("user", JSON.stringify(u));
      },
      [fakeToken(), ADMIN],
    );
    await page.goto("/admin");
    await page.getByRole("button", { name: /Statistiken/ }).click();

    await expect(page).toHaveURL(/\/admin\/statistiken$/);
    await expect(page.getByRole("heading", { name: "Statistiken" })).toBeVisible();

    // 1 von 3 Usern in den letzten 30 Tagen aktiv
    await expect(page.locator(".admin-stat-card").first()).toContainText("1 / 3");

    const lena = page.locator("tbody tr", { hasText: "Lena Fleißig" });
    await expect(lena).toContainText("60 %");
    await expect(lena).toContainText("vor 2 Tagen");

    const leer = page.locator("tbody tr", { hasText: "leer@jobpilot.test" });
    await expect(leer).toContainText("noch nie");
  });
});
