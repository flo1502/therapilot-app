// CBT-Schema-Analyse Typen

export const SCHEMA_CATEGORIES = [
  "Defekt / Scham",
  "Versagen / Unzulänglichkeit",
  "Gefahr / Unsicherheit",
  "Verlassenwerden",
  "Misstrauen / Bewertung durch andere",
  "Kontrollverlust",
] as const;

export type SchemaCategory = typeof SCHEMA_CATEGORIES[number];

export interface SchemaExample {
  trigger_sentence: string;
  context: string;
  timestamp?: string;
}

export interface SchemaGroup {
  type: SchemaCategory;
  count: number;
  chat_preview: string;
  examples: SchemaExample[];
}

export interface SchemaAnalysisResult {
  session_id: string;
  schema_summary_chat: SchemaGroup[];
  generatedAt: number;
}
