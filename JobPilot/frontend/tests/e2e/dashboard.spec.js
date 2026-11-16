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

  test("Verlauf: Status-Wechsel wird geloggt, Updates lassen sich hinzufügen", async ({
    page,
  }) => {
    const card = cards(page).filter({ hasText: "Frontend Developer" });
    // Nur Notiz, sonst nichts passiert → kein Verlauf-Link
    await expect(card.locator(".card-history-link")).toHaveCount(0);
    // Anfangs-Notiz ohne gespeicherten Zeitstempel → Bewerbungsdatum
    await expect(card.locator(".card-notes-wrap").first()).toContainText("15.03.2026 · Notiz");

    await openCardMenu(page, "Frontend Developer");
    await page.locator(".dropdown-item", { hasText: "Stufe weiter" }).click();
    // Status-Eintrag + Notiz
    await expect(card.locator(".card-history-link")).toHaveText("Verlauf · 2 Einträge");
    await expect(card.locator(".card-latest-entry")).toContainText(
      "Status geändert: Beworben → Stufe weiter",
    );

    await card.locator(".card-history-link").click();
    const panel = page.locator(".verlauf-panel");
    const entries = panel.locator(".verlauf-entry");
    await expect(panel).toContainText("Frontend Developer");
    await expect(entries).toHaveCount(2);
    // Die ursprüngliche Notiz steht mit Datum ganz unten
    await expect(entries.last()).toContainText("Notiz");
    await expect(entries.last()).toContainText("Portfolio bereits verschickt");

    await panel.getByRole("radio", { name: "Gespräch" }).click();
    await panel.locator("textarea").fill("Telefonat mit HR, Rückmeldung bis Freitag");
    await panel.getByRole("button", { name: "Speichern" }).click();

    await expect(entries).toHaveCount(3);
    await expect(entries.first()).toContainText("15.04.2026");
    await expect(card.locator(".card-history-link")).toHaveText("Verlauf · 3 Einträge");

    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();

    // Bleibt nach dem Neuladen erhalten
    await page.reload();
    await expect(card.locator(".card-history-link")).toHaveText("Verlauf · 3 Einträge");
  });

  test("erstes Update über das Kartenmenü hinzufügen", async ({ page }) => {
    const card = cards(page).filter({ hasText: "Product Manager Intern" });
    await expect(card.locator(".card-history-link")).toHaveCount(0);

    await openCardMenu(page, "Product Manager Intern");
    await page.locator(".dropdown-item", { hasText: "Update hinzufügen" }).click();

    const panel = page.locator(".verlauf-panel");
    await panel.locator("textarea").fill("Anschreiben abgeschickt");
    await panel.getByRole("button", { name: "Speichern" }).click();

    await expect(panel.locator(".verlauf-entry")).toHaveCount(2);
    await page.keyboard.press("Escape");
    await expect(card.locator(".card-history-link")).toHaveText("Verlauf · 2 Einträge");
  });

  test("eigener Update-Grund: einmalig, für diese oder alle Bewerbungen", async ({
    page,
  }) => {
    const panel = page.locator(".verlauf-panel");
    const reasonChip = (label) => panel.locator(".verlauf-type", { hasText: label });

    const addReason = async (label, scope) => {
      await panel.getByRole("button", { name: "Eigener Grund" }).click();
      await panel.getByPlaceholder("z.B. Assessment Center").fill(label);
      await panel.getByLabel(scope).check();
      await panel.getByRole("button", { name: "Übernehmen" }).click();
    };
    const saveUpdate = async (text) => {
      await panel.locator("textarea").fill(text);
      await panel.getByRole("button", { name: "Speichern" }).click();
    };

    await openCardMenu(page, "Frontend Developer");
    await page.locator(".dropdown-item", { hasText: "Update hinzufügen" }).click();

    // Einmalig: wird benutzt und verschwindet danach wieder
    await addReason("Messe-Gespräch", "Nur dieses Mal");
    await expect(reasonChip("Messe-Gespräch")).toHaveAttribute("aria-checked", "true");
    await saveUpdate("Am Stand kennengelernt");
    await expect(panel.locator(".verlauf-entry").first()).toContainText("Messe-Gespräch");
    await expect(reasonChip("Messe-Gespräch")).toHaveCount(0);

    // Für diese Bewerbung und für alle Bewerbungen speichern
    await addReason("Probearbeiten", "Für diese Bewerbung");
    await saveUpdate("Probetag vereinbart");
    await addReason("Assessment Center", "Für alle Bewerbungen");
    await expect(reasonChip("Probearbeiten")).toBeVisible();
    await expect(reasonChip("Assessment Center")).toBeVisible();

    // Andere Bewerbung: nur der globale Grund ist da
    await page.keyboard.press("Escape");
    await openCardMenu(page, "UX Designer");
    await page.locator(".dropdown-item", { hasText: "Update hinzufügen" }).click();
    await expect(panel).toContainText("UX Designer");
    await expect(reasonChip("Assessment Center")).toBeVisible();
    await expect(reasonChip("Probearbeiten")).toHaveCount(0);

    // Globalen Grund wieder entfernen
    await panel.getByRole("button", { name: "Grund entfernen: Assessment Center" }).click();
    await expect(reasonChip("Assessment Center")).toHaveCount(0);

    // Karte zeigt den eigenen Grund als Typ des letzten Eintrags
    await page.keyboard.press("Escape");
    await expect(
      cards(page).filter({ hasText: "Frontend Developer" }).locator(".card-latest-entry"),
    ).toContainText("Probearbeiten");
  });

  test("Notiz zeigt das Datum der letzten Änderung", async ({ page }) => {
    await openCardMenu(page, "UX Designer");
    await page.getByRole("button", { name: "Bearbeiten" }).click();
    await page.locator('.modal textarea[name="notizen"]').fill("Zweites Gespräch am Montag");
    await page.locator(".modal .btn-submit").click();

    const notes = cards(page).filter({ hasText: "UX Designer" }).locator(".card-notes-wrap").first();
    await expect(notes).toContainText("15.04.2026 · Notiz");
    await expect(notes).toContainText("Zweites Gespräch am Montag");
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
