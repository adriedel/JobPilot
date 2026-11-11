# JobPilot – Bewerbungstracker

JobPilot ist eine im Rahmen des DevOps-Projekts entwickelte Full-Stack-Webanwendung zur strukturierten Verwaltung und Nachverfolgung von Bewerbungsprozessen. Ziel des Systems ist es, Bewerbungen zentral zu erfassen, Bearbeitungsstände transparent abzubilden und eine übersichtliche Grundlage für die persönliche Organisation des Bewerbungsmanagements bereitzustellen.

<img width="1281" height="741" alt="JobPilot Screenshot" src="https://github.com/user-attachments/assets/8410d3c9-23c1-4af2-831c-264c41951100" />

---

## 📌 Projektstatus

Das Projekt ist über eine reine CRUD-Anwendung hinausgewachsen und umfasst inzwischen einen vollständigen Nutzerkreislauf von Registrierung über Verwaltung bis Administration:

- **Kernfunktionalität**: Registrierung, Login, geschützte Routen, Dashboard, CRUD-Funktionalität und statistische Auswertung
- **Konto- & Sicherheitsfunktionen**: E-Mail-Verifizierung, „Passwort vergessen“-Flow, Profilverwaltung, Avatar-Upload und -Customizer
- **Admin-Bereich**: Rollenverwaltung und Benutzerübersicht für Administrator:innen
- **Komfortfunktionen**: Mehrsprachigkeit (DE/EN), PDF-Export, Sortierung, Cross-Tab-Synchronisation und ein Browser-Bookmarklet zum schnellen Erfassen von Bewerbungen direkt von Jobportalen aus
- **Containerisiert und deploybar**: Docker- und CI/CD-Setup vorhanden; produktiv erreichbar über Vercel (Frontend) und Render (Backend)

---

## ✨ Funktionen

- **Login & Registrierung** mit JWT-basierter Authentifizierung
- **E-Mail-Verifizierung** nach der Registrierung sowie erneuter Versand des Bestätigungslinks
- **Passwort vergessen / zurücksetzen** über einen zeitlich befristeten, gehashten Reset-Token
- **Geschütztes Dashboard** für persönliche Bewerbungsdaten
- **Status-Tracking** über den gesamten Bewerbungs-Trichter (In Planung → Beworben → Nächste Stufe → Angenommen/Abgelehnt/Keine Antwort)
- **CRUD-Funktionen** zum Erstellen, Bearbeiten und Löschen von Bewerbungen
- **Suche, Filter & Sortierung** nach Firma, Position, Standort, Datum oder Status
- **Statistiken** zur schnellen Übersicht
- **PDF-Export** der eigenen Bewerbungsübersicht (lokal im Browser erzeugt, inkl. Speichern-Dialog über die File System Access API, wo verfügbar)
- **Profilverwaltung**: Name, E-Mail und Passwort ändern, Profilbild hochladen (Cloudinary) oder individuellen DiceBear-Avatar zusammenstellen
- **Admin-Bereich** zur Verwaltung von Benutzerrollen und Accounts (nur für Rolle `admin`)
- **Mehrsprachigkeit** (Deutsch/Englisch) via i18next
- **Bookmarklet „Quick Add“**: Bewerbungen direkt von LinkedIn, Indeed, Stepstone, XING oder der Arbeitsagentur per Klick in einem Popup anlegen, ohne die Jobseite zu verlassen
- **Cross-Tab-Synchronisation**: Änderungen (z. B. über das Bookmarklet-Popup) aktualisieren automatisch alle offenen Tabs
- **Dark Mode** mit Speicherung der Benutzereinstellung
- **Responsive UI** für Desktop und Mobile
- **Demo-Modus für Docker**, damit die Anwendung ohne Login präsentiert werden kann

---

## 🧰 Tech Stack

| Bereich         | Technologie                                          |
| --------------- | ----------------------------------------------------- |
| Frontend        | `React 19`, `Vite 7`, `React Router 6`, `CSS3`         |
| Internationalisierung | `i18next`, `react-i18next`                       |
| PDF-Export       | `jsPDF`, `jspdf-autotable`, File System Access API     |
| Backend          | `Node.js`, `Express.js 5`                              |
| Datenbank        | `PostgreSQL`                                           |
| Auth             | `JWT`, `bcryptjs`                                      |
| Bildupload       | `Cloudinary`, `Multer`                                 |
| Transaktions-E-Mails | `Resend`                                           |
| DevOps           | `Docker`, `Docker Compose`, `GitHub Actions`           |
| Hosting          | `Vercel` (Frontend), `Render` (Backend)                |
| API-Doku         | `Swagger` (OpenAPI 3, `swagger-ui-express`)             |

