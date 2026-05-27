// Depression KPI Tracking - additive types & clinical helpers

export type RiskLevel = 0 | 1 | 2 | 3; // none / passive / active / planning
export type ScidConfidence = "low" | "medium" | "high";

export interface ScidProxy {
  coreSymptoms: boolean;
  durationOver2Weeks: boolean;
  functionalImpairment: boolean;
  exclusionOtherDisorder: boolean | null;
  confidence: ScidConfidence;
  likelyDiagnosis?: string;
}

export interface KeyQuote {
  text: string;
  tag: "belief" | "emotion" | "risk" | "activity" | "insight";
}

export interface SessionKPIs {
  // Original
  depressionSeverity: number;        // 0-100
  negativeBeliefsCount: number;
  adaptiveBeliefsCount: number;
  positiveActivitiesCount: number;
  activeActivities?: number;
  passiveActivities?: number;
  socialContactsCount: number;
  socialInitiated?: number;
  socialPassive?: number;
  emotionAwareness: number;          // 0-5
  emotionRegulation: number;         // 0-5
  positiveSelfStatements: number;
  negativeSelfStatements?: number;
  notes?: string;
  extractedAt: number;

  // v2 – Master-KPI Sub-Signale (0-10 außer wo anders)
  mood?: number;
  anhedonia?: number;
  energy?: number;
  cognition?: number;
  hopelessness?: number;
  selfDeprecation?: number;
  avoidanceCount?: number;
  functioningWork?: number;
  functioningSocial?: number;
  functioningDaily?: number;
  sleepDisturbance?: number;
  psychomotor?: number;
  somaticSymptoms?: number;
  guilt?: number;

  // Risk
  riskLevel?: RiskLevel;
  riskNotes?: string;

  // SCID / CIDI proxy
  scid?: ScidProxy;

  // Drilldown
  keyQuotes?: KeyQuote[];
}

export const EMPTY_KPIS: Omit<SessionKPIs, "extractedAt"> = {
  depressionSeverity: 0,
  negativeBeliefsCount: 0,
  adaptiveBeliefsCount: 0,
  positiveActivitiesCount: 0,
  activeActivities: 0,
  passiveActivities: 0,
  socialContactsCount: 0,
  socialInitiated: 0,
  socialPassive: 0,
  emotionAwareness: 0,
  emotionRegulation: 0,
  positiveSelfStatements: 0,
  negativeSelfStatements: 0,
};

// ============== Helpers ==============

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n || 0));
}
const n = (v?: number) => (typeof v === "number" && !isNaN(v) ? v : 0);

export function cognitiveShiftIndex(k: SessionKPIs): number {
  return (k.adaptiveBeliefsCount ?? 0) - (k.negativeBeliefsCount ?? 0);
}

// ============== Composite Master-KPIs (0-100) ==============

// DSI – Depression Severity Index
export function computeDSI(k: SessionKPIs): number {
  // Wenn Sub-Signale fehlen, falle auf depressionSeverity zurück
  const hasSub = [k.mood, k.anhedonia, k.energy, k.cognition].some(v => typeof v === "number");
  if (!hasSub) return clamp(k.depressionSeverity, 0, 100);
  // Sub-Signale sind "wie krank" (0=gut, 10=schlimm) – mood/energy/cognition invertieren
  const moodSev = 10 - clamp(n(k.mood), 0, 10);
  const anhe = clamp(n(k.anhedonia), 0, 10);
  const energySev = 10 - clamp(n(k.energy), 0, 10);
  const cogSev = 10 - clamp(n(k.cognition), 0, 10);
  const sub = ((moodSev + anhe + energySev + cogSev) / 40) * 100; // 0-100
  // Mische mit globalem DSI für Stabilität
  return Math.round(sub * 0.6 + clamp(k.depressionSeverity, 0, 100) * 0.4);
}

// CDI – Cognitive Distortion Index (0-100, höher = mehr Verzerrung)
export function computeCDI(k: SessionKPIs): number {
  const neg = n(k.negativeBeliefsCount);
  const adp = n(k.adaptiveBeliefsCount);
  const hope = clamp(n(k.hopelessness), 0, 10);
  const sd = clamp(n(k.selfDeprecation), 0, 10);
  const total = neg + adp || 1;
  const beliefDistortion = (neg / total) * 100;
  const hopeScore = (hope / 10) * 100;
  const sdScore = (sd / 10) * 100;
  return Math.round(beliefDistortion * 0.5 + hopeScore * 0.25 + sdScore * 0.25);
}

// BAI – Behavioral Activation Index (0-100, höher = besser)
export function computeBAI(k: SessionKPIs): number {
  const pos = n(k.positiveActivitiesCount);
  const avoid = n(k.avoidanceCount);
  const posScore = clamp(pos * 14, 0, 100);
  const avoidPenalty = clamp(avoid * 10, 0, 60);
  return Math.round(clamp(posScore - avoidPenalty, 0, 100));
}

