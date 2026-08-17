# Therapilot

AI-Assistent für Psychotherapeut:innen in Deutschland: strukturiert
Sitzungen, führt die KV-Verlaufsdokumentation (7 Sektionen) und generiert
Berichte (10 Berichtsarten). Ziel: datenschutzkonform (DSGVO), langfristig
mit lokalem LLM statt Cloud-AI für alles, was Patientendaten berührt.

## Stack
- Frontend: Vite + React + TypeScript + shadcn/ui + Tailwind, gebaut/gepflegt via Lovable
- Backend: Supabase (Postgres, Auth, Edge Functions)
- Optional lokal: `services/local-llm` (eigener Model-Server + RAG)

## Struktur
- `src/domains/` — Fachlogik nach Domäne. Neue Features gehören hierhin, nicht in flache `src/components` oder `src/pages`.
  - `documentation/` — KV-Verlaufsdokumentation (`kvDocTypes.ts`, `kvGuardrails.ts`, `KVDocumentationPanel`) und das Vorbereitungs-Briefing „Aktueller Stand" (`types.ts`, `useSessionBriefing`, `AktuellerStandCard`).
  - `patients/` — Anamnese-Profil (`anamneseTypes.ts`, `AnamneseProfilePanel`).
  - `sessions/` — CBT-Schema-Analyse (`schemaTypes.ts`, `SchemaChatFeed`).
  - `reports/` — psychotherapeutischer Befund (`types.ts`, `BefundPanel`).
- `src/lib/` — Querschnitt, nicht domänenspezifisch: `db.ts` (Dexie), `cloudSync.ts`, `pseudonymize.ts`, `authGuard.ts`/`authState.ts`, `demoSeed.ts`, `legacyCrypto.ts`.
- `src/lib/ai/` — Modell-Abstraktion. `providers/` enthält die Implementierungen (`local-llama.ts` fertig, `anthropic.ts` noch Stub); `tasks.ts` soll Aufgabe → Provider mappen, ist aber noch nicht implementiert. Der aktive Pfad läuft heute über `provider.ts` direkt in die Edge Function.
- `src/integrations/supabase/` — Supabase-Client und generierte Typen.
- `src/config/data-classes.ts` — Datenklassifizierung (`patient | internal | public`). Aktuell nur eine Typdefinition, noch ohne durchsetzende Stelle im Code.
- `supabase/functions/ai-assist/` — eine Edge Function, die alle AI-Aufgaben über ein `task`-Feld unterscheidet (`kv-documentation`, `cbt-schema-analysis`, `anamnese-extract`, `befund-generate`, `briefing-generate`).
- `prompts/` — versionierte Prompts (`*.v1.md`). Referenz für neue Dokumenttypen; die Edge Function hält die Prompt-Texte derzeit noch zusätzlich inline.
- `docs/report-templates/` + `docs/report-schema.json` — Referenz-PDFs der 10 Berichtsarten und die daraus extrahierte Struktur (beides noch leer).
- `docs/compliance/` — Datenflüsse, AVV, TOM.
- `services/local-llm/` — außerhalb des Lovable-Scope; eigener Docker-Service für lokale Inferenz + RAG.

## Wichtig
- Alles unter `src/` wird von Lovable synchronisiert — Änderungen dort landen direkt im Lovable-Projekt. Sei entsprechend vorsichtig mit größeren Refactors.
- Patientendaten (`data-class: patient`) dürfen nicht ungeprüft an Cloud-Provider gehen. Der bestehende Mechanismus ist `src/lib/pseudonymize.ts`, eingehängt in `src/lib/ai/provider.ts`. Er ist ein Best-Effort-Filter (Regex + Liste gängiger Vornamen), keine Garantie — Nachnamen und Ortsnamen erkennt er nicht.
- Neue Wege, auf denen Patientendaten das Gerät verlassen, müssen durch `pseudonymize` laufen. Ein früherer n8n-Webhook hat rohe Transkripte daran vorbei an einen Drittanbieter geschickt und wurde entfernt.
- Die Migration von `src/pages`/`src/components` in `src/domains` läuft schrittweise. Fachpanels und Domänentypen sind umgezogen; Seiten (`src/pages`) und Querschnitts-Code (`src/lib`) bleiben vorerst, wo sie sind.
