// KV-konforme Verlaufsdokumentation – Typen

export type InterventionKind =
  | "Psychoedukation"
  | "KVT"
  | "Exposition"
  | "Kognitive Umstrukturierung"
  | "Verhaltensanalyse"
  | "Skills-Training"
  | "Achtsamkeit"
  | "Validierung"
  | "Sokratischer Dialog"
  | "Ressourcenaktivierung"
  | "Imagination"
  | "Hausaufgaben-Besprechung"
  | "Krisenintervention"
  | "Sonstiges";

export interface ExtractedIntervention {
  kind: InterventionKind;
  beschreibung: string; // knapp, neutral
}

export interface RiskAssessment {
  suizidalitaet: string;        // Pflicht – "nicht thematisiert" falls leer
  fremdgefahrdung?: string;
  selbstverletzung?: string;
  substanzkonsum?: string;
  sonstige?: string;
}

export interface AbrechnungsHinweise {
  sitzungsformat?: string;      // Einzel / Gruppe / Bezugsperson
  dauerMin?: number;
  besonderheiten?: string;      // z.B. Akutsitzung, Krisenintervention
  ziffer_hinweise?: string[];   // KEINE verbindlichen EBM-Ziffern, nur Hinweise
}

export interface KVExtraction {
  symptome: string[];
  themen: string[];
  interventionen: ExtractedIntervention[];
  vereinbarungen: string[];      // Hausaufgaben, Folgesitzung etc.
  risiken: RiskAssessment;
  verlauf_indikatoren: string[]; // Beobachtungen zu Fortschritt/Stagnation
  abrechnung: AbrechnungsHinweise;
}

export interface KVDocumentation {
  aktuelle_symptomatik: string;
  inhalte_der_sitzung: string;
  therapeutische_interventionen: string;
  verlauf_und_einschaetzung: string;
  vereinbarungen: string;
  risikoabklaerung: string;
  administrative_hinweise: string;
}

export interface KVValidationResult {
  valid: boolean;
  score: number;            // 0-100
  errors: string[];
  warnings: string[];
}

export interface KVDocumentationResult {
  extraction: KVExtraction;
  documentation: KVDocumentation;
}

export const KV_SECTION_LABELS: Record<keyof KVDocumentation, string> = {
  aktuelle_symptomatik: "Aktuelle Symptomatik",
  inhalte_der_sitzung: "Inhalte der Sitzung",
  therapeutische_interventionen: "Therapeutische Interventionen",
  verlauf_und_einschaetzung: "Verlauf und Einschätzung",
  vereinbarungen: "Vereinbarungen",
  risikoabklaerung: "Risikoabklärung",
  administrative_hinweise: "Administrative / Abrechnungsrelevante Hinweise",
};

export const KV_SECTION_ORDER: (keyof KVDocumentation)[] = [
  "aktuelle_symptomatik",
  "inhalte_der_sitzung",
  "therapeutische_interventionen",
  "verlauf_und_einschaetzung",
  "vereinbarungen",
  "risikoabklaerung",
  "administrative_hinweise",
];

export function kvDocumentationToMarkdown(doc: KVDocumentation): string {
  return KV_SECTION_ORDER.map(
    (k) => `**${KV_SECTION_LABELS[k]}**\n${doc[k]?.trim() || "—"}`
  ).join("\n\n");
}