---

## 📁 Projektstruktur

```text
Dev-Ops/
├── README.md
├── .github/
│   └── workflows/
│       ├── jobpilot-ci.yml   # Lint, Build, Docker-Images (+ Push zu GHCR)
│       ├── qa.yml            # Playwright-E2E- & Screenshot-Tests (Demo-Modus)
│       └── staging-e2e.yml   # Smoke-Tests gegen Vercel-Preview/Staging
└── JobPilot/
    ├── docker-compose.yml
    ├── backend/
    │   ├── Dockerfile
    │   ├── authController.js   # Register, Login, E-Mail-Verifizierung, Passwort-Reset
    │   ├── authMiddleware.js   # JWT-Prüfung
    │   ├── database.js         # DB-Pool & Schema-Initialisierung
    │   ├── emailService.js     # Transaktions-E-Mails via Resend
    │   ├── migrate.js          # Datenbankmigration
    │   ├── server.js           # Routen: Auth, Profil, Bewerbungen, Statistiken, Admin
    │   ├── swagger.yaml        # OpenAPI-Spezifikation
    │   └── package.json
    └── frontend/
        ├── Dockerfile
        ├── nginx.conf
        ├── vercel.json
        ├── package.json
        ├── public/
        │   ├── flags/           # Sprach-Icons (DE/EN)
        │   └── fonts/
        └── src/
            ├── App.jsx
            ├── main.jsx          # Routing
            ├── i18n.js
            ├── locales/          # de.json, en.json
            ├── components/
            │   ├── Header/
            │   ├── StatCards/
            │   ├── SearchBar/
            │   ├── BewerbungsCard/
            │   ├── BewerbungsModal/
            │   ├── DeleteConfirmModal/
            │   ├── LogoutConfirmModal/
            │   ├── Profile/
            │   └── ProtectedRoute.jsx
            ├── pages/
            │   ├── LandingPage.jsx
            │   ├── Login.jsx / Register.jsx
            │   ├── VerifyEmail.jsx / VerifyEmailConfirm.jsx
            │   ├── ForgotPassword.jsx / ResetPassword.jsx
            │   ├── AdminPage.jsx
            │   ├── QuickAdd.jsx           # Zielseite des Bookmarklets
            │   └── BookmarkletInstall.jsx # Installationsanleitung fürs Bookmarklet
            ├── services/
            │   ├── api.js    # Bewerbungen/Statistiken
            │   └── auth.js   # Login/Profil
            └── utils/
                ├── constants.js
                ├── pdfExport.js
                └── syncBus.js   # Cross-Tab-Synchronisation
```

---

## 🚀 Anwendung starten

### Option A: Docker-Demo für Präsentation und Abgabe

Diese Variante ist insbesondere für die Vorführung im Rahmen der Lehrveranstaltung geeignet, da die Anwendung ohne zusätzliche lokale Konfigurationsschritte unmittelbar gestartet werden kann.

```bash
cd JobPilot
docker compose up --build
```

Danach ist die Anwendung erreichbar unter:

- **Frontend:** `http://localhost:8080`
- **Backend:** `http://localhost:3001`
- **Health-Check:** `http://localhost:3001/health`

