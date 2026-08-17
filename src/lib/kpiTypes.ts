// Depression-KPI-Datenmodell.
//
// Wird aktuell nur geschrieben (demoSeed) und im Session-Datensatz gehalten –
// es gibt derzeit keine Auswertung dazu. Die Berechnungs- und Alert-Funktionen
// gehörten zum entfernten Therapieverlauf-Dashboard und sind mit ihm entfallen.

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
