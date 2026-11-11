import { test, expect } from "./fixtures";

/**
 * Smoke-Tests: laufen überall – lokal im Demo-Modus UND gegen Staging
 * (PLAYWRIGHT_BASE_URL=... npm run test:e2e führt nur @smoke-Tests aus).
 *
 * Optionale Umgebungsvariablen für Staging:
 *   E2E_API_URL         z.B. https://jobpilot-backend-staging.onrender.com
 *                       → prüft /health des Backends
 *   E2E_USER_EMAIL      Login-Daten eines (verifizierten) Test-Accounts auf Staging
 *   E2E_USER_PASSWORD   → testet Login + Anlegen/Löschen einer Bewerbung end-to-end
 */
const isExternal = !!process.env.PLAYWRIGHT_BASE_URL;

test.describe("Smoke @smoke", () => {
  // Häufigster Fehler gegen Vercel-Previews: Deployment Protection leitet auf
  // den Vercel-Login um. Dann klar sagen, was los ist, statt "#root not found".
  test.afterEach(async ({ page }) => {
    if (new URL(page.url()).hostname === "vercel.com") {
      throw new Error(
        "Umleitung auf vercel.com/login – Vercel Deployment Protection ist aktiv. " +
          "Entweder für Previews deaktivieren oder VERCEL_AUTOMATION_BYPASS_SECRET " +
          "als GitHub-Secret setzen (siehe JobPilot/TESTING.md, Schritt 4).",
      );
    }
  });

  test("Startseite lädt ohne Fehler", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator("#root")).not.toBeEmpty();
  });

  test("Login-Seite ist erreichbar", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator(".auth-button")).toBeEnabled();
  });

  test("Unbekannte Routen leiten zur Startseite um", async ({ page }) => {
    await page.goto("/gibt-es-nicht");
    await expect(page).not.toHaveURL(/gibt-es-nicht/);
  });

  test("Backend ist erreichbar", async ({ request }) => {
    const apiUrl = process.env.E2E_API_URL;
    test.skip(!apiUrl, "E2E_API_URL nicht gesetzt");

    // Render-Free-Instanzen schlafen – der erste Aufruf kann ~1 Minute dauern
    test.setTimeout(120_000);
    const response = await request.get(`${apiUrl.replace(/\/$/, "")}/health`, {
      timeout: 110_000,
    });
    expect(response.ok()).toBeTruthy();
    expect(await response.json()).toEqual({ status: "ok" });
  });

  test("Login und Bewerbung anlegen/löschen (echtes Backend)", async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    test.skip(!isExternal || !email || !password, "Nur gegen Staging mit Test-Account");
    test.setTimeout(180_000);

    await page.goto("/login");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.locator(".auth-button").click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 90_000 });

    const firma = `E2E-Test ${Date.now()}`;
    const headerButton = page.locator(".btn-new-bewerbung");
    if (await headerButton.isVisible()) {
      await headerButton.click();
    } else {
      await page.locator(".user-menu > button").click();
      await page.locator(".user-dropdown-new").click();
    }
    await page.locator('.modal input[name="firma"]').fill(firma);
    await page.locator('.modal input[name="position"]').fill("Playwright Smoke Test");
    await page.locator(".modal .btn-submit").click();

    const card = page.locator(".bewerbung-card").filter({ hasText: firma });
    await expect(card).toHaveCount(1, { timeout: 30_000 });

    // Aufräumen
    await card.getByRole("button", { name: "Menü öffnen" }).click();
    await card.locator(".dropdown-item-delete").click();
    await page.locator(".delete-confirm-button").click();
    await expect(card).toHaveCount(0, { timeout: 30_000 });
  });
});
