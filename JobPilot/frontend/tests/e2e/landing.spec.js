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

  test("liegt am Handy halbtransparent hinter Headline und Text", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openLanding(page);
    const visual = page.locator(".landing-hero-visual");

    await expect(visual).toHaveCSS("position", "absolute");
    await expect(visual).toHaveCSS("opacity", "0.3");
    await expect(visual).toHaveCSS("pointer-events", "none");

    // Text liegt darüber und beginnt oben im Hero (Flieger nimmt keinen Platz ein)
    const content = page.locator(".landing-hero-content");
    await expect(content).toHaveCSS("z-index", "1");
    const [heroBox, contentBox] = await Promise.all([
      page.locator(".landing-hero").boundingBox(),
      content.boundingBox(),
    ]);
    expect(contentBox.y - heroBox.y).toBeLessThan(80);

    // Buttons bleiben klickbar
    await page.getByRole("link", { name: "Funktionen ansehen" }).click();
    await expect(page).toHaveURL(/#funktionen$/);
  });

  test("steht auf dem Desktop unverändert neben dem Text", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openLanding(page);
    const visual = page.locator(".landing-hero-visual");
    await expect(visual).toHaveCSS("position", "static");
    await expect(visual).toHaveCSS("opacity", "1");
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

  test("Login-Hinweis steht unter den beiden Buttons", async ({ page }) => {
    await openLanding(page);
    const hint = page.locator(".landing-hero-login");
    await expect(hint).toHaveText("Schon ein Konto? Anmelden");

    // eigene Zeile unterhalb der Buttons, nicht Teil der Button-Zeile
    await expect(page.locator(".landing-hero-actions .landing-hero-login")).toHaveCount(0);
    const [actions, hintBox] = await Promise.all([
      page.locator(".landing-hero-actions").boundingBox(),
      hint.boundingBox(),
    ]);
    expect(hintBox.y).toBeGreaterThanOrEqual(actions.y + actions.height);

    await hint.getByRole("link", { name: "Anmelden" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("Sprache lässt sich auf Englisch umstellen", async ({ page }) => {
    await openLanding(page);
    await page.locator(".landing-nav .language-toggle").click();

    await expect(page.locator(".landing-hero-title")).toHaveText("Your job search, organized");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("#funktionen .landing-feature-title")).toHaveText([
      "Status tracking",
      "Notes & contacts",
      "Statistics",
      "Bookmarklet & PDF export",
    ]);
    await expect(page.locator(".landing-cta-box h2")).toHaveText("Ready for a clearer overview?");
    // Vorschau im iframe zieht mit
    await expect(
      page.frameLocator(".app-preview-frame").locator(".header-title"),
    ).toHaveText("Application Tracker");

    // Auswahl bleibt nach dem Neuladen erhalten
    await page.reload();
    await expect(page.locator(".landing-hero-title")).toHaveText("Your job search, organized");
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

  test("Navigations-Links scrollen weich", async ({ page }) => {
    await openLanding(page);
    await expect(page.locator("html")).toHaveCSS("scroll-behavior", "smooth");
  });

  test("ohne weiches Scrollen bei reduzierter Bewegung", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openLanding(page);
    await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
  });

  test("CTA-Box am Ende", async ({ page }) => {
    await openLanding(page);
    const cta = page.locator(".landing-cta-box");
    await expect(cta.getByRole("heading", { name: "Bereit für mehr Überblick?" })).toBeVisible();
    await expect(cta.getByRole("button", { name: "Jetzt kostenlos starten" })).toBeVisible();
  });
});

test.describe("Landing App-Vorschau @smoke", () => {
  const preview = (page) => page.locator(".app-preview");
  const frame = (page) => page.frameLocator(".app-preview-frame");

  test("zeigt das Dashboard mit den Demo-Bewerbungen im Fenster", async ({ page }) => {
    await openLanding(page);
    await expect(preview(page)).toBeVisible();
    await expect(preview(page).locator(".app-preview-url")).toHaveText("bewerbungstracker.com");
    await expect(
      preview(page).getByRole("img", { name: "Vorschau des JobPilot-Dashboards" }),
    ).toBeVisible();

    const cards = frame(page).locator(".bewerbung-card");
    await expect(cards).toHaveCount(3);
    for (const firma of ["SAP", "adidas", "BMW Group"]) {
      await expect(cards.filter({ hasText: firma })).toHaveCount(1);
    }
  });

  test("zeigt auf Tablets das Desktop-Layout", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await openLanding(page);
    // Im iframe ist das Dashboard 1260px breit → alle 7 Statistik-Karten in einer Zeile
    const tops = await frame(page)
      .locator(".stat-card")
      .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
    expect(tops).toHaveLength(7);
    expect(new Set(tops).size).toBe(1);
  });

  test("ist nicht bedienbar", async ({ page }) => {
    await openLanding(page);
    const iframe = preview(page).locator(".app-preview-frame");
    await expect(iframe).toHaveAttribute("tabindex", "-1");
    await expect(iframe).toHaveCSS("pointer-events", "none");
    await expect(frame(page).locator(".preview-page")).toHaveAttribute("inert", "");

    // Klick auf die Position eines Kartenmenüs darf nichts öffnen
    const box = await frame(page).locator(".card-menu-button").first().boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(frame(page).locator(".dropdown-item")).toHaveCount(0);
  });

  test("folgt dem Dark Mode der Landing Page", async ({ page }) => {
    await openLanding(page);
    const html = frame(page).locator("html");
    await expect(html).not.toHaveClass(/dark-mode/);
    await page.getByRole("button", { name: "Dark mode" }).click();
    await expect(html).toHaveClass(/dark-mode/);
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

  for (const width of [390, 768, 1024, 1440]) {
    test(`erzeugt bei ${width}px keine horizontale Scrollleiste`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await openLanding(page);
      await expect(preview(page)).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
