import { describe, it, expect } from "vitest";
import {
  BRIEFING_SESSION_COUNT,
  BriefingCandidate,
  briefingBasisKey,
  briefingSettingsKey,
  selectBriefingSessions,
} from "./types";

// Diese Tests sichern zwei Dinge ab, bei denen ein Fehler klinisch wirksam wäre:
//
//   1. Der "Aktuelle Stand" darf ausschließlich Sitzungen DIESER Patient:in
//      heranziehen. Eine Praxis dokumentiert mehrere Personen am Tag; ein
//      Briefing aus fremden Sitzungen wäre ein Behandlungsfehler, kein Bug.
//   2. Er muss veralten, sobald sich die Datengrundlage ändert – sonst liest
//      die Therapeut:in vor der Sitzung einen überholten Stand.

const TAG = 24 * 60 * 60 * 1000;

function session(
  id: string,
  patientId: string,
  tagOffset: number,
  opts: { dokumentiert?: boolean; generatedAt?: number } = {},
): BriefingCandidate {
  const { dokumentiert = true, generatedAt = 1_000 } = opts;
  return {
    id,
    patientId,
    date: tagOffset * TAG,
    kvDocumentation: dokumentiert ? { aktuelle_symptomatik: "…" } : undefined,
    kvValidation: dokumentiert ? { score: 100, generatedAt } as any : undefined,
  };
}

describe("selectBriefingSessions", () => {
  describe("Trennung nach Person", () => {
    it("zieht ausschließlich Sitzungen der angefragten Person heran", () => {
      const alle = [
        session("A1", "P-001", 1),
        session("B1", "P-002", 2),
        session("A2", "P-001", 3),
        session("B2", "P-002", 4),
      ];

      const gewaehlt = selectBriefingSessions(alle, "P-001");

      expect(gewaehlt.map((s) => s.id)).toEqual(["A2", "A1"]);
      expect(gewaehlt.every((s) => s.patientId === "P-001")).toBe(true);
    });

    it("ignoriert fremde Sitzungen auch dann, wenn sie die neuesten überhaupt sind", () => {
      // Der eigentliche Regressionsschutz: würde global statt nach Person
      // gefiltert, übernähmen die fremden Sitzungen das ganze Fenster.
      const alle = [
        session("EIGEN-1", "P-001", 1),
        session("EIGEN-2", "P-001", 2),
        session("EIGEN-3", "P-001", 3),
        session("FREMD-1", "P-002", 90),
        session("FREMD-2", "P-002", 91),
        session("FREMD-3", "P-002", 92),
      ];

      const gewaehlt = selectBriefingSessions(alle, "P-001");

      expect(gewaehlt.map((s) => s.id)).toEqual(["EIGEN-3", "EIGEN-2", "EIGEN-1"]);
      expect(gewaehlt.some((s) => s.id.startsWith("FREMD"))).toBe(false);
    });

    it("liefert nichts, wenn die Person keine eigenen Sitzungen hat", () => {
      const alle = [session("B1", "P-002", 1), session("B2", "P-002", 2)];
      expect(selectBriefingSessions(alle, "P-001")).toEqual([]);
    });
  });

  describe("Auswahl der Sitzungen", () => {
    it("nimmt nur Sitzungen, die bereits eine KV-Dokumentation haben", () => {
      const alle = [
        session("MIT-DOKU", "P-001", 1),
        session("OHNE-DOKU", "P-001", 5, { dokumentiert: false }),
      ];

      const gewaehlt = selectBriefingSessions(alle, "P-001");

      // Die undokumentierte ist neuer, hat aber nichts zu verdichten.
      expect(gewaehlt.map((s) => s.id)).toEqual(["MIT-DOKU"]);
    });

    it("nimmt höchstens die vorgesehene Anzahl, neueste zuerst", () => {
      const alle = [1, 2, 3, 4, 5, 6].map((n) => session(`S${n}`, "P-001", n));

      const gewaehlt = selectBriefingSessions(alle, "P-001");

      expect(gewaehlt).toHaveLength(BRIEFING_SESSION_COUNT);
      expect(gewaehlt.map((s) => s.id)).toEqual(["S6", "S5", "S4"]);
    });

    it("kommt mit weniger Sitzungen als dem Fenster zurecht", () => {
      const alle = [session("S1", "P-001", 1)];
      expect(selectBriefingSessions(alle, "P-001").map((s) => s.id)).toEqual(["S1"]);
    });

    it("verändert die übergebene Liste nicht", () => {
      const alle = [session("S1", "P-001", 3), session("S2", "P-001", 1)];
      const vorher = alle.map((s) => s.id);
      selectBriefingSessions(alle, "P-001");
      expect(alle.map((s) => s.id)).toEqual(vorher);
    });
  });
});

describe("briefingBasisKey", () => {
  it("bleibt gleich, solange sich die Grundlage nicht ändert", () => {
    const basis = [session("S1", "P-001", 2), session("S2", "P-001", 1)];
    expect(briefingBasisKey(basis)).toBe(briefingBasisKey(basis));
  });

  it("ändert sich, wenn eine neue dokumentierte Sitzung dazukommt", () => {
    const vorher = [session("S2", "P-001", 2), session("S1", "P-001", 1)];
    const nachher = [session("S3", "P-001", 3), ...vorher.slice(0, 2)];

    expect(briefingBasisKey(nachher)).not.toBe(briefingBasisKey(vorher));
  });

  it("ändert sich, wenn eine bestehende Dokumentation nachbearbeitet wird", () => {
    const vorher = [session("S1", "P-001", 1, { generatedAt: 1_000 })];
    const nachher = [session("S1", "P-001", 1, { generatedAt: 2_000 })];

    // Gleiche Sitzung, neuer Bearbeitungszeitpunkt – der Stand muss nachziehen.
    expect(briefingBasisKey(nachher)).not.toBe(briefingBasisKey(vorher));
  });

  it("unterscheidet Sitzungen mit gleichem Zeitstempel anhand ihrer Kennung", () => {
    const a = [session("S1", "P-001", 1, { generatedAt: 1_000 })];
    const b = [session("S2", "P-001", 1, { generatedAt: 1_000 })];

    expect(briefingBasisKey(a)).not.toBe(briefingBasisKey(b));
  });
});

describe("briefingSettingsKey", () => {
  it("vergibt je Person einen eigenen Schlüssel", () => {
    // Sonst überschriebe der Stand einer Person den einer anderen.
    expect(briefingSettingsKey("P-001")).not.toBe(briefingSettingsKey("P-002"));
  });
});
