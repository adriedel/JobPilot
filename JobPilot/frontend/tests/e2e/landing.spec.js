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
