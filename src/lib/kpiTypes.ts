// Depression KPI Tracking - additive types & helpers

export interface SessionKPIs {
  depressionSeverity: number;        // 0-100 (DSI)
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

export function cognitiveShiftIndex(k: SessionKPIs): number {
  return (k.adaptiveBeliefsCount ?? 0) - (k.negativeBeliefsCount ?? 0);
}

// Depression Recovery Index (0-100), gewichteter Composite
// Symptom invertiert + Cognition + Behavior + Social + Emotion + Self-worth
export function depressionRecoveryIndex(k: SessionKPIs): number {
  const symptomScore = 100 - clamp(k.depressionSeverity, 0, 100);          // ↓ symptom = ↑ recovery
  const cogTotal = (k.adaptiveBeliefsCount + k.negativeBeliefsCount) || 1;
  const cogScore = clamp((k.adaptiveBeliefsCount / cogTotal) * 100, 0, 100);
  const behScore = clamp(k.positiveActivitiesCount * 14, 0, 100);          // 7+ Aktivitäten ≈ Maximum
  const socScore = clamp(k.socialContactsCount * 14, 0, 100);
  const emoScore = clamp(((k.emotionAwareness + k.emotionRegulation) / 10) * 100, 0, 100);
  const selfScore = clamp(k.positiveSelfStatements * 14, 0, 100);

  return Math.round(
    symptomScore * 0.25 +
    cogScore * 0.2 +
    behScore * 0.15 +
    socScore * 0.1 +
    emoScore * 0.15 +
    selfScore * 0.15
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n || 0));
}

export function trendArrow(curr: number, prev: number): "up" | "down" | "flat" {
  const diff = curr - prev;
  if (Math.abs(diff) < 2) return "flat";
  return diff > 0 ? "up" : "down";
}
