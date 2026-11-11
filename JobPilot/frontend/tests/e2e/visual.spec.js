import { test, expect, cards, openNewApplicationModal } from "./fixtures";

/**
 * Visuelle Regressionstests: vergleicht Screenshots mit den Referenzbildern in
 * tests/e2e/__screenshots__. Ändert sich das Layout ungewollt, schlägt der Test fehl
 * und der HTML-Report zeigt "erwartet / tatsächlich / Diff" nebeneinander.
 *
 * Referenzbilder nach gewollten Design-Änderungen aktualisieren:
 *   npm run test:visual:update      (läuft im Linux-Docker-Container, wie in CI)
 */
test.describe("Aussehen @demo @visual", () => {
  // Referenzbilder sind Linux-Renderings (CI/Docker). Unter Windows/macOS sehen
  // Schriften minimal anders aus → dort überspringen statt falsch-rot.
  test.skip(
    process.platform !== "linux",
    "Screenshot-Vergleich nur unter Linux (CI / npm run test:visual:update)",
  );

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await expect(cards(page)).toHaveCount(3);
    // Warten bis Webfonts & Bilder geladen sind
    await page.evaluate(() => document.fonts.ready);
  });

  test("Dashboard hell", async ({ page }) => {
    await expect(page).toHaveScreenshot("dashboard-light.png", { fullPage: true });
  });

  test("Dashboard dunkel", async ({ page }) => {
    await page.evaluate(() => localStorage.setItem("darkMode", "true"));
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark-mode/);
    await expect(cards(page)).toHaveCount(3);
    await expect(page).toHaveScreenshot("dashboard-dark.png", { fullPage: true });
  });

  test("Modal 'Neue Bewerbung'", async ({ page }) => {
    await openNewApplicationModal(page);
    await expect(page).toHaveScreenshot("modal-new-application.png");
  });
});
