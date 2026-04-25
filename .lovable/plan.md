## Ziel

Integriere die vier Module (`types`, `curriculum-database`, `guardrails`, `system-prompt`) in TheraPilot, so dass:
1. Sitzungen nach **Diagnose (ICD) + Stadium** statt freier Behandlungsschritte strukturiert werden
2. AI-Slide-Vorschläge **leitliniengerecht + personalisiert** generiert werden
3. AI-Output durch **Guardrails validiert** wird (Lesbarkeit, Ton, Personalisierung, Pflichtinhalte)
4. Templates in der Library nach **Stadium gefiltert** angezeigt werden

---

## Schritte

### 1. Module übernehmen (1:1 wie hochgeladen)
- `src/lib/types.ts` (Curriculum/Patient/Validation-Typen) — als **neue** Datei `src/lib/curriculumTypes.ts` (um Konflikt mit bestehendem `Slide`/`Template` aus `db.ts`/`templates.ts` zu vermeiden — interne `Slide`/`Template` aus dem Modul werden umbenannt zu `CurriculumSlide`/`CurriculumTemplate`)
- `src/lib/curriculum-database.ts` (F41.0 voll, F32 + F42 stub)
- `src/lib/guardrails.ts` (Flesch, 8 Checks, Personalisierung)
- `src/lib/system-prompt.ts` (Deutscher LLM-Prompt-Builder)

### 2. PatientInfo-Mapping
Bestehender `Patient`-Typ aus `db.ts` hat nicht alle Felder (z.B. `triggers`, `hauptsymptome`). 
- **Erweitere** `Patient` in `src/lib/db.ts` um optionale Felder: `diagnose: ICDCode`, `triggers`, `hauptsymptome`, `hauptangst_gedanken`, `vermeidungs_verhalten`, `ziele`, `lernstil`
- Dexie-Schema-Bump auf nächste Version (additive, keine Migration nötig — Felder optional)
- In `PatientEdit.tsx`: neue Form-Felder (Diagnose-Dropdown + Tag-Inputs für Symptome/Trigger)

### 3. SessionSlidesPanel umbauen
Ersetze die bisherige `TREATMENT_STEPS`-basierte Logik durch Curriculum:
- **Stadium-Auswahl** statt freier Behandlungsschritte: Dropdown zeigt Stadien des Patienten-Curriculums (z.B. F41.0 → 6 Stadien)
- **Library-Filter**: `filterTemplatesByGuardrails(libraryTemplates, stageConfig, patientInfo)` filtert nur Templates, die Lesbarkeit + Ton bestehen
- **AI-Vorschlag-Button**: nutzt jetzt `buildSystemPrompt(curriculum, stage, patient, notes)` → neue Edge-Function-Task `generate-stage-slides`
- **Validierungs-Anzeige**: nach AI-Generierung `validateAIOutput()` aufrufen, Score + Errors als kleines Badge zeigen, Auto-Retry (max 2x) bei `valid=false`
- **Personalisierung-Fallback**: `personalizeSlides()` nach AI-Output, um übersehene Platzhalter zu ersetzen

### 4. Edge Function erweitern
In `supabase/functions/ai-assist/index.ts` neuer Task `generate-stage-slides`:
- Akzeptiert `curriculum`, `stageConfig`, `patientInfo`, `sessionNotes`
- Baut den System-Prompt via `buildSystemPrompt()` (System-Prompt-Code muss in die Edge Function dupliziert werden, da Edge Functions kein Zugriff auf `src/` haben)
- Nutzt `openai/gpt-5` mit Tool-Call → Slides im Format `{title, bullets, example, speaker_notes}`
- Pseudonymisierung bleibt aktiv (PatientInfo wird vor dem Senden gesäubert)

### 5. Provider erweitern
`src/lib/ai/provider.ts`:
- Neuer `AiTask` `"generate-stage-slides"`
- Neuer Response-Typ `GeneratedStageSlides { slides: CurriculumSlide[] }`

### 6. Validation-UI
Neue kleine Komponente `ValidationBadge` im Slides-Panel:
- Zeigt Score (0-100) als Farbe (grün ≥80, gelb 50-79, rot <50)
- Tooltip mit `formatValidationReport()` (Errors + Warnings aufgelistet)

---

## Was unverändert bleibt

- Bestehende `TEMPLATES` (deine Slide-Bibliothek mit Layouts/Icons) — werden weiter angezeigt, nur eben durch Guardrails gefiltert
- `SlideRenderer`, `SlidePresent`, alle anderen Pages
- Bestehende AI-Tasks (`structure-session`, `personalize-slides`, `suggest-slides`, `session-prep`)
- PptxExport, Dexie-Daten

---

## Technische Details

**Namens-Konflikt-Lösung:** Das hochgeladene `types.ts` definiert `Slide` und `Template` neu (mit `bullets`, `example`, `speaker_notes`) — das kollidiert mit deinem bestehenden Layout-reichen `TemplateSlide` aus `src/lib/templates.ts`. Lösung: Im neuen Modul umbenennen zu `CurriculumSlide`/`CurriculumTemplate`. Adapter-Funktion `curriculumSlideToTemplateSlide()` konvertiert AI-Output ins UI-Format (default `layout: "bullets"`).

**Curriculum ↔ Patient-Mapping:** Wenn `patient.diagnose` nicht gesetzt → Stadium-Auswahl ausgeblendet, Fallback auf alte `TREATMENT_STEPS`-Logik (rückwärtskompatibel).

**Edge Function System-Prompt:** Da Deno-Edge-Functions keine relativen `src/`-Imports haben, wird der Prompt-Builder in `supabase/functions/ai-assist/system-prompt.ts` gespiegelt (kleine Code-Duplikation, aber sauberer als komplexe Bundling-Tricks).

**Auto-Retry bei Validation-Fail:** Im `SessionSlidesPanel`: bei `result.valid === false && retries < 2` → AI erneut aufrufen mit zusätzlichem Hinweis `"Vorheriger Output hatte folgende Fehler: ..."`.

---

## Nicht enthalten (auf Nachfrage später)

- Erweiterung von F32 + F42 auf alle Stadien (nur Stubs aus dem Upload)
- Test-Datei `test.ts` (ist Standalone-Skript, nicht Vitest-kompatibel)
- Ollama-Integration (Stub bleibt für Phase 2)
