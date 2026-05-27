# Plan: Demo-Workflow „Mittelgradige Depression (F32.1)" seeden

## Ziel
Ein Klick erzeugt einen vollständigen Testpatienten plus 4 Sitzungen mit allen Analyse-Artefakten (Transkript, KV-Doku, CBT-Extraktion, KPIs). Damit ist der komplette Workflow ohne AI-Calls (Guthaben aufgebraucht) im Preview sicht- und klickbar – Patientenliste → Detail → Sessions → Therapieverlauf → Dashboard.

## Warum so
- Die AI-Pipeline (ai-assist) ist aktuell blockiert (402, AI-Guthaben). Demo-Daten müssen daher **statisch vorgefertigt** sein, nicht zur Laufzeit generiert.
- Alle relevanten Datentypen (`Patient`, `SessionEntry`, `KVDocumentation`, `SchemaAnalysisResult`, `SessionKPIs`, `AnamneseProfile`) sind in `src/lib/*Types.ts` bereits definiert – wir füllen sie nur korrekt.
- Schreibwege gehen über Dexie; `cloudSync` pusht automatisch zu Supabase (wenn eingeloggt). Damit ist die Demo später auch für andere Besucher via Link sichtbar.

## Umfang

### 1. Neue Datei `src/lib/demoSeed.ts`
Enthält die komplette statische Demo:
- **1 Patient** „P-2026-001" – 34 J., Lehrerin, alleinlebend, F32.1, Hauptsymptome (Antriebslosigkeit, Schlafstörung, Grübeln, Anhedonie), dysfunktionale Grundannahmen („Ich bin nicht gut genug", „Niemand braucht mich"), Therapieziele, `anamneseProfile` (gefüllt für Sessions 1–4 sichtbar).
- **4 SessionEntries** (Datum: vor 4, 3, 2, 1 Wochen), je ~50 min, mit:
  - **`transcript`**: realistischer deutscher Fließtext-Dialog (Therapeutin / Patientin), ca. 600–900 Wörter pro Session, glaubwürdiger langsamer Verlauf.
  - **`rawNotes`** + **`structured`** (VT-Verlauf): kurze Therapeut:innen-Notiz.
  - **`kvDocumentation`**: 6-Punkte-Struktur (Aktuelle Symptomatik / Inhalte / Interventionen / Verlauf & Einschätzung / Vereinbarungen / Risikoabklärung), KV-neutral.
  - **`kvExtraction`** + **`kvValidation`** (score ~90, leere errors).
  - **`schemaAnalysis`**: negative core beliefs, adaptive beliefs, cognitive distortions, Verhalten (Aktivierung/Vermeidung), Emotionsregulation, Risiko – Verlauf zeigt: negative ↓, adaptive ↑, Aktivierung ↑, Risiko stabil niedrig.
  - **`sessionKPIs`**: PHQ-9-Proxy 18→16→13→11, BDI-II 27→24→20→17, HAM-D 21→19→16→14, Cognitive Shift, Behavioral Activation, Social Engagement, Emotion Regulation, Functioning steigend; Risk 1→1→0→0.
  - **`homework`** und **`nextFocus`** pro Sitzung.

Alle Strings deutsch, KV-konform, sachlich, ohne Dramatisierung, keine Diagnoseänderung.

### 2. UI-Trigger in `src/pages/Settings.tsx`
Neuer Abschnitt **„Demo-Workflow"** mit Button **„Demo-Patient + 4 Sessions seeden"**:
- prüft, ob `P-2026-001` schon existiert → wenn ja: Toast „bereits vorhanden" + Option „überschreiben".
- ruft `seedDemoPatient()` aus `demoSeed.ts` → `db.patients.put(...)` + `db.sessions.bulkPut(...)`.
- cloudSync-Hook pusht automatisch zu Supabase, sodass Demo auch für nicht eingeloggte Besucher des Links sichtbar ist (vorausgesetzt User ist beim Seeden eingeloggt – RLS-Insert ist auth-only).
- Toast „Demo geladen → Patientenliste öffnen" mit Link zu `/patienten/P-2026-001`.

### 3. Keine weiteren Änderungen
- Keine neuen Tabellen, keine Migration, keine RLS-Änderung.
- Keine Edge-Function-Calls, kein AI-Verbrauch.
- Bestehende Detail-, Verlauf- und Dashboard-Seiten rendern die Daten automatisch (sie lesen schon aus Dexie).

## Out of Scope (bewusst)
- Echte Audio-Dateien: nur Transkript-Text (Audio-Upload ist Live-Feature, nicht Teil der Demo-Seed).
- Slide-Decks: nicht Teil der Anforderung.
- KPI-Score-Berechnung zur Laufzeit – Werte sind fix vorbelegt, damit Verlauf reproduzierbar bleibt.

## Ergebnis für den Nutzer
Nach Klick auf den Seed-Button:
- `/patienten` zeigt „P-2026-001"
- Detailseite zeigt 4 Sessions
- Jede Session-Detailseite zeigt KV-Doku, CBT-Extraktion, KPIs
- Therapieverlauf-Dashboard zeigt 7 KPI-Trendlinien Session 1→4
- Insights-Liste zeigt die geforderten Therapist Insights
- Über den geteilten Preview-Link sehen Mitlesende denselben Workflow (öffentlich lesbar).