// Functioning Index (0-100)
export function computeFunctioning(k: SessionKPIs): number {
  const arr = [k.functioningWork, k.functioningSocial, k.functioningDaily]
    .filter((v): v is number => typeof v === "number");
  if (arr.length === 0) return 0;
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.round(clamp((avg / 10) * 100, 0, 100));
}

// Risk Index (raw 0-3)
export function computeRisk(k: SessionKPIs): RiskLevel {
  return (k.riskLevel ?? 0) as RiskLevel;
}

// ============== Rekonstruierte klinische Skalen (AI-mapped) ==============

// PHQ-9 (0-27): affect + cognition + sleep + functioning + anhedonia
export function computePHQ9(k: SessionKPIs): number {
  const moodSev = 10 - clamp(n(k.mood), 0, 10);
  const anhe = clamp(n(k.anhedonia), 0, 10);
  const sleep = clamp(n(k.sleepDisturbance), 0, 10);
  const cogSev = 10 - clamp(n(k.cognition), 0, 10);
  const energySev = 10 - clamp(n(k.energy), 0, 10);
  const psy = clamp(n(k.psychomotor), 0, 10);
  const sd = clamp(n(k.selfDeprecation), 0, 10);
  const funcSev = 10 - (computeFunctioning(k) / 10);
  const risk = (k.riskLevel ?? 0) * (27 / 3);
  // gewichtete Summe → 27
  const raw = (moodSev + anhe + sleep + cogSev + energySev + psy + sd + funcSev) / 80;
  return Math.round(clamp(raw * 24 + risk * 0.1, 0, 27));
}

// BDI-II (0-63): stark kognitiv + Selbstwert + Schuld + Hoffnungslosigkeit
export function computeBDI(k: SessionKPIs): number {
  const hope = clamp(n(k.hopelessness), 0, 10);
  const sd = clamp(n(k.selfDeprecation), 0, 10);
  const guilt = clamp(n(k.guilt), 0, 10);
  const moodSev = 10 - clamp(n(k.mood), 0, 10);
  const anhe = clamp(n(k.anhedonia), 0, 10);
  const neg = n(k.negativeBeliefsCount);
  const adp = n(k.adaptiveBeliefsCount);
  const total = neg + adp || 1;
  const beliefDist = (neg / total) * 10;
  const raw = (hope * 1.5 + sd * 1.5 + guilt * 1.2 + moodSev + anhe + beliefDist) / 73;
  return Math.round(clamp(raw * 63, 0, 63));
}

// HAM-D (0-52): klinisch – Schlaf, Psychomotorik, Somatik
export function computeHAMD(k: SessionKPIs): number {
  const sleep = clamp(n(k.sleepDisturbance), 0, 10);
  const psy = clamp(n(k.psychomotor), 0, 10);
  const som = clamp(n(k.somaticSymptoms), 0, 10);
  const energySev = 10 - clamp(n(k.energy), 0, 10);
  const moodSev = 10 - clamp(n(k.mood), 0, 10);
  const guilt = clamp(n(k.guilt), 0, 10);
  const risk = (k.riskLevel ?? 0) * (52 / 3) * 0.15;
  const raw = (sleep + psy * 1.3 + som * 1.3 + energySev + moodSev + guilt) / 70;
  return Math.round(clamp(raw * 50 + risk, 0, 52));
}

// PHQ Schwellen (klinisch): 5 leicht, 10 moderat, 15 mittelschwer, 20 schwer
// BDI: 14 leicht, 20 moderat, 29 schwer
// HAM-D: 8 leicht, 14 moderat, 19 schwer, 23 sehr schwer

export const PHQ_THRESHOLDS = { mild: 5, moderate: 10, modSevere: 15, severe: 20, max: 27 };
export const BDI_THRESHOLDS = { mild: 14, moderate: 20, severe: 29, max: 63 };
export const HAMD_THRESHOLDS = { mild: 8, moderate: 14, severe: 19, verySevere: 23, max: 52 };

// Depression Recovery Index (0-100)
export function depressionRecoveryIndex(k: SessionKPIs): number {
  const symptomScore = 100 - computeDSI(k);
  const cogScore = 100 - computeCDI(k);
  const behScore = computeBAI(k);
  const socScore = clamp(n(k.socialContactsCount) * 14, 0, 100);
  const emoScore = clamp(((n(k.emotionAwareness) + n(k.emotionRegulation)) / 10) * 100, 0, 100);
  const selfScore = clamp(n(k.positiveSelfStatements) * 14, 0, 100);
  const funcScore = computeFunctioning(k) || ((symptomScore + cogScore) / 2);

  return Math.round(
    symptomScore * 0.22 +
    cogScore * 0.18 +
    behScore * 0.13 +
    socScore * 0.1 +
    emoScore * 0.12 +
    selfScore * 0.12 +
    funcScore * 0.13
  );
}

