import { test, expect } from "./fixtures";

// Die Landing Page ist nur ohne Demo-Modus erreichbar (Staging, lokal über
// PLAYWRIGHT_BASE_URL). Im Demo-Build leitet "/" aufs Dashboard um.
async function openLanding(page) {
  await page.goto("/");
  // Die Umleitung passiert clientseitig nach dem Laden – erst warten, bis
  // entweder die Landing Page oder das Dashboard gerendert ist.
  await page.locator(".landing-hero-title, .header-title").first().waitFor();
  test.skip(page.url().includes("/dashboard"), "Demo-Modus leitet auf das Dashboard um");
}

const light = (page) => page.locator(".landing-hero-illustration--light");
const dark = (page) => page.locator(".landing-hero-illustration--dark");

test.describe("Landing Hero @smoke", () => {
  test("zeigt die helle Illustration im hellen Modus", async ({ page }) => {
    await openLanding(page);
    await expect(light(page)).toHaveAttribute("src", "/paperplane-light.svg");
    await expect(dark(page)).toHaveAttribute("src", "/paperplane-dark.svg");
    await expect(light(page)).toHaveCSS("opacity", "1");
    await expect(dark(page)).toHaveCSS("opacity", "0");
    await expect(page.locator(".landing-preview-card")).toHaveCount(0);
  });

  test("blendet beim Wechsel in den Dark Mode über", async ({ page }) => {
    await openLanding(page);
    await expect(light(page)).toHaveCSS("transition-property", /opacity/);
    await expect(light(page)).toHaveCSS("transition-duration", "0.4s");

    await page.getByRole("button", { name: "Dark mode" }).click();
    await expect(dark(page)).toHaveCSS("opacity", "1");
    await expect(light(page)).toHaveCSS("opacity", "0");
  });

  test("ohne Animation bei reduzierter Bewegung", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openLanding(page);
    await expect(light(page)).toHaveCSS("transition-duration", "0s");
  });

  test("beide Varianten sind geladen und haben feste Maße", async ({ page }) => {
    await openLanding(page);
    for (const img of [light(page), dark(page)]) {
      await expect(img).toHaveAttribute("width", "560");
      await expect(img).toHaveAttribute("height", "480");
      await expect
        .poll(() => img.evaluate((el) => el.complete && el.naturalWidth > 0))
        .toBe(true);
    }
  });
});

