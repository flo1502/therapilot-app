// Domain types for documentation (KV-Verlauf, 7 Sektionen).
// TODO: migrate relevant types from src/lib/kvDocTypes.ts here.

// ============== Vorbereitungs-Briefing ("Aktueller Stand") ==============
// Struktur laut prompts/briefing.v1.md. Eingabe sind die KV-Verlaufs-
// dokumentationen der letzten bis zu 3 Sitzungen – KEINE Rohtranskripte.
// Internes Arbeitsmittel: geht nicht an Kassen oder Gutachter:innen.

/** Wie viele dokumentierte Sitzungen maximal ins Briefing einfließen. */
export const BRIEFING_SESSION_COUNT = 3;

export interface SessionBriefing {
  /** Wo die Behandlung inhaltlich steht (2–4 Sätze). */
  stand: string;
  /**
   * Was sich über die herangezogenen Sitzungen hinweg dokumentiert verändert hat.
   * Beschreibt den Befund an den Dokumenten, nicht dessen Deutung – ein fehlendes
   * Symptom gilt nicht als gebessert (siehe prompts/briefing.v1.md).
   */
  veraenderung: string;
  /** Pflichtfeld – nie leer, auch im unauffälligen Fall. Sicherheitsrelevant. */
  risiko_status: string;
  /** Vereinbarungen/Hausaufgaben, die laut Doku offen sind (max. 4). */
  offene_vereinbarungen: string[];
  /** Angesprochene, nicht abgeschlossene Themen (max. 3). Ohne Priorisierung. */
  offene_themen: string[];
  /** Stundenkontingent, Anträge, Fristen – "" wenn nicht dokumentiert. */
  administratives: string;
  /**
   * Datum der herangezogenen Sitzungen (TT.MM.JJJJ), neueste zuerst.
   * Wird NICHT vom Modell erzeugt, sondern clientseitig ergänzt – dem Modell
   * werden die Sitzungen nur positionell benannt, damit echte Sitzungsdaten
   * das Gerät nicht verlassen.
   */
  herangezogene_sitzungen: string[];
  /** Nur gesetzt, wenn die Datengrundlage eingeschränkt ist. Sonst "". */
  hinweis_datenlage: string;
}

/**
 * Signatur der Sitzungen, aus denen ein Briefing erzeugt wurde. Ändert sich
 * die Signatur (neue Sitzung dokumentiert, bestehende KV-Doku überarbeitet),
 * gilt das gespeicherte Briefing als veraltet und wird neu erzeugt.
 */
export function briefingBasisKey(
  sessions: { id: string; kvValidation?: { generatedAt: number } }[],
): string {
  return sessions.map((s) => `${s.id}:${s.kvValidation?.generatedAt ?? 0}`).join("|");
}

/**
 * Schlüssel des gerätelokalen Briefing-Caches in der `settings`-Tabelle.
 * Bewusst nicht am Patient-Datensatz: `pullAll()` in src/lib/cloudSync.ts
 * ersetzt Patient-Zeilen vollständig durch die Cloud-Kopie, wodurch ein dort
 * abgelegter Cache bei jedem Pull verloren ginge – und bei jedem Seitenaufruf
 * einen neuen KI-Call auslösen würde. Die settings-Tabelle wird nicht
 * synchronisiert; das Briefing ist ohnehin jederzeit neu erzeugbar.
 */
export function briefingSettingsKey(patientId: string): string {
  return `briefing:${patientId}`;
}

export interface BriefingCacheEntry {
  briefing: SessionBriefing;
  updatedAt: number;
  /** Ergebnis von briefingBasisKey() zum Zeitpunkt der Erzeugung. */
  basis: string;
}
