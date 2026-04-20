

## Plan: 6 Vertiefungs-Templates für Punkt 4 "Behandlung"

Jeweils 12+ Slides, gleicher Stil wie bisher. Ein Template pro Baustein – damit jeder Therapieschritt eigenständig in einer oder mehreren Sitzungen einsetzbar ist.

### Templates (IDs)

| # | ID | Titel | Slides |
|---|----|-------|--------|
| 4.1 | `behandlung-psychoedukation` | Psychoedukation Depression | 12 |
| 4.2 | `behandlung-verhaltensaktivierung` | Verhaltensaktivierung | 13 |
| 4.3 | `behandlung-kognitive-therapie` | Kognitive Therapie | 13 |
| 4.4 | `behandlung-interpersonell` | Interpersonelle Arbeit (IPT-Elemente) | 12 |
| 4.5 | `behandlung-achtsamkeit-akzeptanz` | Achtsamkeit & Akzeptanz | 12 |
| 4.6 | `behandlung-rueckfallprophylaxe` | Rückfallprophylaxe | 12 |

### Slide-Skelett pro Template (einheitliches Muster)

1. Titel-Slide (`headline`) – Hauptbotschaft
2. Inhaltsverzeichnis (`steps`) – Übersicht des Bausteins
3. Modell/Theorie-Slide (`model`) – warum es wirkt
4. Vorher/Nachher (`before-after`) – Ausgangslage vs. Ziel
5–9. Konkrete Methoden/Techniken (`steps`, `bullets`, `model`)
10. Hausaufgabe / Arbeitsblatt (`bullets`)
11. Häufige Hindernisse (`vicious-cycle` oder `before-after`)
12. Zusammenfassung (`vicious-cycle`)
13. Reflexion (`question`)

### Technische Umsetzung
- **Datei:** nur `src/lib/templates.ts`
- **Entfernen:** `fallkonzept-depression-biografie` (10 Slides)
- **Hinzufügen:** 6 neue Template-Objekte direkt nach `fallkonzept-depression-diagnostik-indikation`
- **Icons:** ausschließlich vorhandene aus `slideIcons.ts` (`brain`, `lightbulb`, `target`, `leaf`, `breath`, `hands`, `shield`, `sun`, `cycle`, `compass`, `scale`, `heart`, `steps`, `question`)
- **Approach:** "KVT" für 4.1–4.3, 4.6 · "IPT" für 4.4 · "MBCT/ACT" für 4.5
- **Category:** "Intervention" für 4.2–4.5 · "Psychoedukation" für 4.1 · "Modell" für 4.6

