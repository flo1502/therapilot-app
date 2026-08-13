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
- `src/domains/` — Fachlogik nach Domäne (sessions, documentation, reports, patients, assistant). Neue Features gehören hierhin, nicht in flache `src/components` oder `src/pages`.
- `src/lib/ai/` — Modell-Abstraktion; `tasks.ts` mappt eine Aufgabe auf Provider + Prompt, `providers/` enthält die konkreten Implementierungen (Anthropic, lokales Llama).
- `src/lib/supabase/` — Supabase-Client und generierte Typen.
- `src/config/data-classes.ts` — Datenklassifizierung (`patient | internal | public`); bestimmt, was eine Cloud-API erreichen darf.
- `supabase/functions/` — Edge Functions, eine pro AI-Aufgabe (`structure-session`, `generate-report`, `session-briefing`, `rag-query`), `_shared/` für Prompt-Loader/Validierung.
- `prompts/` — versionierte Prompts (`*.v1.md`), nie im Code hardcodiert.
- `docs/report-templates/` + `docs/report-schema.json` — Referenz-PDFs der 10 Berichtsarten und die daraus extrahierte Struktur.
- `docs/compliance/` — Datenflüsse, AVV, TOM.
- `services/local-llm/` — außerhalb des Lovable-Scope; eigener Docker-Service für lokale Inferenz + RAG.

## Wichtig
- Alles unter `src/` (außer `src/domains` sobald migriert) wird von Lovable synchronisiert — Änderungen dort landen direkt im Lovable-Projekt. Sei entsprechend vorsichtig mit größeren Refactors.
- Patientendaten (`data-class: patient`) dürfen nicht ungeprüft an Cloud-Provider gehen — siehe `src/lib/pseudonymize.ts` für den bestehenden Mechanismus, der in `lib/validation/` konsolidiert werden soll.
- Aktuell existiert noch keine echte Migration von `src/pages`/`src/components`/`src/lib` in `src/domains` — das ist ein bewusst schrittweiser Prozess, kein Big-Bang-Rewrite.
