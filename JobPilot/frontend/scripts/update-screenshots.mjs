/**
 * Erzeugt die Referenz-Screenshots für die visuellen Tests neu – im offiziellen
 * Playwright-Linux-Container, damit sie exakt zu CI (ubuntu) passen.
 * Unter Windows/macOS gerenderte Screenshots würden in CI wegen anderer
 * Schriftdarstellung sonst immer fehlschlagen.
 *
 *   npm run test:visual:update
 *
 * Voraussetzung: Docker läuft.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const { version } = JSON.parse(
  readFileSync(new URL("../node_modules/@playwright/test/package.json", import.meta.url)),
);
const image = `mcr.microsoft.com/playwright:v${version}-noble`;
const cwd = process.cwd();

console.log(`→ Erzeuge Screenshots in ${image}`);

const result = spawnSync(
  "docker",
  [
    "run", "--rm", "--ipc=host",
    // eigenes node_modules im Container (Linux-Binaries), Projekt-Dateien gemountet
    "-v", `${cwd}:/work`,
    "-v", "/work/node_modules",
    "-w", "/work",
    "-e", "CI=1",
    image,
    "sh", "-c",
    "npm ci --no-audit --no-fund && npx playwright test --grep @visual --update-snapshots",
  ],
  { stdio: "inherit" },
);

process.exit(result.status ?? 1);
