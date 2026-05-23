## Ziel

Eine neue, mehrstufige KI-Pipeline in TheraPilot, die aus einem vollständigen (per Diktat/Upload entstandenen) Sitzungs-**Transkript** automatisch eine **KV-konforme, klinisch-neutrale Verlaufsdokumentation** in genau 7 vorgeschriebenen Abschnitten erzeugt — als überprüfbare Vorlage für Therapeut:innen, nicht als Ersatz.

## Zielstruktur der Ausgabe (verbindlich, exakt diese 7 Sektionen)

1. Aktuelle Symptomatik
2. Inhalte der Sitzung
3. Therapeutische Interventionen
4. Verlauf und Einschätzung
5. Vereinbarungen
6. Risikoabklärung
7. Administrative / Abrechnungsrelevante Hinweise

Stilregeln (im Prompt verankert + post-validiert): klinisch-neutral, keine direkte Rede, keine Wertungen, keine spekulativen Diagnosen, knappe Fachsprache, nur explizit Genanntes/Beobachtbares, abrechnungsrelevante Inhalte priorisiert.

## Mehrstufige Pipeline (Pass-Architektur)

Eine einzige KI-Anfrage über lange Transkripte ist fehleranfällig. Stattdessen 4 sequentielle Schritte in der Edge Function `ai-assist` (neuer Task `kv-documentation`):

```text
Transkript
  │
  ▼
[1] PRE-PROCESS (lokal, TS)
  • Pseudonymisierung (bestehend pseudonymize.ts ausgebaut)
  • Sprecher-Normalisierung (T: / P:)
  • Chunking falls > ~12k Tokens
  │
  ▼
[2] EXTRACT  (LLM, Tool-Call → JSON)
  Extrahiert strukturierte Fakten:
  symptome[], themen[], interventionen[] (klassifiziert: KVT/Exposition/
  Psychoedukation/Validierung/sokratisch/Skills/Hausaufgabe…),
  vereinbarungen[], risiken{suizidalitaet, fremdgefahrdung,
  selbstverletzung, substanz, sonst}, verlauf_indikatoren[],
  abrechnung{ziffer_hinweise, dauer, format, besonderheiten}
  │
  ▼
[3] COMPOSE  (LLM, Tool-Call → finales 7-Sektionen-Objekt)
  Nimmt Extraktion + Kontext (Diagnose, Ziele, Vorsitzung) und
  schreibt die 7 Abschnitte klinisch-neutral, indirekt, knapp.
  │
  ▼
[4] VALIDATE & GUARD (lokal, TS)
  • Pflicht-Sektionen vorhanden + nicht leer
  • Verbotsliste: direkte Rede ("..."/„…"), wertende Begriffe
    (z. B. „leider", „beeindruckend"), spekulative Diagnose-Phrasen
    („vermutlich F…", „wirkt depressiv")
  • Risiko-Sektion: explizite Aussage zu Suizidalität (auch wenn
    „nicht thematisiert / nicht exploriert" — nie leer)
  • Personalisierungs-Check: kein Klartext-Name (nur Pseudonym)
  • Score 0–100 + Liste Errors/Warnings
  • Auto-Retry max. 1x mit Fehlerliste als zusätzlichem Hinweis
```

## UI-Integration in `SessionEdit.tsx`

- Neuer Tab/Bereich „**Verlaufsdokumentation (KV)**" neben bestehender SOAP-Strukturierung.
- Eingabequellen:
  - **Transkript-Feld** (große Textarea) — befüllbar durch:
    - bestehendes Browser-Diktat (Web Speech API, schon vorhanden, wird erweitert für Langform mit Auto-Save)
    - Datei-Upload (.txt / .vtt / .srt → in Klartext geparst, lokal)
- Button: „**KV-Verlauf generieren**" → ruft neuen Task `kv-documentation` auf, zeigt Stage-Progress (Extract → Compose → Validate).
- Ergebnis-Ansicht: 7 Accordion-Sektionen, je editierbar, jeweils mit „Quelle im Transkript anzeigen" (Sprung zu zitierter Stelle anhand Char-Offsets aus Extract-Pass).
- ValidationBadge (analog zu vorhandenem Curriculum-Flow) zeigt Score + Errors.
- Aktionen: „Übernehmen in Dokumentation" (speichert in `session.structured` mit klarer Trennung) + „Als PDF exportieren" (späterer Schritt, vorerst Markdown-Copy).

## Datenmodell

Erweiterung von `SessionEntry` in `src/lib/db.ts` (Dexie-Schema-Bump, additiv):

- `transcript?: string` — vollständiges Roh-Transkript
- `kvDocumentation?: KVDocumentation` — strukturiertes 7-Sektionen-Objekt
- `kvExtraction?: KVExtraction` — Zwischenresultat aus Extract-Pass (für Audit/Re-Compose ohne erneuten LLM-Call)
- `kvValidation?: { score: number; errors: string[]; warnings: string[]; generatedAt: number }`

Neue Typen in neuer Datei `src/lib/kvDocTypes.ts`.

## Backend (Edge Function `ai-assist`)

