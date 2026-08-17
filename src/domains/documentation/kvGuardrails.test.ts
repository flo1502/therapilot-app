import { describe, it, expect } from "vitest";
import { validateKVDocumentation } from "./kvGuardrails";
import type { KVDocumentation } from "./kvDocTypes";

// Diese Tests halten die klinischen Regeln fest, die kvGuardrails durchsetzt.
// Sie sind bewusst an der Regel formuliert ("verlangt eine Aussage zu
// Suizidalität"), nicht an der Implementierung – die Formulierung der
// Meldungen darf sich ändern, das Verhalten nicht.

/** Regelkonforme Dokumentation als Ausgangspunkt; einzelne Felder werden je Test überschrieben. */
function validDoc(overrides: Partial<KVDocumentation> = {}): KVDocumentation {
  return {
    aktuelle_symptomatik: "Die Patientin berichtet weiterhin gedrückte Stimmung.",
    inhalte_der_sitzung: "Besprochen wurde der Umgang mit dem Tagesablauf.",
    therapeutische_interventionen: "Eingesetzt wurden Verhaltensaktivierung und Psychoedukation.",
    verlauf_und_einschaetzung: "Die Umsetzung der Absprachen gelingt nach eigener Angabe.",
    vereinbarungen: "Vereinbart wurde ein Wochenplan mit drei Aktivitäten.",
    risikoabklaerung: "Suizidalität wurde exploriert und aktuell verneint.",
    administrative_hinweise: "",
    ...overrides,
  };
}

const hasError = (errors: string[], fragment: string) =>
  errors.some((e) => e.toLowerCase().includes(fragment.toLowerCase()));