> Für Bildupload (Cloudinary) und Transaktions-E-Mails (Resend) werden gültige API-Keys in `JobPilot/backend/.env` benötigt (siehe Abschnitt „Umgebungsvariablen" weiter unten). Ohne diese starten Login, Registrierung und CRUD-Funktionen weiterhin normal – lediglich Profilbild-Upload und der Versand von Verifizierungs-/Reset-Mails schlagen fehl.

### Einordnung des Demo-Modus im Docker-Setup

Für die **Präsentation und Bewertung** wurde bewusst ein **Demo-Modus** vorgesehen, damit die Anwendung unmittelbar eingesehen werden kann, **ohne zuvor einen Registrierungs- oder Loginprozess durchlaufen zu müssen**. Dies erleichtert die Vorführung der bereits implementierten Kernfunktionalitäten erheblich.

Gleichzeitig bleibt der **vollständige Login-/Register-Prozess** fester Bestandteil des Projekts, da die Anwendung **perspektivisch für die tatsächliche eigene Nutzung vorgesehen** ist. Die Authentifizierung wurde somit nicht entfernt, sondern durch einen optionalen Präsentationsmodus ergänzt.

#### Demo-Modus aktivieren (für Präsentation)

In `JobPilot/docker-compose.yml` den folgenden Wert setzen:

```yml
VITE_DEMO_MODE: "true"
```

Anschließend neu bauen und starten:

```bash
docker compose build frontend
docker compose up -d
```

> Die Anwendung öffnet sich dann direkt im Dashboard – ohne Registrierung oder Login.

#### Regulärer Betrieb mit Authentifizierung (Standard)

In `JobPilot/docker-compose.yml` ist standardmäßig der reguläre Betrieb aktiv:

```yml
VITE_DEMO_MODE: "false"
```

In diesem Modus wird bei Aufruf der Anwendung zunächst die Landing Page angezeigt. Ohne gültige Anmeldung wird der Zugriff auf das Dashboard durch einen geschützten Route-Guard verhindert. Eine Registrierung oder ein Login ist erforderlich.

> **Hinweis:** Da `VITE_DEMO_MODE` eine Build-Time-Variable ist, die beim `npm run build` fest in den JavaScript-Bundle eingeschrieben wird, muss nach jeder Änderung des Wertes zwingend `docker compose build frontend` ausgeführt werden, bevor die Änderung wirksam wird. Anschließend kann es erforderlich sein, im Browser einen Hard Refresh durchzuführen (**Cmd + Shift + R** auf macOS), um sicherzustellen, dass nicht eine ältere Version aus dem Browser-Cache geladen wird.

---

### Option B: Lokale Entwicklung ohne Docker

#### Voraussetzungen

- `Node.js` ab Version 18
- `npm`
- `Docker Desktop` oder eine laufende PostgreSQL-Instanz

#### 1. Backend starten

```bash
cd JobPilot/backend
npm install
cp .env.example .env   # Werte anpassen, siehe unten
npm run migrate
npm start
```

Das Backend läuft danach auf `http://localhost:3001`.

#### 2. Frontend starten

```bash
cd JobPilot/frontend
npm install
npm run dev
```

Das Frontend läuft danach auf `http://localhost:5173`.

#### 3. Optional: lokales Backend im Frontend verwenden

Falls du lokal gegen dein eigenes Backend testen möchtest, kannst du in der Datei `JobPilot/frontend/.env.local` setzen:

```env
VITE_API_URL=http://localhost:3001/api
```

Ist keine `VITE_API_URL` gesetzt, greift das Frontend standardmäßig auf das produktive Backend unter Render zurück.

---

## 🔧 Umgebungsvariablen

### Backend (`JobPilot/backend/.env`, siehe `.env.example`)

| Variable                | Beschreibung                                                          |
| ------------------------ | --------------------------------------------------------------------- |
| `DATABASE_URL`           | Verbindungsstring zur PostgreSQL-Datenbank                             |
| `JWT_SECRET`             | Signaturschlüssel für JWTs                                             |
| `PORT`                   | Port des Backends (Standard: `3001`)                                   |
| `CLOUDINARY_CLOUD_NAME`  | Cloudinary-Account für Profilbild-Upload                               |
| `CLOUDINARY_API_KEY`     | siehe oben                                                             |
| `CLOUDINARY_API_SECRET`  | siehe oben                                                             |
| `RESEND_API_KEY`         | API-Key für den Versand von Transaktions-E-Mails über [Resend](https://resend.com) |
| `FROM_EMAIL`             | Absenderadresse (muss zu einer bei Resend verifizierten Domain passen) |
| `FRONTEND_URL`           | Basis-URL des Frontends, wird für Links in E-Mails verwendet           |
| `FRONTEND_URLS`          | Kommagetrennte Liste zusätzlich erlaubter CORS-Origins                 |

### Frontend (Build-Time-Variablen)

| Variable         | Beschreibung                                                      |
| ----------------- | ------------------------------------------------------------------ |
| `VITE_API_URL`     | Basis-URL der Backend-API (Standard-Fallback: produktives Render-Backend) |
| `VITE_DEMO_MODE`   | `"true"` öffnet die App direkt im Dashboard ohne Login (siehe unten) |

---

## 🔐 Demo-Modus vs. echter Login

| Einsatz                          | Einstellung              | Verhalten                                                         |
| --------------------------------- | ------------------------- | ------------------------------------------------------------------ |
| **Präsentation / Bewertung**      | `VITE_DEMO_MODE="true"`   | App öffnet direkt das Dashboard, kein Login erforderlich           |
| **Regulärer Betrieb (Standard)**  | `VITE_DEMO_MODE="false"`  | Landing Page → Registrierung/Anmeldung (inkl. E-Mail-Verifizierung) → Dashboard (mit JWT) |

> Da es sich um eine **Build-Time-Variable** handelt, muss nach jeder Änderung ein Rebuild des Frontend-Images erfolgen: `docker compose build frontend`. Ein anschließender Hard Refresh im Browser (Cmd + Shift + R) stellt sicher, dass keine veraltete Version aus dem Browser-Cache geladen wird.

---

## 🔖 Bookmarklet „Quick Add“

Unter `/bookmarklet` findet sich eine Installationsanleitung für ein Browser-Bookmarklet, das auf unterstützten Jobportalen (LinkedIn, Indeed, Stepstone, XING, Arbeitsagentur) Position, Firma und Link automatisch ausliest und in einem kompakten Popup (`/quick-add`) zur schnellen Übernahme in JobPilot anbietet. Änderungen aus dem Popup werden per `syncBus` automatisch mit allen offenen JobPilot-Tabs synchronisiert.

---

## 🌍 Mehrsprachigkeit

Die Benutzeroberfläche ist über `i18next`/`react-i18next` vollständig auf Deutsch und Englisch verfügbar. Die Übersetzungen liegen in `JobPilot/frontend/src/locales/` (`de.json`, `en.json`); die Sprachumschaltung ist über das Header-Menü erreichbar.

---

## 🔄 CI/CD-Pipeline

Für das Projekt sind drei GitHub-Actions-Workflows eingerichtet:

### `jobpilot-ci.yml`

1. Checkout & Node.js-Setup
2. Installation der Frontend-Dependencies
3. Linting des Frontends (ESLint)
4. Production Build des Frontends
5. Syntax-Check des Backends
6. Build der Docker-Images für Frontend und Backend
7. Optional: **Push der Container-Images nach GHCR** bei Push auf `main`

### `qa.yml`

Läuft bei Push auf `main`/`staging` sowie bei Pull Requests: baut das Frontend im Demo-Modus und führt die Playwright-Tests (Funktion, Smoke, Screenshot-Vergleich; Desktop + Handy) im offiziellen Playwright-Container aus. Der HTML-Report wird als Artifact hochgeladen.

### `staging-e2e.yml`

Startet automatisch, sobald Vercel ein Preview-/Staging-Deployment fertig hat, und führt die `@smoke`-Tests gegen genau diese URL aus (inkl. echtem Staging-Backend). Manuell über *Actions → Run workflow* mit beliebiger URL startbar.

Details zu Tests und Testumgebung: [JobPilot/TESTING.md](JobPilot/TESTING.md)

Damit werden zentrale DevOps-Schritte wie **Build, Qualitätssicherung und Bereitstellung der Laufzeitumgebung** in strukturierter Form automatisiert abgedeckt.

---

## 🌐 API-Übersicht

Vollständig und interaktiv dokumentiert ist die API über Swagger unter:

```text
http://localhost:3001/api-docs
```

### Auth

| Methode | Endpoint                          | Auth | Beschreibung                              |
| ------- | ---------------------------------- | ---- | ------------------------------------------ |
| `POST`  | `/api/auth/register`               | –    | Benutzer registrieren, versendet Verifizierungs-Mail |
| `POST`  | `/api/auth/login`                  | –    | Benutzer anmelden (erfordert verifizierte E-Mail) |
| `GET`   | `/api/auth/verify-email`           | –    | E-Mail-Adresse per Token bestätigen         |
| `POST`  | `/api/auth/resend-verification`    | –    | Verifizierungs-Mail erneut anfordern        |
| `POST`  | `/api/auth/forgot-password`        | –    | Passwort-Reset-Mail anfordern               |
| `POST`  | `/api/auth/reset-password`         | –    | Passwort mit gültigem Reset-Token setzen    |
| `GET`   | `/api/auth/me`                     | JWT  | Aktuellen Benutzer abrufen                  |
| `PUT`   | `/api/auth/profile`                | JWT  | Namen aktualisieren                         |
| `PUT`   | `/api/auth/profile/email`          | JWT  | E-Mail-Adresse ändern                       |
| `PUT`   | `/api/auth/profile/password`       | JWT  | Passwort ändern                             |
| `POST`  | `/api/auth/profile/image`          | JWT  | Profilbild hochladen (Cloudinary)           |
| `DELETE`| `/api/auth/profile/image`          | JWT  | Profilbild löschen                          |
| `PUT`   | `/api/auth/profile/avatar-config`  | JWT  | DiceBear-Avatar-Konfiguration speichern     |

### Bewerbungen (jeweils nur für den eingeloggten Benutzer)

| Methode  | Endpoint               | Auth | Beschreibung               |
| -------- | ----------------------- | ---- | --------------------------- |
| `GET`    | `/api/bewerbungen`      | JWT  | Alle Bewerbungen abrufen (optional `?status=`) |
| `GET`    | `/api/bewerbungen/:id`  | JWT  | Einzelne Bewerbung abrufen  |
| `POST`   | `/api/bewerbungen`      | JWT  | Neue Bewerbung erstellen    |
| `PUT`    | `/api/bewerbungen/:id`  | JWT  | Bewerbung aktualisieren     |
| `DELETE` | `/api/bewerbungen/:id`  | JWT  | Bewerbung löschen           |

### Statistiken

| Methode | Endpoint           | Auth | Beschreibung                      |
| ------- | ------------------- | ---- | ----------------------------------- |
| `GET`   | `/api/statistiken`  | JWT  | Status-Zähler und Gesamtübersicht  |

### Admin (nur für Rolle `admin`)

| Methode  | Endpoint                     | Auth        | Beschreibung                            |
| -------- | ----------------------------- | ----------- | ----------------------------------------- |
| `GET`    | `/api/admin/users`            | JWT + Admin | Alle Benutzer inkl. Bewerbungsanzahl abrufen |
| `PATCH`  | `/api/admin/users/:id/role`   | JWT + Admin | Rolle eines Benutzers ändern (`user`/`admin`) |
| `DELETE` | `/api/admin/users/:id`        | JWT + Admin | Benutzer löschen                          |

---

## 🗃️ Datenmodell

### `users`

| Feld                                     | Beschreibung                                      |
| ------------------------------------------ | --------------------------------------------------- |
| `email`, `password_hash`, `name`           | Grunddaten des Accounts                             |
| `role`                                     | `user` (Standard) oder `admin`                      |
| `profile_image_url`                        | Cloudinary-URL des hochgeladenen Profilbilds         |
| `avatar_config`                            | Gespeicherte Konfiguration des DiceBear-Avatars (JSON) |
| `email_verified_at`, `email_verification_token(_expires)` | E-Mail-Verifizierungsstatus              |

### `bewerbungen`

Die zentrale Tabelle `bewerbungen` enthält unter anderem folgende Felder:

- `position`, `firma`, `status`, `datum`
- `standort`, `ansprechpartner`, `notizen`
- `bewerbungsart`, `startdatum`, `link`
- `gehalt`, `waehrung`
- `user_id` (Fremdschlüssel auf `users`)

Dadurch können Bewerbungen **benutzerbezogen getrennt gespeichert** und im regulären Anwendungsbetrieb authentifiziert verwaltet werden.

### `password_reset_tokens`

Speichert gehashte, zeitlich befristete Tokens für den „Passwort vergessen“-Flow (`user_id`, `token_hash`, `expires_at`).

---

## 🛠️ Nützliche Skripte

### Backend

```bash
npm start        # Startet den Express-Server
npm run dev      # Startet den Server mit Nodemon
npm run migrate  # Führt die Datenbankmigration aus
```

### Frontend

```bash
npm run dev      # Startet den Vite-Dev-Server
npm run build    # Erstellt den Production-Build
npm run lint     # Prüft den Code mit ESLint
npm run preview  # Zeigt den Production-Build lokal an
```

---

## ✅ Fazit

JobPilot verbindet eine vollständige Bewerbungsverwaltung (inkl. E-Mail-Verifizierung, Passwort-Reset, Profil- und Rollenverwaltung) mit Komfortfunktionen wie Mehrsprachigkeit, PDF-Export und einem Bookmarklet zur schnellen Erfassung von Bewerbungen direkt aus Jobportalen. Ergänzt wird dies durch ein **strukturiertes Docker-Setup** und eine **CI/CD-Pipeline**, wodurch das Projekt reproduzierbar demonstriert, produktiv betrieben (Vercel/Render) und zielgerichtet weiterentwickelt werden kann.

Für die Abgabe ist insbesondere hervorzuheben:

- Die Anwendung ist **containerisiert** und damit reproduzierbar ausführbar
- Sie lässt sich mittels **Docker Compose** mit geringem Aufwand starten
- Eine **CI/CD-Pipeline** für Build-, Prüf- und Deployment-Prozesse ist eingerichtet
- Der **Login-Prozess inklusive E-Mail-Verifizierung** bleibt für die reale Nutzung erhalten, während der **Demo-Modus** die Präsentation ohne vorherige Registrierung ermöglicht
