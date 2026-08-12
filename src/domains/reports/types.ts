// Domain types for reports (die 10 Berichtsarten).
// TODO: define report kinds/schemas here, aligned with docs/report-schema.json.

// ============== Psychotherapeutischer Befund ==============
// Struktur laut prompts/befund.v1.md. Anders als Stundenprotokoll/Anamnese
// speist sich dieser Bericht aus bereits strukturierten Dokumenten
// (AnamneseProfile + KVDocumentation[]), nicht aus rohen Transkripten.

export type DiagnoseSicherheit = "G" | "V" | "A" | "Z"; // gesichert / Verdacht auf / ausgeschlossen / Zustand nach
export type DiagnoseTyp = "Hauptdiagnose" | "Nebendiagnose";

export interface BefundDiagnoseEintrag {
  icd10_code: string; // leer, wenn im Quellmaterial kein Code vorliegt
  bezeichnung: string;
  diagnosesicherheit: DiagnoseSicherheit;
  typ: DiagnoseTyp;
}

export interface BefundDiagnose {
  diagnosen: BefundDiagnoseEintrag[];
  differentialdiagnosen: string[];
  freitext_einordnung: string;
}

/** Psychopathologischer Befund, strukturiert nach dem AMDP-System. */
export interface PsychopathologischerBefund {
  bewusstsein: string;
  orientierung: string;
  aufmerksamkeit_gedaechtnis: string;
  formales_denken: string;
  befuerchtungen_zwaenge: string;
  wahn: string;
  sinnestaeuschungen: string;
  ich_stoerungen: string;
  affektivitaet: string;
  antrieb_psychomotorik: string;
  zirkadiane_besonderheiten: string;
  andere_stoerungen: string;
  /** Pflichtfeld trotz AMDP-Einordnung unter "Andere Störungen" – Sicherheitsrelevanz. */
  suizidalitaet: string;
  zusatzmerkmale: string;
}

export interface BefundTherapieempfehlung {
  verfahren: string;
  setting: string;
  frequenz: string;
  /** Freitext-Empfehlung – niemals eine verbindliche Stundenzahl erfinden. */
  stundenkontingent_empfehlung: string;
  prognose: string;
  weitere_empfehlungen: string[];
}

export interface PsychotherapeutischerBefund {
  anlass_der_behandlung: string;
  symptomatik: string;
  diagnose: BefundDiagnose;
  psychopathologischer_befund: PsychopathologischerBefund;
  therapieempfehlung: BefundTherapieempfehlung;
}

export const BEFUND_SECTION_LABELS: Record<keyof PsychotherapeutischerBefund, string> = {
  anlass_der_behandlung: "Anlass der Behandlung",
  symptomatik: "Symptomatik",
  diagnose: "Diagnose",
  psychopathologischer_befund: "Psychopathologischer Befund",
  therapieempfehlung: "Therapieempfehlung",
};

export const BEFUND_SECTION_ORDER: (keyof PsychotherapeutischerBefund)[] = [
  "anlass_der_behandlung",
  "symptomatik",
  "diagnose",
  "psychopathologischer_befund",
  "therapieempfehlung",
];

export const AMDP_FIELD_LABELS: Record<keyof PsychopathologischerBefund, string> = {
  bewusstsein: "Bewusstsein",
  orientierung: "Orientierung",
  aufmerksamkeit_gedaechtnis: "Aufmerksamkeit und Gedächtnis",
  formales_denken: "Formales Denken",
  befuerchtungen_zwaenge: "Befürchtungen und Zwänge",
  wahn: "Wahn",
  sinnestaeuschungen: "Sinnestäuschungen",
  ich_stoerungen: "Ich-Störungen",
  affektivitaet: "Affektivität",
  antrieb_psychomotorik: "Antrieb und Psychomotorik",
  zirkadiane_besonderheiten: "Zirkadiane Besonderheiten",
  andere_stoerungen: "Andere Störungen",
  suizidalitaet: "Suizidalität",
  zusatzmerkmale: "Zusatzmerkmale",
};
