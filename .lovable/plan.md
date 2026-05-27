## Ziel

Das **Anamnese-Profil IST das Patientenprofil**. Die bisherige Trennung (Stammdaten links, Anamnese im Session-Tab) wird aufgelöst. Therapieverlauf bleibt klar getrennt — Anamnese = wer ist die Person, Therapieverlauf = wie entwickelt sich die Therapie.

## Struktur danach

```text
/patienten/:id  (PatientDetail)
├── Tab "Anamnese-Profil"       ← NEU, ersetzt linke Stammdaten-Karte
│   └── AnamneseProfilePanel mit allen Bögen 1–3
│       + Auto-Fill-Button "Aus Sessions 1–7 aufbauen"
├── Tab "Therapieverlauf"        ← NEU auf Patient-Ebene
│   └── TherapieverlaufDashboard (KPIs + Pattern Engine)
├── Tab "Sessions"               ← bisherige Sessions-Liste
└── Tab "Slide-Decks"            ← bisherige Decks-Liste
```

Im **SessionEdit** wird der Anamnese-Tab entfernt (gehört aufs Patientenprofil, nicht in eine einzelne Session). Stattdessen kommt dort nur ein kleiner Button **„Diese Session ins Anamnese-Profil einfließen lassen"** in der Kopfzeile / im KV-Tab.

## Patient-Profil neu strukturiert nach Anamnese

`PatientDetail.tsx` wird umgebaut zu:

1. **Header**: Pseudonym, Therapieansatz, Status, Buttons (Bearbeiten / Neue Session)
2. **Tabs** (statt 2-Spalten-Layout):
   - **Anamnese-Profil** (Default): rendert `AnamneseProfilePanel` mit den Karten-Blöcken:
     - Kindheit · Eltern · Schule · Beruf · Sexualität & Partnerschaften
     - Interessen & Hobbys · Ressourcen
     - Aktuelle Lebenssituation (Wohnen / Arbeit / Beziehungen / Kinder / Eltern / Krankheiten)
     - Symptomanamnese (akt. Symptomatik / Beginn & Auslöser / Traumatisierungen / Behandlungen / Medikation / Problemlöseversuche)
     - Psychischer Befund · Persönlichkeitsstruktur · Vorläufige Diagnose
     - Oben: Stammdaten-Mini-Block (Pseudonym, Alter, Geschlecht, Therapiebeginn, Diagnose-Tags, Ziele) — die alten Felder bleiben editierbar, sind aber jetzt Teil des Profils
   - **Therapieverlauf**: `TherapieverlaufDashboard` mit `patientId={id}`
   - **Sessions**: bisherige Liste
   - **Slide-Decks**: bisherige Liste

## Auto-Fill aus Sessions 1–7

Im `AnamneseProfilePanel` (auf Patient-Ebene, ohne `currentSessionId`):

- Großer Primär-Button **„Profil aus Sessions 1–7 automatisch aufbauen"**
  - Lädt alle Sessions des Patienten, sortiert nach Datum, nimmt die ersten 7 mit Transkript
  - Iteriert sequenziell: pro Session `ai-assist` Task `anamnese-extract` mit dem jeweils gemergten Profil als Input
  - Zeigt Progress („Session 3/7 wird verarbeitet…")
  - Speichert Endergebnis in `patient.anamneseProfile` + `anamneseUpdatedAt`
- Sekundär-Button **„Nur fehlende Felder ergänzen"** (überschreibt vorhandene Texte nicht)
- Pro Feld bleibt: manueller Edit + Quellen-Popover (Session-Nr. + Zitat) + Konfidenz-Badge
- Hinweis-Banner wenn Patient >7 Sessions hat: „Anamnese-Phase abgeschlossen — weitere Sessions fließen optional ein"

## Dateien

**Geändert**
- `src/pages/PatientDetail.tsx` — komplettes Re-Layout zu Tabs, Anamnese als Default-Ansicht
- `src/components/anamnese/AnamneseProfilePanel.tsx` — Modus „Patient-Level" ergänzen: ohne `currentSessionId` kommt der Sammel-Auto-Fill-Button („1–7 aufbauen") statt des „aus dieser Session extrahieren"-Buttons; Progress-UI ergänzen
- `src/pages/SessionEdit.tsx` — Tab „Anamnese" entfernen, durch dezenten Button „→ ins Anamnese-Profil einfließen" ersetzen (öffnet Patient-Profil oder triggert Extract direkt)

**Unverändert**
- `src/lib/anamneseTypes.ts`, `src/lib/db.ts`, `supabase/functions/ai-assist/index.ts` (Schema + AI-Task sind schon korrekt)
- `TherapieverlaufDashboard` (wird nur an neuer Stelle eingebunden)

## Was bleibt getrennt

- **Anamnese-Profil** = statische, biografische Wahrheit über die Person (wird einmal in Sessions 1–7 aufgebaut, danach selten geändert)
- **Therapieverlauf** = dynamische KPI-Kurven & Pattern Engine über alle Sessions hinweg (PHQ-Severity, CDI, BAI, Social, Functioning)
- Beide leben jetzt nebeneinander als gleichwertige Tabs auf dem Patientenprofil.
