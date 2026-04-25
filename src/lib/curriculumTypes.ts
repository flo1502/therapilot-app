// src/lib/curriculumTypes.ts
// Shared types for curriculum, guardrails, and personalization.
// NB: Slide & Template are renamed to CurriculumSlide / CurriculumTemplate
// to avoid clashing with the existing UI types in src/lib/db.ts and src/lib/templates.ts.

export type ICDCode = "F41.0" | "F41.1" | "F32" | "F33" | "F42" | "F43.1";

export type LanguageLevel = "A1" | "A1-A2" | "A2" | "A2-B1" | "B1";

export type TherapyApproachKey =
  | "verhaltenstherapie"
  | "tiefenpsychologisch"
  | "systemisch"
  | "schematherapie"
  | "act";

export type TherapyType = "KZT" | "LZT" | "Akut";

export interface StageConfig {
  stadium: number;
  name: string;
  sitzungen: string;
  lernziele: string[];
  erforderliche_inhalte: string[];
  folienthemen: string[];
  sprach_niveau: LanguageLevel;
  tone: string;
  examples_required: boolean;
  beispiel_struktur: string[];
  patient_personalisierung_erforderlich: PersonalizationField[];
  therapeut_notizen: string;
  num_slides?: number;
}

export type PersonalizationField =
  | "patient_name"
  | "patient_beruf"
  | "patient_alter"
  | "patient_erstes_panic_ereignis"
  | "patient_hauptsymptome"
  | "patient_hauptangst"
  | "patient_spezifische_symptome"
  | "patient_spezifische_angst_gedanken"
  | "patient_spezifisches_vermeidungs_verhalten"
  | "patient_trigger_situation"
  | "patient_lieblings_atemtechnik"
  | "patient_lernstil"
  | "patient_tagesablauf_für_übung"
  | "patient_spezifische_vermiedene_situationen"
  | "patient_angst_skala_pro_situation"
  | "patient_lebens_ziele"
  | "patient_hauptangst_gedanken"
  | "patient_beweise_gegen_gedanken"
  | "patient_lieblings_alternative_gedanken"
  | "patient_persönlicher_rückfall_plan"
  | "patient_früh_warnsignale"
  | "patient_selbstständigkeits_ziele";

export interface Curriculum {
  diagnose: ICDCode;
  name: string;
  leitlinie: string;
  evidence_basis: string;
  gesamtdauer: string;
  therapy_types: TherapyType[];
  stadien: StageConfig[];
}

export interface PatientInfo {
  name: string;
  alter?: number;
  beruf?: string;
  triggers?: string[];
  hauptsymptome?: string[];
  hauptangst_gedanken?: string[];
  vermeidungs_verhalten?: string[];
  ressourcen?: string[];
  ziele?: string[];
  lernstil?: "visuell" | "auditiv" | "kinästhetisch" | "lesen";
}

// Curriculum-side slide format (different from UI Slide in db.ts!)
export interface CurriculumSlide {
  title: string;
  bullets: string[];
  example?: string;
  speaker_notes?: string;
}

export interface CurriculumTemplate {
  id: string;
  title: string;
  description?: string;
  approach?: string;
  category?: string;
  tags?: string[];
  slides: CurriculumSlide[];
  requiresPersonalization?: boolean;
  diagnose?: ICDCode;
  stadium?: number;
}

export type ValidationErrorType =
  | "readability"
  | "examples"
  | "content"
  | "tone"
  | "personalization"
  | "slide_count"
  | "structure"
  | "jargon";

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationError {
  type: ValidationErrorType;
  severity: ValidationSeverity;
  message: string;
  slideIndex?: number;
  suggestion?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  score: number;
}

export type GuardrailMode = "strict" | "mild" | "auto-retry";

export interface GuardrailsConfig {
  mode: GuardrailMode;
  maxReadabilityScore: number;
  requireExamples: boolean;
  requirePersonalization: boolean;
  scaryWordsBlocklist: string[];
  jargonRequiringExplanation: string[];
  maxRetries: number;
}

export const DEFAULT_GUARDRAILS_CONFIG: GuardrailsConfig = {
  mode: "auto-retry",
  maxReadabilityScore: 8,
  requireExamples: true,
  requirePersonalization: true,
  scaryWordsBlocklist: [
    "gefahr",
    "gefährlich",
    "unmöglich",
    "hoffnungslos",
    "verrückt",
    "wahnsinnig",
    "katastrophe",
    "tödlich",
  ],
  jargonRequiringExplanation: [
    "amygdala",
    "hypothalamus",
    "noradrenalin",
    "kortisol",
    "präfrontaler kortex",
    "sympathikus",
    "parasympathikus",
    "habituation",
    "extinktion",
    "konditionierung",
    "reziproke hemmung",
  ],
  maxRetries: 2,
};
