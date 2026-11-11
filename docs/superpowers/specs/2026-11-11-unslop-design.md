# Unslop-Durchgang für JobPilot (Vorhaben A)

Datum: 2026-11-11 · Branch: `feature/unslop` → PR nach `staging`

Teil einer Reihe aus drei Vorhaben:

- **A: dieses Dokument.** Unslop-Durchgang über das ganze Frontend.
- **B:** Hero-Visual als SVG (`public/paperplane-light.svg` / `-dark.svg`).
- **C:** App-Vorschau („Sneak Peek“) auf der Landing Page, angelehnt an immofynn.ai.

B und C bauen auf den Tokens aus A auf und bekommen eigene Specs.

Die Regeln stammen aus [unslop](https://github.com/heydamir/unslop) von Damir Sokolovsky (CC BY 4.0). Sie werden angewendet, der Skill wird nicht installiert.

## Ziel

Die Oberfläche soll nicht mehr nach Vorlage oder KI aussehen. Funktionen, Inhalte und die Reihenfolge der Abschnitte bleiben. Jede Größe, Farbe und jedes Wort wird bewusst gewählt.

## Prüfung (Ausgangslage)

Leicht bis mittel betroffen. Es gibt keine Emojis, kein Lila und keine Ausrufezeichen. Gefunden wurde:

- **Landing:**
  - Pill-Badge über der Headline.
  - Statistik-Band mit Füllzahlen („100 %“, „5+“, „24/7“).
  - Drei gleiche Feature-Karten mit Icon-Kacheln und vagen Texten.
  - Du und Sie gemischt.
  - Zu viele Buttons (Nav: Anmelden + Registrieren, Hero: zwei Buttons).
  - Zentriert gestapelter CTA-Block.
  - Mockup mit Google, Microsoft und Apple.
- **Farbe:**
  - `--brand-gradient` auf Buttons und der Gesamt-Karte.
  - Blaue Glow-Schatten unter Buttons.
  - Gitter und `radial-gradient` auf den Auth-Seiten.
  - 56 Hex-Farben.
  - Text in reinem Schwarz.
- **Schrift:**
  - Iosevka Bold für Überschriften (30 Stellen mit 700 oder mehr).
  - Großbuchstaben-Labels mit Sperrung (Profil, Admin).
  - 35 verschiedene Schriftgrößen.
- **Dashboard:**
  - 7 gleiche Stat-Karten mit farbigen Icon-Kacheln.
  - Laute Status-Pills über die volle Kartenbreite.
- **Bewegung:**
  - 37 Hover-Effekte mit Vergrößern oder Anheben.
  - Zweimal `transition: all`.

## Richtung (freigegeben)

- **Produkt:** JobPilot hilft Menschen auf Jobsuche, jede Bewerbung mit Status, Terminen und Notizen an einem Ort zu verfolgen.
- **Charakter:** ordentlich, ruhig, ermutigend.
- **Welt:** Schreibtisch mit Bewerbungsmappe (Papier, Karteikarten, Kugelschreibertinte). Die Landing Page ist leicht warm getönt, die App bleibt neutral grau.
- **Akzent:** Navy `#1e3a8a` als einzige Akzentfarbe („Tinte“), ohne Verläufe.
- **Highlights:** die App-Vorschau auf der Landing Page (Vorhaben C) und die Status-Verteilung im Dashboard.
- **Erkennungsdetail:** Stufen-Leiste auf jeder Bewerbung (geplant → beworben → weiter → Zusage).
- **Schrift:** Iosevka bleibt (Markenzeichen), nur in Medium. Hierarchie entsteht über Größe und Farbe.

## 1. Tokens (`src/App.css`)

Die bestehenden Variablennamen bleiben erhalten, damit alle Komponenten weiter funktionieren. Sie bekommen neue Werte, fehlende Tokens kommen dazu.

### Neutrale Töne

| Token | Hell | Dunkel |
|---|---|---|
| `--bg-app` | `#fafafa` | `#141415` |
| `--bg-landing` (neu) | `#f7f4ee` | `#161513` |
| `--bg-surface` | `#ffffff` | `#19191b` |
| `--bg-input`, `--bg-hover` | `#f4f4f5` | `#232325` |
| `--border` | `rgba(23,23,23,0.08)` | `rgba(237,237,237,0.08)` |
| `--border-strong` (neu, Inputs) | `rgba(23,23,23,0.14)` | `rgba(237,237,237,0.14)` |
| `--text-primary` | `#171717` | `#ededed` |
| `--text-secondary`, `--text-label` | `#525252` | `#a1a1a6` |
| `--text-muted` | `#737373` | `#85858b` |

`--border-subtle` zeigt auf `--border`.

### Akzent

| Token | Hell | Dunkel |
|---|---|---|
| `--accent` (neu) | `#1e3a8a` | `#9db4f0` |
| `--accent-hover` (neu) | `#1e40af` | `#b8c9f5` |
| `--on-accent` (neu, Text auf Akzent) | `#ffffff` | `#141415` |
| `--btn-primary-bg` (neu) | `#1e3a8a` | `#ededed` |
| `--btn-primary-text` (neu) | `#ffffff` | `#141415` |
| `--link-color` | `#1e3a8a` | `#9db4f0` |

`--blue` und `--blue-hover` zeigen auf `--accent`. `--brand-gradient` wird zu `var(--accent)` und ist damit einfarbig. Im nächsten Schritt werden die Verwendungen auf `--accent` umgestellt.

### Semantik und Status

- Positiv `#16a34a` / `#4cc38a`, Negativ `#dc2626` / `#e5484d` (hell / dunkel).
- Die Status-Farben `--status-*-accent` bleiben, leicht gedämpft. Sie erscheinen nur als Punkt, in der Stufen-Leiste und in der Status-Verteilung.
- `--status-*-bg` und `--status-*-border` werden nicht mehr verwendet und entfernt, sobald keine Verwendung mehr übrig ist.

### Schrift, Radius, Abstände, Tiefe, Bewegung

- `--font-body` und `--font-display`: beide Iosevka-Medium. `--font-display` bleibt als Alias.
- Schriftgrößen-Skala: 12, 13, 14, 16, 18, 20, 28, 36, 56 (Tokens `--fs-12` … `--fs-56`). Gewichte 400 und 500, maximal 600.
- Zahlen: `font-variant-numeric: tabular-nums`.
- Radien: `--radius-sm 6`, `--radius-md 8`, `--radius-lg 12`, `--radius-xl 16`. Verschachtelte Radien: innen = außen − Padding, mindestens 4.
- Abstände: 4px-Raster mit den Stufen 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96.
- Schatten hell: `--shadow-sm 0 1px 2px rgba(0,0,0,.05)`, `--shadow-float 0 8px 24px rgba(0,0,0,.06)`. Dunkel: keine Schatten, Tiefe über Flächenstufen und Linien. Modals behalten einen neutralen weichen Schatten.
- Bewegung: `--ease cubic-bezier(0.22,1,0.36,1)`, `--dur-fast 150ms`, `--dur-menu 200ms`, `--dur-enter 300ms`.

## 2. Seiten und Komponenten

Klassennamen und DOM-Struktur bleiben, soweit Playwright-Selektoren sie nutzen:

- `.bewerbung-card`, `.card-firma`, `.card-menu-button`, `.dropdown-item(-delete)`
- `.status-dropdown-trigger`, `.sort-dropdown-trigger`, `.sort-direction-toggle`
- `.btn-new-bewerbung`, `.user-menu`, `.user-dropdown-new`, `.language-toggle`
- `.modal`, `.btn-submit`, `.delete-confirm-button`, `.delete-modal-message`
- `.header-title`, `.auth-button`, `#email`, `#password`, `.empty-state`

### Landing (`LandingPage.jsx/.css`)

- **Navigation:** Logo, Theme-Umschalter (klein und leise), „Anmelden“ als Textlink, „Registrieren“ als einziger Button.
- **Hero:**
  - Kein Badge.
  - Neue Headline ohne Punkt: „Jede Bewerbung im Blick, vom Entwurf bis zur Zusage“ (EN: „Every application in view, from draft to offer“). Ein anderer Wortlaut ist nur eine Textänderung und kann jederzeit nachgezogen werden.
  - Subline in Du-Form, sekundäre Farbe, höchstens 36rem breit.
  - Primär „Kostenlos starten“, daneben „Ich habe schon ein Konto“ als Textlink.
  - Darunter leise: „Kostenlos · Deutsch & Englisch · PDF-Export“.
  - Split-Layout: Text links, Visual rechts. Das Visual nimmt mindestens die halbe Breite ein und ist vertikal zentriert.
- **Hero-Visual:** Das bestehende Mockup bleibt als Platzhalter, nur mit Tokens (keine bunten Kacheln, keine Markennamen). Es wird in B durch das SVG ersetzt.
- **Statistik-Band:** entfernt.
- **Features:**
  - Linksbündige Überschrift, Du-Form.
  - Nur echte Funktionen: Status in 6 Stufen, Suche/Filter/Sortierung, PDF-Export, Quick-Add per Bookmarklet.
  - Line-Icons in Textfarbe, keine Icon-Kacheln.
  - Raster mit unterschiedlichen Breiten statt drei gleicher Karten.
- **CTA-Block:** eine Zeile und ein Button.
- **Footer:** Tokens.

### Auth-Seiten (`Auth.css`, Login/Register/Forgot/Reset/Verify)

- Gitter, `radial-gradient` und farbiger Kartenrand oben entfallen.
- Karte `--bg-surface` mit Linie, Radius 16.
- Kleineres Logo.
- Button flach in `--btn-primary-bg`.

### Dashboard

- **Header:** „Neue Bewerbung“ ist der einzige Primär-Button. Bookmarklet und PDF-Export werden sekundär (erhöhte Fläche mit Linie). Der Logo-Kachel-Verlauf entfällt.
- **StatCards → Status-Verteilung (Highlight):**
  - Eine Karte mit Gesamtzahl (36, tabular).
  - Ein gestapelter Balken mit 6 Segmenten in den Status-Farben, die Breite proportional zur Anzahl. Bei 0 Bewerbungen eine leere Spur.
  - Eine Legende mit Punkt, Label und Anzahl.
  - Komponente und Props bleiben (`stats`), die Darstellung ändert sich.
- **BewerbungsCard:**
  - `.status-badge` wird zu Punkt + Label (Klasse bleibt).
  - Neu ist die Stufen-Leiste `.status-track` mit 4 Segmenten für in_planung, beworben, stufe_weiter und angenommen. Erreichte Segmente sind in der Status-Farbe, die übrigen in `--border`.
  - Bei `abgelehnt` und `keine_antwort` sind die Segmente bis „beworben“ gefüllt (neutral), dazu kommt eine Endmarkierung in Rot bzw. Grau.
  - Meta-Angaben (Datum, Gehalt) in `--text-muted`, Zahlen tabular.
- **SearchBar, BewerbungsModal, Delete- und Logout-Modal:** Tokens, Radien, Fokusringe. Modals blenden mit einer kurzen Fade-und-Rise-Animation ein (300 ms, 8px), kein Slide-Up.

### Profil, Admin, QuickAdd, Bookmarklet

- Großbuchstaben-Labels werden normal geschrieben, ohne Sperrung.
- Tokens, Radien und Buttons wie oben.
- Keine Verläufe.

### Texte (`locales/de.json`, `en.json`, Landing-Texte im JSX)

- Konsequente Du-Form.
- Kein Punkt am Ende von Labels, Buttons und Überschriften.
- Keine Hype-Wörter.
- Englische Texte werden parallel angepasst.

## 3. Bewegung

- Alle Hover-Effekte mit `scale` oder `translateY` werden entfernt. Hover ist ein Farb- oder Flächenwechsel, beim Klick verkleinert sich ein Button leicht (`scale(0.98)`).
- `transition: all` wird ersetzt durch benannte Eigenschaften (color, background-color, border-color, opacity, transform).
- Keine Endlos-Animationen. Der Lade-Spinner im Profil bleibt, weil er einen echten Zustand zeigt.

## 4. Umsetzung

- Branch `feature/unslop` von `staging`, ein PR nach `staging`.
- Ein Commit pro Schritt:
  1. Tokens
  2. Abstände
  3. Farbe (Verläufe, Glows, Hex auf Tokens)
  4. Icons
  5. Texte (DE/EN)
  6. Schrift (Gewichte, Skala, Großbuchstaben)
  7. Landing-Layout
  8. Status-Verteilung + Stufen-Leiste
  9. Details (Radien, Buttons, Fokus)
  10. Bewegung
  11. Neue Screenshot-Referenzbilder
- Nach jedem Schritt: `npm run lint` und `npx playwright test` (funktional). Geprüfte Texte (zum Beispiel „Bewerbungstracker“, Placeholder) werden nur geändert, wenn die Texte sich ändern, dann im selben Commit.
- Am Ende: `npm run test:visual:update` (Docker), die neuen Bilder anschauen und committen.
- Prüfung gegen die unslop-Checkliste vor dem PR, inklusive Dark Mode und Handy-Ansicht.

## Nicht Teil von A

- Hero-SVG (B) und App-Vorschau (C).
- Neue Funktionen, Backend-Änderungen, Umbenennung des Produkts.
