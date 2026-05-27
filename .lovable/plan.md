
# Therapieverlauf v2 – Clinical Depression Dashboard

Erweitert das bestehende `TherapieverlaufDashboard` zu einem klinisch lesbaren Dashboard mit 5 Master-KPIs, 3 rekonstruierten Diagnostik-Skalen (PHQ-9 / BDI-II / HAM-D), SCID-Status, Session-Timeline, Cross-Scale-Overlay, Clinical Summary und Insight Alerts.

## 1. Datenmodell (additive Erweiterung von `SessionKPIs`)

Bestehende Felder bleiben. Ergänzungen in `src/lib/kpiTypes.ts`:

```ts
interface SessionKPIs {
  // ... bestehende Felder

  // Master-KPIs (rekonstruierte Sub-Signale)
  mood?: number;              // 0-10
  anhedonia?: number;         // 0-10
  energy?: number;            // 0-10
  cognition?: number;         // 0-10
  hopelessness?: number;      // 0-10
  selfDeprecation?: number;   // 0-10
  avoidanceCount?: number;
  functioningWork?: number;   // 0-10
  functioningSocial?: number; // 0-10
  functioningDaily?: number;  // 0-10
  sleepDisturbance?: number;  // 0-10
  psychomotor?: number;       // 0-10  (retardation/agitation kombiniert)
  somaticSymptoms?: number;   // 0-10
  guilt?: number;             // 0-10

  // Risk
  riskLevel?: 0 | 1 | 2 | 3;  // none / passive / active / planning
  riskNotes?: string;

  // SCID / CIDI Proxy
  scid?: {
    coreSymptoms: boolean;
    durationOver2Weeks: boolean;
    functionalImpairment: boolean;
    exclusionOtherDisorder: boolean | null; // null = unklar
    confidence: "low" | "medium" | "high";
    likelyDiagnosis?: string; // z. B. "Major Depressive Episode"
  };

  // Key quotes für Timeline-Drilldown
  keyQuotes?: { text: string; tag: "belief"|"emotion"|"risk"|"activity"|"insight" }[];
}
```

Composite-Indizes (alle 0–100, im Frontend berechnet, keine Speicherung nötig):

- **DSI** (Depression Severity): gewichtet aus `mood, anhedonia, energy, cognition, depressionSeverity`
- **CDI** (Cognitive Distortion): aus `negativeBeliefs, hopelessness, selfDeprecation` minus `adaptiveBeliefs`
- **BAI** (Behavioral Activation): `positiveActivities` vs `avoidanceCount`
- **Functioning Index** (WHODAS-like): Mittelwert `functioningWork/Social/Daily`
- **Risk Index**: direkt `riskLevel` (0–3)

Rekonstruierte Skalen (AI-mapped, 0–Skalenmax):

- **PHQ-9 AI** (0–27): affect + cognition + sleep + functioning
- **BDI-II AI** (0–63): beliefs + self-worth + guilt + hopelessness gewichtet
- **HAM-D AI** (0–52): energy + psychomotor + somatic + sleep gewichtet

Reine Berechnungs-Helpers in `kpiTypes.ts` (`computePHQ9`, `computeBDI`, `computeHAMD`, `computeDSI`, `computeCDI`, `computeBAI`, `computeFunctioning`).

Dexie bleibt auf v5 (nur Schema-loses Feld erweitert, kein Migrationsschritt nötig – die Felder sind optional).

## 2. AI-Extraktion erweitern

In `supabase/functions/ai-assist/index.ts`, Task `depression-kpi-extract`: Tool-Schema (`return_session_kpis`) um die neuen Felder ergänzen (mood, anhedonia, energy, cognition, hopelessness, selfDeprecation, avoidanceCount, functioning*, sleepDisturbance, psychomotor, somaticSymptoms, guilt, riskLevel, scid-Objekt, keyQuotes-Array).

Prompt-Regel bleibt konservativ:
- Nur Werte setzen, die im Transcript belegt sind, sonst `undefined`/`0`.
- `scid.confidence`: nur "high", wenn alle 4 Kriterien klar; sonst "medium"/"low".
- `keyQuotes`: max. 5 wörtliche Zitate.

Kein neuer Task – derselbe Button extrahiert alles in einem Call.

## 3. UI-Struktur (`TherapieverlaufDashboard.tsx`)

Tabs werden neu gegliedert:

```text
[ Overview ] [ Master KPIs ] [ Diagnostik ] [ Timeline ] [ Cross-Scale ] [ Alerts ]
```

Bestehende Sub-Tabs (Symptoms, Cognitive Shift, Behavior, Social, Emotion, Self-Worth) wandern unter **Master KPIs** als kleine Karten-Sektionen — bleiben funktional erhalten.

