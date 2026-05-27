
# Patientendaten in der Cloud teilen (öffentlich lesbar, Login zum Bearbeiten)

## Ziel
Jeder, der den Link öffnet, sieht dieselben Patienten, Sessions und Slide-Decks und kann den kompletten Workflow durchklicken. Bearbeiten/Anlegen/Löschen geht nur eingeloggt. Deine aktuell lokal gespeicherten Daten werden einmalig in die Cloud hochgeladen.

## Wichtiger Hinweis zur Verschlüsselung
Der bisherige lokale Krypto-Layer (Master-Passwort, AES-GCM im Browser) funktioniert nicht mehr, sobald Daten geteilt werden — andere Browser haben den Schlüssel nicht. Für „jeder mit Link sieht alles" werden Klarnamen/Notizen in der Cloud im Klartext liegen. **Bitte nur mit Demo-/Fake-Patientendaten benutzen, keine echten Patienten.**

## Was gebaut wird

### 1. Cloud-Schema (Lovable Cloud)
Drei Tabellen, die die bisherigen Dexie-Tabellen 1:1 spiegeln:
- `patients` — alle Felder aus `Patient` (id als TEXT Primary Key = Pseudonym wie `P-2026-001`, plus `name`, `notes`, `anamnese_profile jsonb`, `curriculum_*` Felder usw.)
- `sessions` — alle Felder aus `SessionEntry` inkl. `kv_documentation`, `schema_analysis`, `session_kpis`, `transcript` als jsonb/text
- `decks` — Slide-Decks mit `slides jsonb`

Zugriff:
- **SELECT**: `USING (true)` für `anon` + `authenticated` → jeder sieht alles
- **INSERT/UPDATE/DELETE**: nur `authenticated`
- GRANTs entsprechend gesetzt

### 2. Auth
- Email+Passwort Login (Standard), Google Sign-In
- Neue Seite `/login` mit Sign-up + Sign-in
- `AppShell` zeigt oben rechts „Login" / „Logout" + aktuellen User
- `LockScreen` (Master-Passwort) entfällt — wird durch normalen Auth-Flow ersetzt

### 3. Data-Layer-Umbau (`src/lib/db.ts` → `src/lib/cloudDb.ts`)
- Neuer Cloud-Repo-Layer mit denselben Funktionen wie heute Dexie (`getPatient`, `listPatients`, `upsertPatient`, `listSessions`, …)
- `useLiveQuery(dexie)` wird durch React-Query + Supabase-Realtime ersetzt, damit Updates live durchschlagen
- Schreib-Funktionen prüfen `supabase.auth.getUser()` und werfen `"Bitte einloggen"` wenn nicht authentifiziert; UI versteckt Bearbeiten-Buttons in dem Fall
- Krypto-Felder (`encName`, `encNotes`) werden zu normalen Text-Spalten (`name`, `notes`); `crypto.ts` Aufrufe entfernt

### 4. Einmal-Migration lokal → Cloud
- Neuer Button in **Settings → „Lokale Daten in Cloud übernehmen"** (nur sichtbar wenn eingeloggt und lokale Daten existieren)
- Liest alle Dexie-Records, entschlüsselt mit aktuellem lokalem Schlüssel, `upsert`t in die Cloud-Tabellen, markiert `localStorage.therapilot.migrated = true`
- Beim ersten Aufruf nach Deploy automatisch ein Hinweis-Toast „Du hast X lokale Patienten — jetzt übernehmen?"

### 5. Seiten-Anpassungen
Alle `useLiveQuery(() => db.xxx…)` Aufrufe in
`PatientsList`, `PatientDetail`, `PatientEdit`, `SessionsList`, `SessionEdit`, `SlidesList`, `SlideEditor`, `SlideNew`, `SlidePresent`, `TherapieverlaufDashboard`, `AnamneseProfilePanel`, `Dashboard`
werden auf den neuen Cloud-Repo-Hook umgestellt. Bearbeiten-/Speichern-Buttons werden deaktiviert + Tooltip „Login erforderlich" wenn `user == null`.

## Technische Details
- `id`-Felder bleiben Text-Pseudonyme — kein UUID-Wechsel, damit Slide-Deck-Referenzen, URLs und Curriculum-Mapping unverändert weiterlaufen
- Realtime via `supabase.channel('public:patients').on('postgres_changes', …)`
- Edge Functions (`ai-assist`) bleiben unverändert
- Dexie-Code bleibt vorerst im Repo (nur für die Einmal-Migration), wird in Folge-Iteration entfernt

## Was NICHT in diesem Schritt passiert
- Keine User-spezifischen Daten („mein Patient" vs. „dein Patient") — alle eingeloggten Nutzer teilen sich denselben Datenpool. Das passt zur Demo-Absicht.
- Keine Rollen (Admin/Editor) — kann später nachgezogen werden
- Keine erneute Verschlüsselung der Cloud-Daten
