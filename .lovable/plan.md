

## Plan: Neues Template "Schlaf & Zirkadiane Rhythmik bei Depression"

Ich erstelle ein neues, vollständig visualisiertes Template für die Bibliothek mit Fokus auf den Zusammenhang zwischen Schlaf, zirkadianer Rhythmik und Depression — inkl. zwei generierter Schaubilder.

### Inhaltliche Struktur (12 Slides)

1. **Titel-Slide** (`headline`) — "Schlaf, innere Uhr & Depression" + Subline
2. **Was ist die zirkadiane Uhr?** (`image`) — Schaubild: 24-Stunden-Uhr mit Cortisol-, Melatonin- und Temperatur-Kurve
3. **Die zwei Steuerungssysteme** (`model`) — Knoten: Schlafdruck (Prozess S) → Innere Uhr (Prozess C) → Schlaf-Wach-Rhythmus
4. **Wie Depression den Schlaf stört** (`vicious-cycle`) — Zentrum "Depression & Schlaf", 4 Knoten: Grübeln, früh Erwachen, Tagesmüdigkeit, Antriebslosigkeit
5. **Gehirn & Schlaf bei Depression** (`image`) — Schaubild: Gehirn mit SCN (suprachiasmatischer Kern), Zirbeldrüse, präfrontalem Cortex
6. **Typische Schlafmuster bei Depression** (`before-after`) — Gesund vs. Depressiv (Einschlafzeit, Tiefschlaf, REM, Früh­erwachen)
7. **Licht als Taktgeber** (`headline`) — "Licht ist das stärkste Signal für Ihre innere Uhr" + Subline mit Lux-Werten
8. **Schlafhygiene — die 7 Säulen** (`steps`) — Konkrete Schritte: feste Aufstehzeit, Morgenlicht, Bewegung, Koffein-Stop, Bildschirme, kühles Schlafzimmer, Wind-Down-Routine
9. **Bett-Restriktion & Stimuluskontrolle** (`steps`) — KVT-I Kernschritte
10. **Chronotherapie-Optionen** (`model`) — Lichttherapie → Wachtherapie → Schlafphasenvorverlagerung
11. **Reflexionsfrage** (`question`) — "Welcher Ihrer Schlaf-Bausteine ist gerade am instabilsten?"
12. **Mein Schlaf-Wochenplan** (`steps`) — Konkrete Umsetzung für die nächste Woche

### Technische Umsetzung

**Neue Dateien:**
- `src/assets/zirkadiane-uhr.jpg` — generiert via Lovable AI (`google/gemini-3-pro-image-preview`): 24h-Kreis mit beschrifteten Hormonkurven, deutscher Beschriftung, klinisch-ruhiger Stil passend zu vorhandenen Assets
- `src/assets/gehirn-schlaf.jpg` — generiert via Lovable AI: anatomische Gehirndarstellung mit hervorgehobenem suprachiasmatischen Kern (SCN), Zirbeldrüse (Melatonin) und präfrontalem Cortex, deutsche Labels

**Geänderte Dateien:**
- `src/lib/templates.ts` — neues Template-Objekt `schlaf-depression` mit Approach `KVT`, Import der beiden neuen Bilder, vollständig strukturierte `layoutData` für jede Slide
- Keine Änderungen an Renderer/Schema nötig — alle benötigten Layouts (`image`, `model`, `vicious-cycle`, `before-after`, `steps`, `headline`, `question`) sind bereits vorhanden

**Bildgenerierung:** Per AI-Gateway-Skill mit Pro-Image-Modell für lesbare deutsche Beschriftungen (gleicher Stil wie `emotionales-netzwerk.jpg` und `gehirn-amygdala.jpg`).

**Stil-Konsistenz:** Icons aus vorhandener `slideIcons.ts` (z. B. `clock`, `brain`, `moon`, `sun`, `heart`, `shield`).