Neuer Task `kv-documentation` mit zwei internen LLM-Calls (Extract + Compose), beide via Tool-Calling für garantiert strukturiertes JSON. Modell: `openai/gpt-5` für Compose (klinische Präzision), `google/gemini-2.5-pro` für Extract (große Kontextfenster, günstig). Prompt enthält explizit:

- Whitelist erlaubter Intervention-Kategorien (DGPPN-orientiert)
- Risiko-Heuristiken (passive/aktive Suizidgedanken-Marker)
- Abrechnungs-Hinweise (Sitzungstyp, Dauer, Setting — keine konkreten EBM-Ziffern, nur Hinweise)
- Negativ-Regeln (keine direkte Rede, keine Wertung, keine spekulative Diagnose)

Lokale Post-Validation in `src/lib/kvGuardrails.ts` (analog `guardrails.ts`):

- Regex-Detektoren für direkte Rede, Wertungen, Diagnose-Spekulation
- Pflichtfeld-Checks
- Risiko-Sektion darf nie leer/„entfällt" sein

Pseudonymisierung wird **vor** dem Senden im bestehenden `deepPseudonymize` mitverarbeitet (bereits aktiv via `provider.ts`).

## Datenschutz

- Transkript bleibt in IndexedDB (lokal-first), Verschlüsselung über bestehendes `crypto.ts` (sofern aktiv).
- An Edge Function gehen nur pseudonymisierte Inhalte.
- Keine Persistenz im Backend (Edge Function speichert nichts).
- Optionaler späterer Schritt: lokales Ollama (`provider.ts` Stub vorhanden) — out of scope dieser Iteration, aber API kompatibel gehalten.

## Was NICHT enthalten ist (bewusst, kann später)

- Echte Audio-Transkription (Whisper/ElevenLabs STT) — diese Iteration arbeitet auf **Text-Transkript** (Diktat-Browser-API + Upload). STT-Integration kann als Folgeschritt erfolgen (Empfehlung: ElevenLabs scribe_v2 via Edge Function — Knowledge dafür liegt bereit).
- EBM-Ziffer-Automatik — wir liefern nur Hinweise, keine verbindliche Abrechnung.
- PDF-Export — vorerst Markdown/Copy, PDF in separater Iteration.

## Technische Details

**Geänderte / neue Dateien**

- `src/lib/db.ts` — Dexie v3, neue Felder auf `SessionEntry`
- `src/lib/kvDocTypes.ts` *(neu)* — `KVDocumentation`, `KVExtraction`, `InterventionKind`, `RiskAssessment`
- `src/lib/kvGuardrails.ts` *(neu)* — Validatoren + Score
- `src/lib/ai/provider.ts` — neuer `AiTask` `"kv-documentation"`, Response-Typ `KVDocumentationResult`
- `src/components/KVDocumentationPanel.tsx` *(neu)* — UI: Transkript-Eingabe, Generieren-Button, 7-Sektionen-Editor, ValidationBadge
- `src/pages/SessionEdit.tsx` — Tabs (SOAP / KV-Verlauf / Slides), Einbindung des neuen Panels
- `supabase/functions/ai-assist/index.ts` — neuer Task mit 2-Stufen-Logik (Extract → Compose), Retry bei Validierungsfehlern

**Edge-Function-Flow**

```text
POST /ai-assist { task: "kv-documentation", payload: { transcript, context } }
  → Extract-Call (Gemini 2.5 Pro, tool=return_kv_extraction)
  → Compose-Call (GPT-5, tool=return_kv_documentation, input=Extract+Context)
  → Response { extraction, documentation }
Client: validate() → bei Fail → Retry 1x mit errors im Payload
```

**Stil-Validator (Auszug Regex)**

- direkte Rede: `/["„][^"""]{4,}["""]/` (mit Whitelist für Fachzitate)
- Wertungen: `\b(leider|erfreulicherweise|beeindruckend|schwach|stark betroffen)\b`
- Diagnose-Spekulation: `\b(vermutlich|wahrscheinlich|wirkt) (depressiv|ängstlich|traumatisiert|F\d{2})\b`

**Backward-Kompatibilität**

- Bestehende `structure-session` (SOAP/VT-Verlauf/Frei) bleibt unverändert; der neue KV-Task ist additiv.
- Existierende Sitzungen ohne `transcript` zeigen Panel im Leerzustand mit Hinweis „Bitte Transkript erfassen oder hochladen".

## Offene Punkte für dich vor Implementierung

1. Soll bereits in dieser Iteration ein echter **STT (Audio-Upload → Transkript)** mit dabei sein (z. B. ElevenLabs scribe_v2), oder reicht erstmal Browser-Diktat + Text-Upload?
2. Sollen die 7 Sektionen frei editierbar sein nach Generierung (Recommended: ja) und beim Speichern als zusammenhängendes Markdown ins bestehende `session.structured` gemappt werden, oder separat gehalten (`kvDocumentation`)?
3. Möchtest du im Risiko-Pass ein explizites **Suizid-Screening-Schema** (z. B. C-SSRS-Items als Checkliste) zusätzlich zur Freitextzusammenfassung?
