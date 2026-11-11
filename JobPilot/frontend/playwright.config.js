import { defineConfig, devices } from "@playwright/test";

/**
 * Zwei Betriebsarten:
 *
 * 1. Lokal / CI (Standard): baut das Frontend im Demo-Modus und startet `vite preview`.
 *    Kein Backend nötig – alle Daten liegen im localStorage.
 *
 * 2. Gegen eine laufende Umgebung (z.B. Staging): PLAYWRIGHT_BASE_URL setzen.
 *    Dann wird kein lokaler Server gestartet und nur Tests mit dem Tag @smoke laufen
 *    (die @demo-Tests setzen den Demo-Modus voraus).
 *
 *    PLAYWRIGHT_BASE_URL=https://staging.example.com npm run test:e2e
 */
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const PORT = 4173;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [["html", { open: "never" }], ["github"], ["list"]]
    : [["html", { open: "on-failure" }], ["list"]],

  // Gegen echte Umgebungen nur Smoke-Tests ausführen
  grep: externalBaseURL ? /@smoke/ : undefined,

  expect: {
    toHaveScreenshot: {
      // Kleine Anti-Aliasing-Unterschiede tolerieren
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
    },
  },

  // Screenshots plattformunabhängig ablegen – Referenzbilder werden immer
  // im Linux-Docker-Container erzeugt (siehe `npm run test:visual:update`).
  snapshotPathTemplate:
    "{testDir}/__screenshots__/{testFilePath}/{arg}-{projectName}{ext}",

  use: {
    baseURL: externalBaseURL || `http://localhost:${PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "de-DE",
    timezoneId: "Europe/Berlin",
    // Vercel "Deployment Protection" für automatisierte Tests umgehen
    // (Vercel → Settings → Deployment Protection → Protection Bypass for Automation)
    extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      ? {
          "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
          "x-vercel-set-bypass-cookie": "true",
        }
      : undefined,
  },

  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],

  webServer: externalBaseURL
    ? undefined
    : {
        command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        env: {
          VITE_DEMO_MODE: "true",
          VITE_API_URL: "http://localhost:3001/api",
        },
      },
});
