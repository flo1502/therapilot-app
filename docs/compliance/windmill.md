# Windmill — Hosting-Status (TODO vor Produktivbetrieb)

## Aktueller Stand

Die Session-Dokumentations-Pipeline (`windmill/f/therapilot/`, siehe
Windmill-Setup) ist aktuell gegen **app.windmill.dev** gebunden — die
gehostete Windmill-Cloud (Windmill Labs), nicht ein selbst betriebener
Server.

**Nutzung ausschließlich zum Entwickeln/Testen mit synthetischen
Testdaten.** Über diese Instanz dürfen keine echten Patientendaten
(data-class `patient`, siehe `src/config/data-classes.ts`) laufen —
insbesondere keine echten Transkripte, keine echten `sessions.data`- oder
`patients.data`-Inhalte aus Produktivbetrieb.

Das steht im Spannungsverhältnis zum in `CLAUDE.md` festgehaltenen Ziel:
"langfristig mit lokalem LLM statt Cloud-AI für alles, was Patientendaten
berührt" — solange die Orchestrierung über eine fremdgehostete Cloud läuft,
ist dieses Ziel für den Windmill-Teil der Pipeline nicht erfüllt, auch wenn
das eigentliche LLM (`local_llm`-Resource) weiterhin lokal läuft.

## TODO vor Produktivbetrieb (mit echten Patientendaten)

Eine der beiden Optionen muss umgesetzt sein, bevor echte Transkripte durch
diese Pipeline laufen:

1. **Umzug auf einen eigenen EU-Server** (z.B. Hetzner) — Windmill
   self-hosted, kein Datenabfluss an einen dritten Anbieter. Bevorzugte
   Option, konsistent mit dem lokalen-LLM-Ansatz des Projekts.
2. **Auftragsverarbeitungsvertrag (AVV) mit Windmill Labs**, der
   ausdrücklich Art. 9 DSGVO Gesundheitsdaten abdeckt — inkl. Prüfung von
   Serverstandort, Sub-Processorn und TOM. Nur falls Option 1 nicht
   umsetzbar ist.

Keines von beidem ist aktuell (Stand dieses Vermerks) geprüft oder
abgeschlossen.

## Betroffene Komponenten

- `windmill/f/therapilot/supabase.resource.yaml` — enthält perspektivisch
  den `service_role_key` des Supabase-Projekts. Solange gegen
  app.windmill.dev gebunden, liegt dieser Key (verschlüsselt durch
  Windmill) auf einem Server eines Drittanbieters.
- `windmill/f/therapilot/session_documentation__flow/flow.yaml` — der
  Flow, der `sessions.data.transcript` liest und `sessions.data` zurück-
  schreibt. Genau dieser Pfad darf bis zur Klärung nur mit synthetischen
  Testdaten ausgeführt werden.

## Nächster Schritt

Vor dem ersten Lauf mit echten Sitzungsdaten: diese Datei aktualisieren,
sobald Option 1 oder 2 entschieden und umgesetzt ist.
