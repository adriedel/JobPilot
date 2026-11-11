# Tests & Staging-Umgebung

## Überblick

```
feature/xyz ──PR──► staging ──PR──► main
     │                 │              │
 Vercel-Preview    feste Test-URL   Produktion
 (pro PR)          + Staging-Backend (bewerbungstracker.com)
                   + Staging-DB
```

| Was | Wo | Läuft wann |
|---|---|---|
| Funktions-, Smoke- & Screenshot-Tests (Demo-Modus, ohne Backend) | `.github/workflows/qa.yml` | jeder PR, Push auf `main`/`staging` |
| Smoke-Tests gegen echte Umgebung (Frontend + Backend + DB) | `.github/workflows/staging-e2e.yml` | nach jedem Vercel-Preview-/Staging-Deployment |

Die Testumgebung (Staging) nutzt **eigenes Backend + eigene Datenbank** – Testdaten landen nie in Produktion.

---

## Tests lokal ausführen

Alle Befehle im Ordner `JobPilot/frontend`:

```bash
npm run test:e2e            # alle Tests (baut automatisch im Demo-Modus)
npm run test:e2e:ui         # interaktiver Modus: Tests anklicken, Schritt für Schritt zusehen
npm run test:e2e:report     # letzten HTML-Report öffnen
```

Gegen eine laufende Umgebung (nur `@smoke`-Tests):

```bash
PLAYWRIGHT_BASE_URL=https://staging.bewerbungstracker.com npm run test:e2e
```

> **Windows/macOS:** Die Screenshot-Tests (`@visual`) werden dort automatisch übersprungen, weil
> Schriften anders gerendert werden – die Referenzbilder sind Linux-Renderings (wie in CI).
> Screenshots lokal prüfen geht über Docker (siehe unten).

### Test-Dateien (`frontend/tests/e2e/`)

| Datei | Inhalt | Tags |
|---|---|---|
| `dashboard.spec.js` | Anzeigen, Suchen, Filtern, Sortieren, Anlegen, Bearbeiten, Status ändern, Löschen, Sprache, Dark Mode | `@demo` |
| `visual.spec.js` | Screenshot-Vergleich: Dashboard hell/dunkel, Modal | `@demo @visual` |
| `smoke.spec.js` | Seite lädt, Login-Seite, Backend `/health`, Login + Bewerbung anlegen/löschen (nur mit Test-Account) | `@smoke` |
| `fixtures.js` | gemeinsames Setup (Sprache, feste Uhrzeit, JS-Fehler → Test rot) + Helfer | – |

Jeder Test läuft zweimal: **desktop** (1440×900) und **mobile** (Pixel 7).

### Screenshots nach Design-Änderungen aktualisieren

Wenn du das Layout **absichtlich** änderst, schlägt `visual.spec.js` fehl. Dann (Docker muss laufen):

```bash
npm run test:visual:update
```

Das erzeugt die Bilder in `tests/e2e/__screenshots__/` im Linux-Container neu. Bilder anschauen,
dann mitcommitten. Bei einem fehlgeschlagenen CI-Lauf zeigt der Report (Artifact `playwright-report`)
*Erwartet / Tatsächlich / Diff* nebeneinander.

> Die Playwright-Version ist fest gepinnt (`@playwright/test` in `package.json`) und muss mit dem
> Container-Image in `qa.yml` und `staging-e2e.yml` übereinstimmen. Beim Update alle drei Stellen ändern.

---

## Staging einrichten (einmalig)

### 1. Datenbank – Neon (kostenlos)

