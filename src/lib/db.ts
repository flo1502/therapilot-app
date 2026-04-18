import Dexie, { Table } from "dexie";

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

export interface Slide {
  id: string;
  title: string;
  bullets: string[];
  notes?: string;
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
