

Der User möchte, dass ich für **Punkt 1 "Diagnostik / Störungsbild"** des Fallkonzept-Baums passende, ausführlich visualisierte Slides erstelle — und zwar mit einer klaren Struktur, die dem Inhaltsverzeichnis (1.1 bis 1.5) folgt. Das wird ein eigenes, fokussiertes Sub-Template, das tiefer in die Diagnostik einsteigt als die eine Übersichts-Slide im großen Fallkonzept-Template.

## Plan: Neues Template "Fallkonzept Depression – 1. Diagnostik / Störungsbild (Vertiefung)"

Ein eigenständiges Vertiefungs-Template mit **9 Slides**, das exakt der Baumstruktur 1.x folgt. Jeder Unterpunkt erhält mindestens eine eigene Slide mit passendem Visualisierungs-Layout.

### Slide-Struktur (folgt Inhaltsverzeichnis)

| # | Slide | Punkt | Layout | Visualisierung |
|---|-------|-------|--------|----------------|
| 1 | Titel & Übersicht | 1. | `headline` | Hauptbotschaft + Subline mit den 5 Unterbereichen |
| 2 | Inhaltsverzeichnis Diagnostik | 1.1–1.5 | `steps` | 5 nummerierte Schritte als Kapitelübersicht |
| 3 | Diagnose nach ICD-10 / ICD-11 | 1.1 | `before-after` | ICD-10 (F32/F33) vs. ICD-11 (6A70/6A71) Gegenüberstellung |
| 4 | Schweregrad-Spektrum | 1.2 | `model` | 3 Knoten: leicht → mittel → schwer (mit Symptomanzahl-Kriterien) |
| 5 | Episodenverlauf | 1.3 | `before-after` | Erstepisode vs. Rezidivierend (Verlaufsmuster, Prognose) |
| 6 | Leitsymptome (Haupttrias) | 1.4 | `model` | 3 Knoten: gedrückte Stimmung · Antriebsmangel · Interessenverlust |
| 7 | Zusatzsymptome – Überblick | 1.5 | `bullets` | Alle 5 Zusatzsymptome mit Kurzerklärung |
| 8 | Zusatzsymptome im Detail | 1.5 | `steps` | 5 Schritte: Schlaf · Appetit · Konzentration · Schuld · Suizidalität – jeweils mit klinischen Hinweisen |
| 9 | Diagnostik-Zusammenfassung | 1. | `vicious-cycle` | Zentrum „Diagnose Depression", 4 Knoten: Symptomdauer ≥2 Wo · Funktionseinschränkung · Leidensdruck · Differentialdiagnose |

### Technische Umsetzung

**Geänderte Datei (nur eine):**
- `src/lib/templates.ts` — neues Template-Objekt `fallkonzept-depression-diagnostik` mit Approach `KVT`, eingefügt direkt nach `fallkonzept-depression-vt`

**Keine neuen Bilder nötig** — alle Layouts sind rein strukturell und nutzen vorhandene Renderer (`headline`, `steps`, `before-after`, `model`, `bullets`, `vicious-cycle`).

**Icons (aus `slideIcons.ts`):** `compass` (Diagnose), `scale` (Schweregrad), `cycle` (Verlauf), `target` (Leitsymptome), `brain`, `moon` (Schlaf), `heart` (Suizidalität), `shield` (Zusammenfassung).

**Klinische Tiefe:** Jede Slide enthält konkrete, klinisch korrekte Inhalte (z. B. ICD-Kriterien, Symptomanzahl pro Schweregrad, Differentialdiagnostik-Hinweise) — nicht nur Stichworte aus dem Baum, sondern ausgearbeitete Inhalte für die Patientenkommunikation.

**Konsistenz:** Das Template erscheint automatisch in der Bibliothek und ist über `TemplateDetail` aufrufbar — keine Routing- oder Renderer-Änderungen nötig.

### Folge-Templates (optional, separat)
Wenn dieses Muster passt, kann ich nach demselben Schema Vertiefungs-Templates für die Punkte **2–12** des Baums anlegen (jedes als eigenständiges Template, damit der Psychologe gezielt Module einsetzen kann).

