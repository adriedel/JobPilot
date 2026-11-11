# App-Vorschau auf der Landing Page (Vorhaben C)

Datum: 2026-11-11 · Branch: `feature/app-preview` (von `feature/hero-svg`) → PR nach `staging`

## Ziel

Unter dem Hero zeigt die Landing Page eine Vorschau des echten Dashboards in einem Browserfenster, angelehnt an immofynn.ai. Besucher sehen, wie JobPilot aussieht, bevor sie sich registrieren.

## Entscheidungen

- **Platzierung:** eigener Abschnitt direkt unter dem Hero, vor den Features. Der Papierflieger bleibt im Hero.
- **Umsetzung:** echte Komponenten (`Header`, `StatCards`, `SearchBar`, `BewerbungsCard`) mit Demo-Daten, keine Nachbildung und kein Screenshot.

## Aufbau

- `src/components/AppPreview/AppPreview.jsx` + `AppPreview.css`. Die Landing Page bindet sie mit einer Zeile ein.
- **Abschnitt:**
  - Überschrift „So sieht dein Dashboard aus“.
  - Darunter `.app-preview-window` über die volle Inhaltsbreite (max. 1200px).
- **Fenster:**
  - Titelleiste mit drei Punkten und der Adresse `bewerbungstracker.com`.
  - Radius 16px, feine Linie, weicher Schatten.
  - Der Inhalt endet mit einem Ausblend-Verlauf in der Fensterfarbe, die maximale Höhe ist begrenzt.
- **Inhalt (`.app-preview-content`):**
  - `Header`, `StatCards`, `SearchBar` und die ersten drei Demo-Bewerbungen als `BewerbungsCard`.
  - Gerendert in der echten Breite, ohne `transform: scale`, weil die Komponenten über Viewport-Media-Queries reagieren.
- **Daten:**
  - `DEMO_SEED_DATA` wird aus `src/services/api.js` exportiert und nicht kopiert.
  - Die Statistik wird mit derselben Logik wie im Demo-Modus berechnet. Dafür wird `buildDemoStats` ebenfalls exportiert.
- **Nicht interaktiv:**
  - Der Inhalt bekommt das Attribut `inert` und ist damit weder per Maus noch per Tastatur erreichbar und für Screenreader ausgeblendet.
  - Das Fenster hat `role="img"` und `aria-label="Vorschau des JobPilot-Dashboards"`.
  - Alle Handler sind No-ops.
- **Theme und Sprache:** Beide folgen automatisch (gleiche CSS-Variablen und `t()`).

## Responsiv

- **Desktop:** das Dashboard-Layout mit drei Karten nebeneinander, Höhe begrenzt auf 720px.
- **Handy (≤ 600px):** das mobile Layout der Komponenten, Höhe begrenzt auf 900px, Seitenränder 16px.

## Tests (`tests/e2e/landing.spec.js`, @smoke)

- Der Abschnitt ist sichtbar und enthält drei `.bewerbung-card` mit SAP, adidas und BMW Group.
- Der Inhalt hat das Attribut `inert`, und ein Klick auf „Menü öffnen“ öffnet kein Dropdown.
- Die Vorschau erzeugt keine horizontale Scrollleiste (desktop und mobile).

## Nicht Teil von C

Mehrere Ansichten oder Tabs, Animationen im Fenster und Änderungen an den Dashboard-Komponenten selbst.