test.describe("Landing Aufbau @smoke", () => {
  test("Hero ohne Badge und Statistik-Band, zwei Aktionen", async ({ page }) => {
    await openLanding(page);
    await expect(page.locator(".landing-hero-title")).toHaveText(
      "Dein Bewerbungsprozess organisiert",
    );
    await expect(page.locator(".landing-hero-badge")).toHaveCount(0);
    await expect(page.locator(".landing-stats")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Kostenlos starten/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Funktionen ansehen" })).toBeVisible();
  });

  test("Funktionen zeigen nur echte Features", async ({ page }) => {
    await openLanding(page);
    await expect(page.locator("#funktionen .landing-feature-title")).toHaveText([
      "Status-Tracking",
      "Notizen & Kontakte",
      "Statistiken",
      "Bookmarklet & PDF-Export",
    ]);
    await expect(page.getByText(/Erinnerung/i)).toHaveCount(0);
  });

  test("drei Schritte zum Start", async ({ page }) => {
    await openLanding(page);
    await expect(page.locator("#so-funktionierts .landing-step-title")).toHaveText([
      "Konto anlegen",
      "Bewerbungen eintragen",
      "Status aktuell halten",
    ]);
  });

  test("FAQ lässt sich aufklappen", async ({ page }) => {
    await openLanding(page);
    const items = page.locator("#faq details");
    await expect(items).toHaveCount(4);
    await expect(items.first()).toHaveAttribute("open", "");

    const deleteQuestion = items.filter({ hasText: "Kann ich mein Konto löschen?" });
    await expect(deleteQuestion.locator("p")).toBeHidden();
    await deleteQuestion.locator("summary").click();
    await expect(deleteQuestion.locator("p")).toBeVisible();
    await expect(page.getByText("Wo werden meine Daten gespeichert?")).toHaveCount(0);
  });

  test("Navigation springt zu den Abschnitten", async ({ page, isMobile }) => {
    test.skip(isMobile, "Links sind auf kleinen Bildschirmen ausgeblendet");
    await openLanding(page);
    for (const [name, id] of [
      ["Funktionen", "funktionen"],
      ["So funktioniert's", "so-funktionierts"],
      ["FAQ", "faq"],
    ]) {
      await page.locator(".landing-nav-links").getByRole("link", { name }).click();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      await expect(page.locator(`#${id}`)).toBeInViewport();
    }
  });

  for (const width of [320, 360, 375]) {
    test(`kein seitliches Scrollen auf ${width}px breiten Handys`, async ({ page }) => {
      await page.setViewportSize({ width, height: 740 });
      await openLanding(page);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("CTA-Box am Ende", async ({ page }) => {
    await openLanding(page);
    const cta = page.locator(".landing-cta-box");
    await expect(cta.getByRole("heading", { name: "Bereit für mehr Überblick?" })).toBeVisible();
    await expect(cta.getByRole("button", { name: "Jetzt kostenlos starten" })).toBeVisible();
  });
});

test.describe("Landing App-Vorschau @smoke", () => {
  const preview = (page) => page.locator(".app-preview");

  test("zeigt das Dashboard mit den Demo-Bewerbungen im Fenster", async ({ page }) => {
    await openLanding(page);
    await expect(preview(page)).toBeVisible();
    await expect(preview(page).locator(".app-preview-url")).toHaveText("bewerbungstracker.com");
    await expect(
      preview(page).getByRole("img", { name: "Vorschau des JobPilot-Dashboards" }),
    ).toBeVisible();

    const cards = preview(page).locator(".bewerbung-card");
    await expect(cards).toHaveCount(3);
    for (const firma of ["SAP", "adidas", "BMW Group"]) {
      await expect(cards.filter({ hasText: firma })).toHaveCount(1);
    }
  });

  test("ist nicht bedienbar", async ({ page }) => {
    await openLanding(page);
    const content = preview(page).locator(".app-preview-content");
    await expect(content).toHaveAttribute("inert", "");

    // Klick auf die Position eines Kartenmenüs darf nichts öffnen
    const box = await content.locator(".card-menu-button").first().boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(preview(page).locator(".dropdown-item")).toHaveCount(0);
  });

  test("richtet sich beim Hovern auf und hebt sich an", async ({ page, isMobile }) => {
    test.skip(isMobile, "Hover-Effekt nur auf Geräten mit Maus");
    await openLanding(page);
    const win = preview(page).locator(".app-preview-window");

    // Ruhezustand: gekippt (3D-Matrix)
    await expect(win).toHaveCSS("transform", /^matrix3d\(/);

    await win.hover();
    // Aufgerichtet und 8px angehoben: reine 2D-Verschiebung
    await expect(win).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, -8)");
  });

  test("bleibt bei reduzierter Bewegung gerade", async ({ page, isMobile }) => {
    test.skip(isMobile, "Hover-Effekt nur auf Geräten mit Maus");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openLanding(page);
    await expect(preview(page).locator(".app-preview-window")).toHaveCSS("transform", "none");
  });

  test("bleibt auf Touch-Geräten gerade", async ({ page, isMobile }) => {
    test.skip(!isMobile, "nur im mobilen Projekt");
    await openLanding(page);
    await expect(preview(page).locator(".app-preview-window")).toHaveCSS("transform", "none");
  });

  test("erzeugt keine horizontale Scrollleiste", async ({ page }) => {
    await openLanding(page);
    await expect(preview(page)).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
