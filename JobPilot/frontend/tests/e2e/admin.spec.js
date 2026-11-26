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

const LENA = {
  id: 2,
  email: "lena@jobpilot.test",
  name: "Lena Fleißig",
  role: "user",
  created_at: daysAgo(90),
  email_verified_at: daysAgo(90),
  bewerbungen_count: 12,
};

// 10 abgeschickt, 6 Antworten → 60 %
const LENA_STATS = {
  user: {
    ...LENA,
    gesamt: 12,
    in_planung: 2,
    beworben: 3,
    stufe_weiter: 3,
    angenommen: 1,
    abgelehnt: 2,
    keine_antwort: 1,
    unklar: 0,
    neu_30_tage: 5,
    letzte_aktivitaet: daysAgo(2),
  },
  weekly: Array.from({ length: 12 }, (_, i) => ({
    woche: daysAgo((11 - i) * 7).slice(0, 10),
    anzahl: [0, 1, 3, 2, 0, 4, 1, 2, 5, 3, 1, 2][i],
  })),
  bewerbungen: [
    { id: 11, firma: "SAP", position: "Frontend Developer", status: "stufe_weiter" },
    { id: 12, firma: "adidas", position: "UX Designer", status: "angenommen" },
  ],
};

async function mockApi(page) {
  await page.route("**/api/**", (route) => {
    const url = route.request().url();
    const json = (body) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });

    if (url.includes("/auth/login")) return json({ token: fakeToken(), user: ADMIN });
    if (url.includes("/auth/me")) return json({ user: ADMIN });
    if (url.includes("/admin/users/2/stats")) return json(LENA_STATS);
    if (url.includes("/admin/users")) return json({ users: [{ ...ADMIN, created_at: daysAgo(100) }, LENA] });
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

  test("Statistik eines Users zeigt Kennzahlen und Bewerbungen", async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(
      ([t, u]) => {
        localStorage.setItem("token", t);
        localStorage.setItem("user", JSON.stringify(u));
      },
      [fakeToken(), ADMIN],
    );
    await page.goto("/admin");
    await page
      .locator("tbody tr", { hasText: LENA.email })
      .getByRole("button", { name: "Statistik" })
      .click();

    await expect(page).toHaveURL(/\/admin\/users\/2\/statistik$/);
    await expect(page.getByRole("heading", { name: "Statistik: Lena Fleißig" })).toBeVisible();

    const cards = page.locator(".admin-stat-card");
    await expect(cards.filter({ hasText: "Rückmeldequote" })).toContainText("60 %");
    await expect(cards.filter({ hasText: "Letzte Aktivität" })).toContainText("vor 2 Tagen");

    const sap = page.locator("tbody tr", { hasText: "SAP" });
    await expect(sap).toContainText("Frontend Developer");
    await expect(sap).toContainText("Stufe weiter");
  });
});
