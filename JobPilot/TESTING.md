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
PLAYWRIGHT_BASE_URL=https://jobpilot-git-staging-adriedels-projects.vercel.app npm run test:e2e
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
| `FRONTEND_ORIGIN_REGEX` | `^https://jobpilot-[a-z0-9-]+-adriedels-projects\.vercel\.app$` (erlaubt PR-Previews) |
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

### 5. Test-Accounts & Beispieldaten auf Staging

Das Staging-Backend legt Test-Accounts automatisch beim Start an (`backend/seed.js`).
Dafür im Render-Staging-Service zwei Env-Variablen setzen:

| Variable | Wert |
|---|---|
| `SEED_DEMO_DATA` | `true` |
| `SEED_PASSWORD` | Passwort für alle Test-Accounts (mind. 8 Zeichen) |

| Account | Inhalt | Wofür |
|---|---|---|
| `demo@jobpilot.test` | 12 Bewerbungen, alle Status, 3 Währungen | normales Durchklicken, Filter, PDF-Export |
| `leer@jobpilot.test` | keine Bewerbungen | Empty State, erste Bewerbung anlegen |
| `admin@jobpilot.test` | Rolle **admin**, 2 Bewerbungen | Admin-Seite |
| `e2e@jobpilot.test` | keine Bewerbungen | automatische Smoke-Tests (nicht von Hand benutzen) |

Alle Accounts sind bereits verifiziert, es werden keine E-Mails verschickt.

- **Bestehende Daten bleiben erhalten:** Accounts werden nur angelegt, wenn sie fehlen, Bewerbungen nur,
  wenn der Account leer ist. Was beim Testen geändert wird, bleibt also.
- **Zurücksetzen:** `SEED_DEMO_DATA` auf `reset` stellen → Render startet neu und setzt die vier
  Accounts (Passwort, Rolle, Bewerbungen) auf den Ausgangszustand. **Danach wieder auf `true` stellen**,
  sonst wird bei jedem Neustart (auch nach dem Aufwachen der Free-Instanz) zurückgesetzt.
- Eigene, normal registrierte Accounts werden nie angefasst.
- **Auf Produktion niemals setzen.**

### 6. GitHub – Secrets & Variablen

*Repo → Settings → Secrets and variables → Actions:*

| Typ | Name | Wert |
|---|---|---|
| Variable | `STAGING_API_URL` | `https://jobpilot-backend-staging.onrender.com` |
| Secret | `E2E_USER_EMAIL` | `e2e@jobpilot.test` |
| Secret | `E2E_USER_PASSWORD` | derselbe Wert wie `SEED_PASSWORD` in Render |
| Secret | `VERCEL_AUTOMATION_BYPASS_SECRET` | nur falls Deployment Protection aktiv |

> `staging-e2e.yml` startet automatisch nach jedem Vercel-Deployment, das nicht Produktion ist.
> Manuell gegen eine beliebige URL: *Actions → Staging Smoke Tests → Run workflow*.
> Landet der Test auf `vercel.com/login`, ist die Deployment Protection noch aktiv (siehe Schritt 4.3).

---

## Täglicher Ablauf

1. Feature-Branch von `staging` (oder `main`) erstellen, entwickeln.
2. PR öffnen → CI testet, Vercel baut eine Preview-URL → Smoke-Tests laufen gegen die Preview.
3. In `staging` mergen → `staging.bewerbungstracker.com` aktualisiert sich → Link an andere zum Testen schicken.
4. Passt alles: PR `staging` → `main` → Produktion.