1. Auf [neon.tech](https://neon.tech) Projekt `jobpilot-staging` anlegen (Region: Frankfurt / `eu-central-1`).
2. Connection String kopieren, muss auf `?sslmode=require` enden:
   `postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`
3. Tabellen müssen **nicht** angelegt werden – das Backend erstellt sie beim Start selbst.

### 2. Git-Branch `staging`

```bash
git switch main && git pull
git switch -c staging && git push -u origin staging
```

### 3. Backend – Render (Free-Instanz)

*New → Web Service* → gleiches Repo, dieselben Einstellungen wie das Produktions-Backend, aber:

| Einstellung | Wert |
|---|---|
| Name | `jobpilot-backend-staging` |
| Branch | `staging` |
| Root Directory | `JobPilot/backend` |
| Instance Type | **Free** |

Environment Variables:

| Variable | Wert |
|---|---|
| `DATABASE_URL` | Neon-Connection-String aus Schritt 1 |
| `JWT_SECRET` | **neuer** zufälliger Wert (nicht der von Produktion!) |
| `FRONTEND_URL` | `https://staging.bewerbungstracker.com` (für Links in E-Mails) |
| `FRONTEND_URLS` | `https://staging.bewerbungstracker.com` |
| `FRONTEND_ORIGIN_REGEX` | `^https://jobpilot-[a-z0-9-]+-<vercel-team>\.vercel\.app$` (erlaubt PR-Previews; `<vercel-team>` aus einer Preview-URL ablesen) |
| `RESEND_API_KEY`, `FROM_EMAIL` | wie Produktion (damit Registrierung/Passwort-Reset testbar sind) |
| `CLOUDINARY_*` | wie Produktion (oder eigener Cloudinary-Account) |

Danach im Browser `https://jobpilot-backend-staging.onrender.com/health` öffnen → `{"status":"ok"}`.

> Free-Instanzen schlafen nach 15 Min. ohne Aufrufe; der erste Aufruf dauert dann ~1 Minute.
> Upgrade auf *Starter* (~7 $/Monat) jederzeit möglich, falls das stört.

### 4. Frontend – Vercel

Im bestehenden Vercel-Projekt:

1. **Settings → Environment Variables:**
   `VITE_API_URL` = `https://jobpilot-backend-staging.onrender.com/api`, Umgebung: **nur Preview**.
   (Production behält ihren Wert. `VITE_DEMO_MODE` in Preview **nicht** setzen.)
2. **Settings → Domains → Add:** `staging.bewerbungstracker.com` → bei *Git Branch* `staging` auswählen.
   Beim Domain-Anbieter den angezeigten CNAME-Eintrag anlegen.
   (Ohne eigene Domain geht auch die automatische URL `jobpilot-git-staging-<team>.vercel.app`.)
3. **Settings → Deployment Protection:** Damit andere die Test-URL ohne Vercel-Login öffnen können,
   *Vercel Authentication* für Previews deaktivieren – oder aktiv lassen und gezielt per *Shareable Link* teilen.
   Falls aktiv: *Protection Bypass for Automation* → Secret erzeugen (für GitHub, Schritt 6).

Nach Änderungen an Env-Variablen einmal neu deployen (Push auf `staging` oder *Redeploy*).

### 5. Test-Account auf Staging

Auf der Staging-URL einen Account registrieren (z.B. `e2e@deine-domain.de`), E-Mail bestätigen.
Dieser Account wird von den automatischen Smoke-Tests benutzt.

### 6. GitHub – Secrets & Variablen

*Repo → Settings → Secrets and variables → Actions:*

| Typ | Name | Wert |
|---|---|---|
| Variable | `STAGING_API_URL` | `https://jobpilot-backend-staging.onrender.com` |
| Secret | `E2E_USER_EMAIL` | Test-Account aus Schritt 5 |
| Secret | `E2E_USER_PASSWORD` | Passwort des Test-Accounts |
| Secret | `VERCEL_AUTOMATION_BYPASS_SECRET` | nur falls Deployment Protection aktiv |

> Der automatische Trigger von `staging-e2e.yml` wird erst aktiv, wenn der Workflow auf `main` liegt
> (GitHub liest `deployment_status`-Workflows immer aus dem Default-Branch).
> Vorher manuell testen: *Actions → Staging Smoke Tests → Run workflow*.

---

## Täglicher Ablauf

1. Feature-Branch von `staging` (oder `main`) erstellen, entwickeln.
2. PR öffnen → CI testet, Vercel baut eine Preview-URL → Smoke-Tests laufen gegen die Preview.
3. In `staging` mergen → `staging.bewerbungstracker.com` aktualisiert sich → Link an andere zum Testen schicken.
4. Passt alles: PR `staging` → `main` → Produktion.
