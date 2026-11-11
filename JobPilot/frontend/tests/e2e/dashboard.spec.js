import {
  test,
  expect,
  cards,
  openCardMenu,
  openNewApplicationModal,
} from "./fixtures";

/**
 * Funktionstests für das Dashboard im Demo-Modus.
 * Jeder Test startet mit frischem localStorage → immer die 3 Demo-Bewerbungen.
 */
test.describe("Dashboard @demo", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(cards(page)).toHaveCount(3);
  });

  test("zeigt die Demo-Bewerbungen an", async ({ page }) => {
    await expect(page.locator(".header-title")).toHaveText("Bewerbungstracker");
    await expect(cards(page).filter({ hasText: "Frontend Developer" })).toContainText("SAP");
    await expect(cards(page).filter({ hasText: "UX Designer" })).toContainText("adidas");
    await expect(cards(page).filter({ hasText: "Product Manager Intern" })).toContainText(
      "BMW Group",
    );
  });

  test("Suche filtert nach Firma, Position und Standort", async ({ page }) => {
    const search = page.getByPlaceholder("Firma oder Position suchen...");

    await search.fill("adidas");
    await expect(cards(page)).toHaveCount(1);
    await expect(cards(page)).toContainText("UX Designer");

    await search.fill("münchen");
    await expect(cards(page)).toHaveCount(1);
    await expect(cards(page)).toContainText("BMW Group");

    await search.fill("gibt es nicht");
    await expect(cards(page)).toHaveCount(0);
    await expect(page.getByText("Keine Bewerbungen gefunden")).toBeVisible();

    await search.clear();
    await expect(cards(page)).toHaveCount(3);
  });

  test("Status-Filter zeigt nur passende Bewerbungen", async ({ page }) => {
    await page.locator(".status-dropdown-trigger").click();
    await page.getByRole("option", { name: "Beworben" }).click();

    await expect(cards(page)).toHaveCount(1);
    await expect(cards(page)).toContainText("Frontend Developer");

    await page.locator(".status-dropdown-trigger").click();
    await page.getByRole("option", { name: "Alle" }).click();
    await expect(cards(page)).toHaveCount(3);
  });

  test("Sortierung nach Firma", async ({ page }) => {
    await page.locator(".sort-dropdown-trigger").click();
    await page.getByRole("option", { name: "Firma" }).click();

    // Standard-Richtung ist absteigend → SAP, BMW Group, adidas
    await expect(page.locator(".card-firma")).toHaveText(["SAP", "BMW Group", "adidas"]);

    await page.locator(".sort-direction-toggle").click();
    await expect(page.locator(".card-firma")).toHaveText(["adidas", "BMW Group", "SAP"]);
  });

  test("neue Bewerbung anlegen", async ({ page }) => {
    await openNewApplicationModal(page);

    await page.getByPlaceholder("z.B. SAP").fill("Playwright GmbH");
    await page.getByPlaceholder("z.B. Frontend Developer").fill("QA Engineer");
    await page.locator(".modal .btn-submit").click();

    await expect(page.locator(".modal")).toBeHidden();
    await expect(cards(page)).toHaveCount(4);
    await expect(cards(page).filter({ hasText: "QA Engineer" })).toContainText(
      "Playwright GmbH",
    );

    // Bleibt nach dem Neuladen erhalten
    await page.reload();
    await expect(cards(page)).toHaveCount(4);
  });

  test("Bewerbung bearbeiten", async ({ page }) => {
    await openCardMenu(page, "UX Designer");
    await page.getByRole("button", { name: "Bearbeiten" }).click();

    const position = page.locator('.modal input[name="position"]');
    await expect(position).toHaveValue("UX Designer");
    await position.fill("Senior UX Designer");
    await page.locator(".modal .btn-submit").click();

    await expect(cards(page).filter({ hasText: "Senior UX Designer" })).toHaveCount(1);
  });

  test("Status über das Kartenmenü ändern", async ({ page }) => {
    await openCardMenu(page, "Frontend Developer");
    await page.locator(".dropdown-item", { hasText: "Angenommen" }).click();

    await page.locator(".status-dropdown-trigger").click();
    await page.getByRole("option", { name: "Angenommen" }).click();
    await expect(cards(page)).toHaveCount(1);
    await expect(cards(page)).toContainText("Frontend Developer");
  });

  test("Bewerbung löschen", async ({ page }) => {
    await openCardMenu(page, "Product Manager Intern");
    await page.locator(".dropdown-item-delete").click();

    await expect(page.locator(".delete-modal-message")).toBeVisible();
    await page.locator(".delete-confirm-button").click();

    await expect(cards(page)).toHaveCount(2);
    await expect(cards(page).filter({ hasText: "Product Manager Intern" })).toHaveCount(0);
  });

  test("Sprache auf Englisch umstellen", async ({ page }) => {
    await page.locator(".language-toggle").click();
    await expect(page.locator(".header-title")).toHaveText("Application Tracker");
    await expect(page.getByPlaceholder("Search company or position...")).toBeVisible();
  });

  test("Dark Mode umschalten", async ({ page }) => {
    const html = page.locator("html");
    await expect(html).not.toHaveClass(/dark-mode/);

    const darkButton = page.getByRole("button", { name: "Dark mode" });
    test.skip(!(await darkButton.isVisible()), "Theme-Umschalter ist in dieser Ansicht ausgeblendet");

    await darkButton.click();
    await expect(html).toHaveClass(/dark-mode/);

    await page.reload();
    await expect(html).toHaveClass(/dark-mode/);
  });
});
