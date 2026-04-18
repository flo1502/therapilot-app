// Behandlungsschritte (Phasen einer Sitzung / eines Therapieabschnitts)
// Jeder Schritt mappt auf passende Template-IDs und Such-Tags

export interface TreatmentStep {
  id: string;
  label: string;
  description: string;
  templateIds: string[];   // bevorzugte Templates aus templates.ts
  tags: string[];          // Suchbegriffe für Patienten-Decks & AI-Auswahl
}

export const TREATMENT_STEPS: TreatmentStep[] = [
  {
    id: "psychoedukation",
    label: "Psychoedukation",
    description: "Störungsmodell vermitteln, Verständnis schaffen",
    templateIds: ["psychoed-angst", "psychoed-depression", "achtsamkeit-basis"],
    tags: ["Psychoedukation", "Modell", "Erklärung"],
  },
  {
    id: "verhaltensanalyse",
    label: "Verhaltensanalyse",
    description: "SORKC, ABC – Funktion des Verhaltens verstehen",
    templateIds: ["kvt-sorkc", "kvt-gedankenprotokoll"],
    tags: ["SORKC", "Verhaltensanalyse", "ABC"],
  },
  {
    id: "kognitive-umstrukturierung",
    label: "Kognitive Umstrukturierung",
    description: "Dysfunktionale Gedanken erkennen & prüfen",
    templateIds: ["kvt-gedankenprotokoll", "act-defusion"],
    tags: ["Gedanken", "Umstrukturierung", "Defusion"],
  },
  {
    id: "exposition",
    label: "Exposition / Aktivierung",
    description: "Konfrontation, Verhaltensaktivierung, Hierarchie",
    templateIds: ["psychoed-angst", "psychoed-depression"],
    tags: ["Exposition", "Aktivierung", "Hierarchie"],
  },
  {
    id: "werte-ziele",
    label: "Werte & Ziele",
    description: "Werteklärung, Lebensbereiche, Sinnorientierung",
    templateIds: ["act-werte"],
    tags: ["Werte", "Ziele", "ACT"],
  },
  {
    id: "achtsamkeit",
    label: "Achtsamkeit & Emotionsregulation",
    description: "Atemanker, Bodyscan, Distanzierung",
    templateIds: ["achtsamkeit-basis", "act-defusion"],
    tags: ["Achtsamkeit", "Atem", "Emotionsregulation"],
  },
  {
    id: "schema-modi",
    label: "Schema- / Modus-Arbeit",
    description: "Modi erkennen, gesunder Erwachsener stärken",
    templateIds: ["schema-modi"],
    tags: ["Schema", "Modi", "Inneres Kind"],
  },
  {
    id: "abschluss",
    label: "Rückfallprophylaxe / Abschluss",
    description: "Zusammenfassung, Frühwarnzeichen, Notfallplan",
    templateIds: ["psychoed-depression", "act-werte"],
    tags: ["Rückfall", "Abschluss", "Notfallplan"],
  },
];

export function getTreatmentStep(id: string) {
  return TREATMENT_STEPS.find(s => s.id === id);
}
