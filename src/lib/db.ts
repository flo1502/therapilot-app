import Dexie, { Table } from "dexie";
import type { ICDCode } from "./curriculumTypes";

export type TherapyApproach = "KVT" | "ACT" | "Schematherapie" | "Tiefenpsych." | "Systemisch" | "Andere";

export interface Patient {
  id: string;                // pseudonym, e.g. P-2024-007
  createdAt: number;
  updatedAt: number;
  // Encrypted fields (base64) — only readable with master password
  encName?: string;          // Klarname (verschlüsselt)
  encNotes?: string;         // freie Notizen (verschlüsselt)
  // Plaintext (pseudonymisiert, nicht-identifizierend)
  ageGroup?: string;         // z.B. "30-40"
  gender?: string;
  approach: TherapyApproach;
  diagnoses: string[];       // ICD-Tags
  goals: string;             // Therapieziele
  startDate?: string;
  active: boolean;

  // Curriculum-bezogene Felder (optional, additive)
  curriculumDiagnose?: ICDCode;          // primäre Diagnose für Curriculum-Mapping
  beruf?: string;
  triggers?: string[];                   // Auslöse-Situationen
  hauptsymptome?: string[];
  hauptangstGedanken?: string[];
  vermeidungsVerhalten?: string[];
  ressourcen?: string[];
  lernstil?: "visuell" | "auditiv" | "kinästhetisch" | "lesen";
}

export type SessionFormat = "SOAP" | "VT-Verlauf" | "Frei";

export interface SessionEntry {
  id: string;
  patientId: string;
  date: number;              // timestamp
  durationMin: number;
  rawNotes: string;          // Roh-Notiz aus Sitzung
  structured?: string;       // AI-strukturierte Version
  format: SessionFormat;
  homework?: string;
  nextFocus?: string;
  createdAt: number;
}

export interface SlideDeck {
  id: string;
  patientId?: string;        // optional: personalisiert für Patient
  templateId?: string;
  title: string;
  topic: string;
  slides: Slide[];
  createdAt: number;
  updatedAt: number;
}

// Therapie-spezifische Layout-Typen für visuell reichere Slides.
// "bullets" ist der klassische Fallback. Alle anderen Layouts haben eigene
// strukturierte Felder in `layoutData`. Der Renderer fällt bei fehlenden
// Daten automatisch auf "bullets" zurück.
export type SlideLayout =
  | "bullets"
  | "headline"        // Eine starke Hauptbotschaft
  | "model"           // Modell-Diagramm (Knoten + Pfeile in einer Reihe)
  | "vicious-cycle"   // Teufelskreis (4 Knoten im Kreis)
  | "before-after"    // Vorher/Nachher Vergleich
  | "steps"           // Schritt-für-Schritt-Übung
  | "question"        // Reflexionsfrage mit großer Aufmachung
  | "image";          // Visualisierungs-Bild (Psychoedukation, griffbereit)

export interface SlideLayoutData {
  // headline / question
  headline?: string;
  subline?: string;
  // model
  nodes?: { label: string; description?: string }[];
  // vicious-cycle
  centerLabel?: string;
  cycleNodes?: { label: string; description?: string }[];
  // before-after
  before?: { title: string; items: string[] };
  after?: { title: string; items: string[] };
  // steps
  steps?: { title: string; description?: string }[];
  // image
  imageSrc?: string;
  imageAlt?: string;
  imageCaption?: string;
}

export interface Slide {
  id: string;
  title: string;
  bullets: string[];
  notes?: string;
  layout?: SlideLayout;
  layoutData?: SlideLayoutData;
  iconKey?: string; // Symbol-Key (siehe slideIcons.ts)
}

export interface AppSetting {
  key: string;
  value: any;
}

class TheraPilotDB extends Dexie {
  patients!: Table<Patient, string>;
  sessions!: Table<SessionEntry, string>;
  decks!: Table<SlideDeck, string>;
  settings!: Table<AppSetting, string>;

  constructor() {
    super("therapilot");
    this.version(1).stores({
      patients: "id, updatedAt, active, approach",
      sessions: "id, patientId, date, createdAt",
      decks: "id, patientId, updatedAt",
      settings: "key",
    });
    // v2: additive — neue Patient-Felder (curriculumDiagnose, triggers, ...) sind optional,
    // brauchen keine Index-Änderung. Wir bumpen die Version trotzdem, damit Dexie ein
    // sauberes Upgrade durchführt.
    this.version(2).stores({
      patients: "id, updatedAt, active, approach, curriculumDiagnose",
      sessions: "id, patientId, date, createdAt",
      decks: "id, patientId, updatedAt",
      settings: "key",
    });
  }
}

export const db = new TheraPilotDB();

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export async function nextPatientPseudonym(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `P-${year}-`;
  const all = await db.patients.toArray();
  const max = all
    .map(p => p.id)
    .filter(id => id.startsWith(prefix))
    .map(id => parseInt(id.slice(prefix.length), 10))
    .filter(n => !isNaN(n))
    .reduce((a, b) => Math.max(a, b), 0);
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}
