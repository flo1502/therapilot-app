# Pattern Engine Tab – Cross-Session KPIs

Neuer Tab **"Pattern Engine"** im bestehenden `TherapieverlaufDashboard`, eingefügt nach den vorhandenen Tabs (Overview / Master KPIs / Diagnostik / Timeline / Cross-Scale / Alerts → **+ Pattern Engine**).

Der Tab realisiert **Layer 3** deines Systems: Cross-Session Pattern Detection + die 5 Verlaufskurven.

## 1. Inhalt des neuen Tabs

### A) 5 Verlaufskurven (gestapelt, je ein Mini-LineChart)
1. **Severity Curve** (PHQ-like) → nutzt `computePHQ9` (bereits vorhanden)
2. **Cognitive Distortion Curve** → `computeCDI`
3. **Behavioral Activation Curve** → `computeBAI`
4. **Social Engagement Curve** → `socialContactsCount + socialInitiated`-gewichtet (neu: `computeSocialEngagement`)
5. **Functioning Curve** → `computeFunctioning`

Jede Kurve mit Trend-Pfeil (↑/↓/→) und Delta-Badge (erste vs. letzte Session).

### B) Detected Patterns Liste
Karten-Liste mit erkannten Mustern über alle Sessions:

- **Belief Persistence** — wenn `negativeBeliefsCount ≥ 3` in den letzten 3 Sessions stabil bleibt → "Core Schema aktiv"
- **Avoidance Trend** — Trend von `avoidanceCount` (↑ = warning, ↓ = positive)
- **Cognitive Shift Pattern** — `adaptiveBeliefs ↑` UND `negativeBeliefs ↓` über 3+ Sessions
- **Activation Recovery** — `BAI` über 3 Sessions monoton steigend
- **Risk Fluctuation** — wenn max(riskLevel) − min(riskLevel) ≥ 2 oder Spike erkannt

Jedes Pattern als Card mit Icon, Titel, Beschreibung, betroffenem Session-Range, Severity-Farbe.

### C) Per-Session KPI Tabelle (Drilldown)
Kompakte Tabelle mit allen Sessions als Zeilen und Spalten: Severity, CDI, Belief Load, Cognitive Shift, BAI, Social, Emotion Reg, Functioning, Risk.

## 2. Technische Umsetzung

**`src/lib/kpiTypes.ts`** – ergänzen (rein additiv, keine Datenmodell-Änderung):
- `computeSocialEngagement(k)` → 0–100 aus `socialInitiated` + `socialContactsCount`
- `computeBeliefLoad(k)` → `negativeBeliefsCount`
- `computeCognitiveShift(k)` → `adaptiveBeliefsCount − negativeBeliefsCount` (bereits als `cognitiveShiftIndex` vorhanden – wiederverwenden)
- `detectPatterns(points: SessionPoint[]): DetectedPattern[]` mit `{ id, type, severity, title, detail, sessionRange }`

**`src/components/kpi/PatternEnginePanel.tsx`** (neu):
- nimmt `points: { nr, kpis }[]` entgegen
- rendert die 3 Sektionen (Curves / Patterns / Table)
- nutzt vorhandene `recharts` + shadcn `Card`/`Table`/`Badge`

**`src/components/TherapieverlaufDashboard.tsx`** (geändert):
- neuen `TabsTrigger` "Pattern Engine" nach "Alerts" hinzufügen
- neuen `TabsContent` mit `<PatternEnginePanel points={points} />`
- `TabsList` ggf. auf `grid-cols-7` oder horizontal scrollbar anpassen

## 3. Keine Änderungen an

- AI-Extraktion (`ai-assist/index.ts`) – alle nötigen Felder werden bereits extrahiert
- Datenmodell / Dexie
- Bestehende Tabs

## Dateien

**Neu:** `src/components/kpi/PatternEnginePanel.tsx`
**Geändert:** `src/lib/kpiTypes.ts`, `src/components/TherapieverlaufDashboard.tsx`