### Overview
- DRI Big Number + Trend (bestehend)
- Daneben: 5 KPI-Tiles (DSI, CDI, BAI, Functioning, Risk) mit Farbe + Trend-Pfeil
- Darunter: Clinical Summary (auto-generierter Text, siehe §5)

### Master KPIs (5 Charts gestapelt)
1. **DSI** — Area Chart rot→gelb→grün, Y 0–100
2. **CDI** — 2 Linien (negative ↓, adaptive ↑)
3. **BAI** — Stacked Bar (positive grün, avoidance rot)
4. **Functioning** — Line Chart 0–100
5. **Risk** — Step-Line mit kritischen Markern (Punkt rot ab Level 2)

### Diagnostik (PHQ / BDI / HAM-D / SCID)
- 3 separate Line Charts (PHQ-9, BDI-II, HAM-D) mit klinischen Schwellenwerten als Referenzlinien (z. B. PHQ ≥10 moderat, ≥20 schwer)
- SCID-Status-Karte mit Checkmarks pro Kriterium + Confidence-Badge + likelyDiagnosis-Text

### Timeline
- Horizontale Session-Reihe (Punkt pro Session, Farbe = DSI-Schweregrad)
- Klick auf Punkt → Drawer rechts mit PHQ/BDI/HAM-D Werten, beliefs, activities, risk events, keyQuotes

### Cross-Scale
- Ein gemeinsamer Line Chart: PHQ-9 (normalisiert 0–100), BDI-II (norm.), HAM-D (norm.) übereinander
- Korrelations-Hinweis: "Alle Skalen bestätigen Verlauf" wenn alle 3 in gleiche Richtung trenden

### Alerts
- Regelbasiert im Frontend aus den letzten 3 Sessions:
  - "↓ Cognitive distortion in 3 consecutive sessions" wenn CDI 3× monoton fällt
  - "↑ Behavioral activation significantly increased" wenn BAI Δ ≥ 20
  - "⚠ Risk spike in Session X (passive/active ideation)" wenn riskLevel ≥ 1
  - "↓ Functioning drop" wenn Functioning Δ ≤ −15
- Liste mit Severity-Icon, Session-Referenz, Klick → springt in Timeline-Drawer

## 4. Clinical Interpretation (Auto-Summary)

Reines Frontend (deterministische Regeln, keine zusätzliche AI-Runde), z. B.:

- "depressive Symptomatik nimmt kontinuierlich ab" wenn DSI über letzten 3 Sessions monoton fällt
- "kognitive Verzerrungen reduzieren sich" wenn CDI ↓
- "Aktivitätsniveau steigt" wenn BAI ↑
- "Risiko aktuell niedrig stabil" wenn alle riskLevel ≤ 1

Funktion `generateClinicalSummary(sessions[])` in `kpiTypes.ts`.

## 5. Dateien

**Neu:**
- `src/components/kpi/MasterKpiRow.tsx` (5 Tiles)
- `src/components/kpi/DiagnosticScalesPanel.tsx` (PHQ/BDI/HAM-D + SCID)
- `src/components/kpi/SessionTimeline.tsx` (Punkte + Drawer)
- `src/components/kpi/CrossScaleOverlay.tsx`
- `src/components/kpi/InsightAlerts.tsx`
- `src/components/kpi/ClinicalSummary.tsx`
- `src/components/kpi/RiskStepChart.tsx`

**Geändert:**
- `src/lib/kpiTypes.ts` (neue Felder + Compute-Helpers + Alert/Summary-Logik)
- `src/components/TherapieverlaufDashboard.tsx` (neue Tab-Struktur, integriert die Sub-Komponenten)
- `supabase/functions/ai-assist/index.ts` (erweitertes Tool-Schema + Prompt)

Keine Dexie-Migration, keine neuen npm-Packages (Recharts + shadcn vorhanden).

## Offene Fragen

1. **Scoring-Kalibrierung PHQ/BDI/HAM-D**: Akzeptierst du heuristische Mappings (kein klinisch validierter Score, klar als "AI estimate" gelabelt)? Empfehlung: ja, mit deutlichem Disclaimer "AI-rekonstruierte Schätzung — kein Diagnoseinstrument".
2. **Risk-Handling**: Soll bei `riskLevel ≥ 2` ein prominentes rotes Banner oben im Dashboard erscheinen (Empfehlung: ja), und soll ein Alert per Toast beim Öffnen ausgelöst werden?
3. **Alerts-Persistenz**: Alerts nur in-memory aus aktuellen Sessions berechnen (Empfehlung), oder dismissable + in Dexie speichern?
