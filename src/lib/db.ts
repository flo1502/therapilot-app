import Dexie, { Table } from "dexie";

export type TherapyApproach = "KVT" | "ACT" | "Schematherapie" | "Tiefenpsych." | "Systemisch" | "Andere";

export interface Patient {
  id: string;                // pseudonym, e.g. P-2024-007
  createdAt: number;
  updatedAt: number;
  // Encrypted fields (legacy, vor Cloud-Sync) — bleiben für Abwärtskompatibilität.
  encName?: string;
  encNotes?: string;
  // Plaintext (für geteilten Cloud-Modus). Werden beim Speichern in PatientEdit verwendet.
  name?: string;
  notes?: string;
  // Plaintext (pseudonymisiert, nicht-identifizierend)
  ageGroup?: string;         // z.B. "30-40"
  gender?: string;
  approach: TherapyApproach;
  diagnoses: string[];       // ICD-Tags
  goals: string;             // Therapieziele
  startDate?: string;
  active: boolean;

  // Anamnese-Profil (additiv, aufgebaut aus Sessions 1–7)
  anamneseProfile?: import("./anamneseTypes").AnamneseProfile;
  anamneseUpdatedAt?: number;

  // Psychotherapeutischer Befund (additiv), erzeugt aus Anamnese + Stundenprotokollen
  psychotherapeutischerBefund?: import("../domains/reports/types").PsychotherapeutischerBefund;
  befundUpdatedAt?: number;

  // Hinweis: Das Vorbereitungs-Briefing ("Aktueller Stand") liegt bewusst NICHT
  // hier, sondern gerätelokal in `settings` – siehe briefingSettingsKey() in
  // src/domains/documentation/types.ts. Grund: pullAll() ersetzt Patient-Zeilen
  // per bulkPut vollständig durch die Cloud-Kopie. Ein abgeleiteter Cache würde
  // dabei verloren gehen und bei jedem Seitenaufruf einen neuen KI-Call auslösen.
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

  // KV-Verlaufsdokumentation (additive, optional)
  transcript?: string;
  kvDocumentation?: import("./kvDocTypes").KVDocumentation;
  kvExtraction?: import("./kvDocTypes").KVExtraction;
  kvValidation?: {
    score: number;
    errors: string[];
    warnings: string[];
    generatedAt: number;
  };

  // CBT-Schema-Analyse (additive, optional)
  schemaAnalysis?: import("./schemaTypes").SchemaAnalysisResult;
  schemaAnalyzedAt?: number;

  // Depression KPI Tracking (additive, optional)
  sessionKPIs?: import("./kpiTypes").SessionKPIs;

  // Abgehakte "Nächste Schritte" aus der KV-Doku (additive, optional)
  naechsteSchritteDone?: string[];
}

export interface AppSetting {
  key: string;
  value: any;
}

class TheraPilotDB extends Dexie {
  patients!: Table<Patient, string>;
  sessions!: Table<SessionEntry, string>;
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
    // v3: additive – neue Session-Felder (transcript, kvDocumentation, kvExtraction,
    // kvValidation) sind optional und brauchen keinen neuen Index.
    this.version(3).stores({
      patients: "id, updatedAt, active, approach, curriculumDiagnose",
      sessions: "id, patientId, date, createdAt",
      decks: "id, patientId, updatedAt",
      settings: "key",
    });
    // v4: additive – CBT-Schema-Analyse Felder, optional, keine neuen Indizes.
    this.version(4).stores({
      patients: "id, updatedAt, active, approach, curriculumDiagnose",
      sessions: "id, patientId, date, createdAt",
      decks: "id, patientId, updatedAt",
      settings: "key",
    });
    // v5: additive – sessionKPIs für Depression-Dashboard, keine neuen Indizes.
    this.version(5).stores({
      patients: "id, updatedAt, active, approach, curriculumDiagnose",
      sessions: "id, patientId, date, createdAt",
      decks: "id, patientId, updatedAt",
      settings: "key",
    });
    // v6: additive – anamneseProfile am Patient, keine neuen Indizes.
    this.version(6).stores({
      patients: "id, updatedAt, active, approach, curriculumDiagnose",
      sessions: "id, patientId, date, createdAt",
      decks: "id, patientId, updatedAt",
      settings: "key",
    });
    // v7: additive – naechsteSchritteDone an der Session, keine neuen Indizes.
    this.version(7).stores({
      patients: "id, updatedAt, active, approach, curriculumDiagnose",
      sessions: "id, patientId, date, createdAt",
      decks: "id, patientId, updatedAt",
      settings: "key",
    });
    // v8: additive – psychotherapeutischer Befund am Patient, keine neuen Indizes.
    this.version(8).stores({
      patients: "id, updatedAt, active, approach, curriculumDiagnose",
      sessions: "id, patientId, date, createdAt",
      decks: "id, patientId, updatedAt",
      settings: "key",
    });
    // v9: Slide-Decks-Feature entfernt – decks-Tabelle wird gedroppt, curriculumDiagnose-Index
    // entfällt (Feld selbst existiert nicht mehr auf Patient). Bestehende lokale Deck-Daten
    // gehen beim Upgrade verloren – bewusst, siehe CLAUDE.md-Historie.
    this.version(9).stores({
      patients: "id, updatedAt, active, approach",
      sessions: "id, patientId, date, createdAt",
      decks: null,
      settings: "key",
    });
    // v10: keine Strukturänderung – das Vorbereitungs-Briefing liegt als
    // abgeleiteter Cache in der bestehenden settings-Tabelle.
    this.version(10).stores({
      patients: "id, updatedAt, active, approach",
      sessions: "id, patientId, date, createdAt",
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
