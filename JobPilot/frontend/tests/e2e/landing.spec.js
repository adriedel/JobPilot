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

test.describe("Landing Hero @smoke", () => {
  test("zeigt die helle Illustration im hellen Modus", async ({ page }) => {
    await openLanding(page);
    const visual = page.locator(".landing-hero-illustration");
    await expect(visual).toBeVisible();
    await expect(visual).toHaveAttribute("src", "/paperplane-light.svg");
    await expect(page.locator(".landing-preview-card")).toHaveCount(0);
  });

  test("wechselt mit dem Dark Mode auf die dunkle Illustration", async ({ page }) => {
    await openLanding(page);
    await page.getByRole("button", { name: "Dark mode" }).click();
    await expect(page.locator(".landing-hero-illustration")).toHaveAttribute(
      "src",
      "/paperplane-dark.svg",
    );
  });

  test("Illustration ist geladen und hat feste Maße", async ({ page }) => {
    await openLanding(page);
    const visual = page.locator(".landing-hero-illustration");
    await expect(visual).toHaveAttribute("width", "560");
    await expect(visual).toHaveAttribute("height", "480");
    const loaded = await visual.evaluate((img) => img.complete && img.naturalWidth > 0);
    expect(loaded).toBe(true);
  });
});