export function trendArrow(curr: number, prev: number, threshold = 2): "up" | "down" | "flat" {
  const diff = curr - prev;
  if (Math.abs(diff) < threshold) return "flat";
  return diff > 0 ? "up" : "down";
}

// ============== Alerts ==============

export interface InsightAlert {
  id: string;
  severity: "info" | "positive" | "warning" | "critical";
  title: string;
  detail: string;
  sessionNr?: number;
}

interface SessionPoint { nr: number; kpis: SessionKPIs }

export function generateAlerts(points: SessionPoint[]): InsightAlert[] {
  const alerts: InsightAlert[] = [];
  if (points.length === 0) return alerts;

  const cdi = points.map(p => ({ nr: p.nr, v: computeCDI(p.kpis) }));
  const bai = points.map(p => ({ nr: p.nr, v: computeBAI(p.kpis) }));
  const fn = points.map(p => ({ nr: p.nr, v: computeFunctioning(p.kpis) }));

  // CDI 3 Sessions monoton fallend
  if (cdi.length >= 3) {
    const last3 = cdi.slice(-3);
    if (last3[0].v > last3[1].v && last3[1].v > last3[2].v) {
      alerts.push({
        id: "cdi-falling",
        severity: "positive",
        title: "Kognitive Verzerrung sinkt",
        detail: `CDI über 3 Sessions monoton gefallen (${last3[0].v} → ${last3[2].v}).`,
        sessionNr: last3[2].nr,
      });
    }
  }

  // BAI signifikant gestiegen
  if (bai.length >= 2) {
    const delta = bai.at(-1)!.v - bai[0].v;
    if (delta >= 20) {
      alerts.push({
        id: "bai-up",
        severity: "positive",
        title: "Behavioral Activation steigt",
        detail: `Aktivierung +${delta} Punkte seit Session 1.`,
        sessionNr: bai.at(-1)!.nr,
      });
    }
  }

  // Functioning drop
  if (fn.length >= 2) {
    const delta = fn.at(-1)!.v - fn[fn.length - 2].v;
    if (delta <= -15) {
      alerts.push({
        id: "fn-drop",
        severity: "warning",
        title: "Funktionsniveau gesunken",
        detail: `Functioning Δ ${delta} zur letzten Sitzung.`,
        sessionNr: fn.at(-1)!.nr,
      });
    }
  }

  // Risk events
  points.forEach(p => {
    const r = p.kpis.riskLevel ?? 0;
    if (r >= 1) {
      alerts.push({
        id: `risk-${p.nr}`,
        severity: r >= 2 ? "critical" : "warning",
        title: r >= 3 ? "Risiko: Planung" : r === 2 ? "Risiko: aktive Ideation" : "Risiko: passive Ideation",
        detail: p.kpis.riskNotes || "Hinweis im Transkript erkannt.",
        sessionNr: p.nr,
      });
    }
  });

  return alerts;
}

// ============== Clinical Summary ==============

export function generateClinicalSummary(points: SessionPoint[]): string[] {
  if (points.length === 0) return [];
  const lines: string[] = [];

  const dsi = points.map(p => computeDSI(p.kpis));
  const cdi = points.map(p => computeCDI(p.kpis));
  const bai = points.map(p => computeBAI(p.kpis));
  const risks = points.map(p => p.kpis.riskLevel ?? 0);

  const monotonic = (arr: number[], dir: "down" | "up") => {
    if (arr.length < 2) return false;
    for (let i = 1; i < arr.length; i++) {
      if (dir === "down" && arr[i] >= arr[i - 1]) return false;
      if (dir === "up" && arr[i] <= arr[i - 1]) return false;
    }
    return true;
  };

  if (dsi.length >= 2 && dsi.at(-1)! < dsi[0]) {
    lines.push(monotonic(dsi.slice(-3), "down")
      ? "Depressive Symptomatik nimmt kontinuierlich ab."
      : "Depressive Symptomatik zeigt insgesamt rückläufigen Verlauf.");
  } else if (dsi.length >= 2 && dsi.at(-1)! > dsi[0]) {
    lines.push("Depressive Symptomatik aktuell zunehmend – Reassessment empfohlen.");
  }

  if (cdi.length >= 2 && cdi.at(-1)! < cdi[0]) {
    lines.push("Kognitive Verzerrungen reduzieren sich über den Verlauf.");
  }

  if (bai.length >= 2 && bai.at(-1)! > bai[0]) {
    lines.push("Aktivitätsniveau steigt – Behavioral Activation greift.");
  }

  const maxRisk = Math.max(...risks);
  if (maxRisk === 0) lines.push("Risiko über alle Sitzungen unauffällig.");
  else if (maxRisk <= 1) lines.push("Risiko aktuell niedrig, passive Ideation phasenweise.");
  else lines.push("Achtung: Risikomarker erhöht – Krisenplan prüfen.");

  return lines;
}
