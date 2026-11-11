import { test as base, expect } from "@playwright/test";

/**
 * Gemeinsames Setup für alle Tests:
 * - Sprache Deutsch, Hell-Modus → reproduzierbare Texte und Screenshots
 * - feste Uhrzeit (nur lokal/Demo) → Datumsfelder ("heute") ändern sich nicht
 * - JavaScript-Fehler im Browser lassen den Test fehlschlagen
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Gegen echte Umgebungen (Staging) die echte Uhrzeit verwenden – Tokens etc.
    if (!process.env.PLAYWRIGHT_BASE_URL) {
      await page.clock.setFixedTime(new Date("2026-04-15T10:00:00+02:00"));
    }

    await page.addInitScript(() => {
      if (!localStorage.getItem("language")) localStorage.setItem("language", "de");
      if (!localStorage.getItem("darkMode")) localStorage.setItem("darkMode", "false");
    });

    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    await use(page);

    expect(pageErrors, "Unerwartete JavaScript-Fehler im Browser").toEqual([]);
  },
});

export { expect };

/** Alle Bewerbungskarten im Dashboard. */
export const cards = (page) => page.locator(".bewerbung-card");

/**
 * Öffnet das "Neue Bewerbung"-Modal. Auf dem Desktop gibt es dafür einen Button
 * im Header, auf dem Handy steckt er im User-Menü.
 */
export async function openNewApplicationModal(page) {
  const headerButton = page.locator(".btn-new-bewerbung");
  if (await headerButton.isVisible()) {
    await headerButton.click();
  } else {
    await page.locator(".user-menu > button").click();
    await page.locator(".user-dropdown-new").click();
  }
  await expect(page.locator(".modal")).toBeVisible();
}

/** Öffnet das ⋮-Menü einer Karte (gefunden über die Position). */
export async function openCardMenu(page, position) {
  const card = cards(page).filter({ hasText: position });
  await card.getByRole("button", { name: "Menü öffnen" }).click();
  return card;
}
