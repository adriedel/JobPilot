# App-Vorschau Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Abschnitt mit echter Dashboard-Vorschau im Browserfenster unter dem Landing-Hero.

**Architecture:** Neue Komponente `AppPreview` rendert die bestehenden Dashboard-Komponenten mit exportierten Demo-Daten in einem `inert`-Container. Die Landing Page bindet sie zwischen Hero und Features ein.

**Tech Stack:** React 19, plain CSS, Playwright 1.65.0

**Spec:** `docs/superpowers/specs/2026-11-11-app-preview-design.md`

## Global Constraints

- Branch `feature/app-preview`, Commits enden mit `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Dashboard-Komponenten werden nicht verändert.
- Tests laufen gegen einen Nicht-Demo-Build: `PLAYWRIGHT_BASE_URL=http://localhost:4190`. Zusätzlich muss die Demo-Suite (`npx playwright test --grep-invert @visual`) ohne Fehler laufen.

### Task 1: Demo-Daten exportieren

**Files:** Modify `JobPilot/frontend/src/services/api.js`

- [ ] `const DEMO_SEED_DATA` → `export const DEMO_SEED_DATA`, `function buildDemoStats` → `export function buildDemoStats`
- [ ] `npm run lint` und die Demo-Suite laufen lassen. Erwartet: keine Fehler.
- [ ] Commit „Export demo seed data and stats builder“

### Task 2: AppPreview-Komponente (TDD)

**Files:** Create `src/components/AppPreview/AppPreview.jsx`, `AppPreview.css`; Modify `src/pages/LandingPage.jsx`, `tests/e2e/landing.spec.js`

- [ ] Tests ergänzen (siehe Spec, Abschnitt Tests) und gegen den Nicht-Demo-Build laufen lassen. Erwartet: FAIL, weil `.app-preview` fehlt.
- [ ] Komponente bauen: Abschnitt, Fenster mit Titelleiste, `inert`-Inhalt mit `Header`, `StatCards`, `SearchBar`, 3 × `BewerbungsCard`.
- [ ] In `LandingPage.jsx` nach `</section>` des Heros `<AppPreview />` einfügen.
- [ ] Tests erneut ausführen. Erwartet: PASS. Dazu die Demo-Suite mit 0 Fehlern.
- [ ] Sichtprüfung hell, dunkel und mobile (Screenshots), Prüfung auf horizontales Scrollen.
- [ ] Commit „Add app preview section to landing page“, dann Push.