describe("validateKVDocumentation", () => {
  it("akzeptiert eine regelkonforme Dokumentation", () => {
    const r = validateKVDocumentation(validDoc());
    expect(r.errors).toEqual([]);
    expect(r.valid).toBe(true);
  });

  it("gilt genau dann als gültig, wenn keine Fehler vorliegen", () => {
    const ok = validateKVDocumentation(validDoc());
    const broken = validateKVDocumentation(validDoc({ aktuelle_symptomatik: "" }));
    expect(ok.valid).toBe(ok.errors.length === 0);
    expect(broken.valid).toBe(broken.errors.length === 0);
    expect(broken.valid).toBe(false);
  });

  describe("Suizidalität ist Pflicht", () => {
    it("meldet eine Risikoabklärung ohne Aussage zu Suizidalität als Fehler", () => {
      const r = validateKVDocumentation(
        validDoc({ risikoabklaerung: "Keine besonderen Vorkommnisse in dieser Sitzung." }),
      );
      expect(hasError(r.errors, "suizidalität")).toBe(true);
      expect(r.valid).toBe(false);
    });

    it("akzeptiert 'nicht exploriert' als gültige Aussage", () => {
      // Eine negative Aussage zeigt, dass die Frage gestellt wurde. Eine fehlende
      // Aussage zeigt gar nichts – das ist der Grund für diese Regel.
      const r = validateKVDocumentation(
        validDoc({ risikoabklaerung: "Suizidalität wurde in dieser Sitzung nicht exploriert." }),
      );
      expect(hasError(r.errors, "suizidalität")).toBe(false);
    });

    it("akzeptiert auch verwandte Risikobegriffe", () => {
      for (const text of [
        "Kein Hinweis auf Selbstverletzung oder Suizidgedanken.",
        "Pat. verneint lebensmüde Gedanken.",
        "Keine Selbstgefährdung erkennbar.",
      ]) {
        const r = validateKVDocumentation(validDoc({ risikoabklaerung: text }));
        expect(hasError(r.errors, "suizidalität"), `für: ${text}`).toBe(false);
      }
    });

    it("meldet eine komplett leere Risikoabklärung ebenfalls als Fehler", () => {
      // Greift über die Pflichtsektions-Regel, nicht über die Suizidalitäts-Regel –
      // gemeldet wird es so oder so.
      const r = validateKVDocumentation(validDoc({ risikoabklaerung: "" }));
      expect(r.valid).toBe(false);
      expect(r.errors.length).toBeGreaterThan(0);
    });
  });

  describe("Pflichtsektionen", () => {
    it("meldet eine leere Pflichtsektion", () => {
      const r = validateKVDocumentation(validDoc({ inhalte_der_sitzung: "" }));
      expect(hasError(r.errors, "Inhalte der Sitzung")).toBe(true);
    });

    it("lässt administrative Hinweise leer, ohne das als Fehler zu werten", () => {
      // Nichts erfinden ist hier ausdrücklich gewollt.
      const r = validateKVDocumentation(validDoc({ administrative_hinweise: "" }));
      expect(hasError(r.errors, "Administrative")).toBe(false);
    });

    it("warnt bei sehr kurzen Sektionen, ohne ungültig zu werden", () => {
      const r = validateKVDocumentation(validDoc({ vereinbarungen: "Keine." }));
      expect(r.warnings.length).toBeGreaterThan(0);
      expect(r.valid).toBe(true);
    });
  });

  describe("Stilregeln", () => {
    it("erkennt direkte Rede als Fehler", () => {
      const r = validateKVDocumentation(
        validDoc({
          inhalte_der_sitzung: 'Die Patientin sagte: "Ich fühle mich seit Wochen völlig leer".',
        }),
      );
      expect(hasError(r.errors, "direkte rede")).toBe(true);
    });

    it("lässt kurze Anführungen durchgehen", () => {
      const r = validateKVDocumentation(
        validDoc({ inhalte_der_sitzung: 'Thema war das Stichwort "Rückfall" im Tagesablauf.' }),
      );
      expect(hasError(r.errors, "direkte rede")).toBe(false);
    });

    it("erkennt spekulative Diagnose-Formulierungen als Fehler", () => {
      for (const text of [
        "Die Patientin wirkt depressiv und zurückgezogen.",
        "Vermutlich ängstlich getönte Grundstimmung.",
        "Möglicherweise traumatisiert nach eigener Schilderung.",
      ]) {
        const r = validateKVDocumentation(validDoc({ verlauf_und_einschaetzung: text }));
        expect(hasError(r.errors, "diagnose"), `für: ${text}`).toBe(true);
      }
    });

    it("lässt eine dokumentierte Einschätzung ohne Spekulation zu", () => {
      const r = validateKVDocumentation(
        validDoc({
          verlauf_und_einschaetzung:
            "Die im Vorbefund genannte Diagnose F32.1 wurde nicht neu bewertet.",
        }),
      );
      expect(hasError(r.errors, "diagnose")).toBe(false);
    });

    it("warnt bei wertenden Begriffen, ohne die Dokumentation ungültig zu machen", () => {
      const r = validateKVDocumentation(
        validDoc({ verlauf_und_einschaetzung: "Die Termine wurden leider nicht eingehalten." }),
      );
      expect(r.warnings.some((w) => w.includes("leider"))).toBe(true);
      expect(r.valid).toBe(true);
    });
  });

  describe("Pseudonymisierung", () => {
    it("meldet einen Klartext-Namen als Fehler", () => {
      const r = validateKVDocumentation(
        validDoc({ inhalte_der_sitzung: "Besprochen wurde der Tagesablauf von Kaufmann." }),
        "P-2026-001",
        "Anna Kaufmann",
      );
      expect(hasError(r.errors, "Kaufmann")).toBe(true);
    });

    it("meldet nichts, wenn kein Klarname vorkommt", () => {
      const r = validateKVDocumentation(validDoc(), "P-2026-001", "Anna Kaufmann");
      expect(hasError(r.errors, "Kaufmann")).toBe(false);
    });
  });

  describe("Score", () => {
    it("wiegt einen Fehler schwerer als eine Warnung", () => {
      const clean = validateKVDocumentation(validDoc());
      const warned = validateKVDocumentation(
        validDoc({ verlauf_und_einschaetzung: "Der Verlauf ist leider stockend." }),
      );
      const errored = validateKVDocumentation(
        validDoc({ risikoabklaerung: "Keine besonderen Vorkommnisse." }),
      );

      expect(warned.score).toBeLessThan(clean.score);
      expect(errored.score).toBeLessThan(warned.score);
    });

    it("bleibt im Bereich 0 bis 100", () => {
      const brokenEverywhere = validateKVDocumentation({
        aktuelle_symptomatik: "",
        inhalte_der_sitzung: "",
        therapeutische_interventionen: "",
        verlauf_und_einschaetzung: "Pat. wirkt depressiv.",
        vereinbarungen: "",
        risikoabklaerung: "Nichts Besonderes.",
        administrative_hinweise: "",
      });
      expect(brokenEverywhere.score).toBeGreaterThanOrEqual(0);
      expect(brokenEverywhere.score).toBeLessThanOrEqual(100);
      expect(brokenEverywhere.valid).toBe(false);
    });
  });
});
