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
    templateIds: ["behandlung-psychoedukation"],
    tags: ["Psychoedukation", "Modell", "Erklärung", "Vulnerabilität"],
  },
  {
    id: "verhaltensaktivierung",
    label: "Verhaltensaktivierung",
    description: "Aktivitätsaufbau, P/G/B, Depressionsspirale durchbrechen",
    templateIds: ["behandlung-verhaltensaktivierung"],
    tags: ["Verhaltensaktivierung", "Aktivierung", "Aktivitätsplan", "P/G/B"],
  },
  {
    id: "kognitive-therapie",
    label: "Kognitive Therapie",
    description: "Beck'sche Triade, Denkverzerrungen, 5-Spalten-Protokoll",
    templateIds: ["behandlung-kognitive-therapie"],
    tags: ["Kognitiv", "Gedanken", "Umstrukturierung", "Beck"],
  },
  {
    id: "interpersonell",
    label: "Interpersonelle Arbeit",
    description: "IPT-Problembereiche: Trauer, Konflikt, Rollenwechsel, Defizit",
    templateIds: ["behandlung-interpersonell"],
    tags: ["Interpersonell", "IPT", "Beziehung", "Rollenwechsel"],
  },
  {
    id: "achtsamkeit-akzeptanz",
    label: "Achtsamkeit & Akzeptanz",
    description: "ACT-Hexaflex, Defusion, werteorientiertes Handeln",
    templateIds: ["behandlung-achtsamkeit-akzeptanz"],
    tags: ["Achtsamkeit", "Akzeptanz", "ACT", "Defusion", "Werte"],
  },
  {
    id: "rueckfallprophylaxe",
    label: "Rückfallprophylaxe",
    description: "Frühwarnzeichen, Trigger, Notfallplan",
    templateIds: ["behandlung-rueckfallprophylaxe"],
    tags: ["Rückfall", "Frühwarnzeichen", "Notfallplan", "Abschluss"],
  },
];

export function getTreatmentStep(id: string) {
  return TREATMENT_STEPS.find(s => s.id === id);
}
