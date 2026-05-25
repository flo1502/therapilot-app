
# Therapieverlauf – Depression KPI Dashboard

Neuer Tab neben „CBT-Schemata", der über mehrere Sessions hinweg den Therapiefortschritt einer Patient:in (Fokus Depression F32/F33) visualisiert.

## 1. Datenmodell (additive, lokal in Dexie)

Pro Session werden KPIs extrahiert und gespeichert. Neu auf `SessionEntry`:

```ts
interface SessionKPIs {
  depressionSeverity: number;        // 0–100 (DSI)
  negativeBeliefsCount: number;
  adaptiveBeliefsCount: number;
  positiveActivitiesCount: number;
  activeActivities?: number;
  passiveActivities?: number;
  socialContactsCount: number;
  socialInitiated?: number;
  socialPassive?: number;
  emotionAwareness: number;          // 0–5
  emotionRegulation: number;         // 0–5
  positiveSelfStatements: number;
  negativeSelfStatements?: number;
  notes?: string;
  extractedAt: number;
}
sessionKPIs?: SessionKPIs;
```

Dexie auf v5 hochziehen (additiv, kein neuer Index).

Composite-Metriken berechnet im Frontend:
- **Cognitive Shift Index** = adaptive − negative
- **Depression Recovery Index (DRI)** = gewichteter Score (Symptom invertiert + Cognition + Behavior + Social + Emotion + Self-worth) → 0–100

## 2. KI-Extraktion

Neuer Task `depression-kpi-extract` in `supabase/functions/ai-assist/index.ts` (Gemini 2.5 Pro mit Tool-Calling für strukturiertes JSON). Input: Transcript + optional `kvDocumentation` + `schemaAnalysis`. Output: `SessionKPIs`-Objekt mit konservativen Defaults (0), nur was im Transcript belegt ist.

Auslösung: Button „KPIs extrahieren" pro Session im Dashboard-Header (oder automatisch beim Öffnen, falls fehlend). Gespeichert via `db.sessions.put`.

## 3. UI / Komponenten

Neuer Tab in `SessionEdit.tsx`:
```
[ KV-Verlauf ] [ CBT-Schemata ] [ Therapieverlauf ] [ Folien ]
```

Da der Verlauf patientenübergreifend (alle Sessions des Patienten) ist, lädt die Komponente `db.sessions.where('patientId').equals(patientId)` und sortiert nach Datum.

Neue Datei `src/components/TherapieverlaufDashboard.tsx` mit internen Sub-Tabs:

```
[ Overview ] [ Symptoms ] [ Cognitive Shift ] [ Behavior ] [ Social ] [ Emotion ] [ Self-Worth ]
```

### Overview
- **DRI Big Number** mit Trend-Pfeil (aktuell vs. erste Session)
- Mini-Sparklines für jede der 6 KPI-Kategorien
- Session-Count + Zeitraum

### Symptoms (DSI)
- Area-Chart (Recharts `AreaChart`) mit Gradient rot→gelb→grün
- X: Session-Nummer, Y: 0–100

### Cognitive Shift
- Dual Line Chart: rote Linie (negative), grüne Linie (adaptive)
- Darunter: Cognitive Shift Index als Bar Chart pro Session

### Behavior
- Stacked Bar Chart: active (grün) + passive (grau)
- Tooltip mit Totals

### Social
- Line Chart mit Dots, Tooltip zeigt initiated vs. passive

### Emotion Regulation
- Step Chart (Recharts `LineChart type="step"`) für Awareness + Regulation (0–5)
- Daneben Milestone-Liste mit Checkmarks (erreicht, wenn Score ≥ Schwelle)

### Self-Worth
- Line Chart positive self statements; optional zweite Linie negative

## 4. Verwendete Bibliothek

`recharts` ist bereits via `chart.tsx` im Projekt. Keine neuen Dependencies.

## 5. Edge Cases

- 0 Sessions mit KPIs → Empty State mit CTA „KPIs für diese Session extrahieren"
- 1 Session → Charts mit einem Datenpunkt + Hinweis „mind. 2 Sessions für Trends"
- Patient hat keine Depression-Diagnose → Banner „Dashboard optimiert für F32/F33", aber trotzdem nutzbar
- Manuelle Korrektur: Edit-Dialog pro Session, um KI-Werte zu überschreiben (Therapeut bleibt im Lead)

## 6. Dateien

**Neu:**
- `src/components/TherapieverlaufDashboard.tsx` (Haupt-View mit Sub-Tabs)
- `src/components/kpi/SymptomChart.tsx`, `CognitiveShiftChart.tsx`, `BehaviorChart.tsx`, `SocialChart.tsx`, `EmotionChart.tsx`, `SelfWorthChart.tsx`, `DRIOverview.tsx`, `KPIEditDialog.tsx`
- `src/lib/kpiTypes.ts` (Typen + DRI-Berechnung)

**Geändert:**
- `src/lib/db.ts` (v5, `sessionKPIs` Feld)
- `src/pages/SessionEdit.tsx` (neuer Tab)
- `supabase/functions/ai-assist/index.ts` (neuer Task)
- `src/lib/ai/provider.ts` (Task-Typ)

## Offene Fragen

1. Soll das Dashboard nur depressions-spezifisch sein, oder generisch mit Depression als Default? (Plan: Default Depression, später erweiterbar.)
2. KPI-Extraktion automatisch beim Öffnen oder nur manuell per Button? (Plan: manuell, um Kosten/Latenz zu kontrollieren.)
