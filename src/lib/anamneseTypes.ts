// Anamnese-Profil – strukturiert nach VT-Standard-Bögen 1–3.
// Wird aus den Transkripten der ersten ~7 Sessions extrahiert und gemergt.

export interface AnamneseSource {
  sessionId: string;
  sessionNr?: number;
  quote: string;
}

export interface AnamneseField {
  text: string;
  confidence?: number; // 0..1
  sources?: AnamneseSource[];
}

export interface AnamneseProfile {
  // Bogen 1
  kindheit: {
    selbstbeschreibung: AnamneseField;
    gesundheitszustand: AnamneseField;
    problemeStoerungen: AnamneseField;
    verluste: AnamneseField;
    traumatisierungen: AnamneseField;
    besondereSituationen: AnamneseField;
  };
  eltern: {
    alter: AnamneseField;
    beruf: AnamneseField;
    persoenlichkeit: AnamneseField;
    erziehungsstil: AnamneseField;
    beziehungKommunikation: AnamneseField;
    atmosphaere: AnamneseField;
    geschwister: AnamneseField;
  };
  schule: {
    abschluesse: AnamneseField;
    beziehungMitschuelerLehrer: AnamneseField;
  };
  beruf: {
    ausbildungen: AnamneseField;
    beziehungVorgesetzteKollegen: AnamneseField;
  };
  sexualitaetPartnerschaften: AnamneseField;

  // Bogen 3
  interessenHobbys: AnamneseField;
  ressourcen: AnamneseField;
  aktuelleLebenssituation: {
    wohnen: AnamneseField;
    arbeit: AnamneseField;
    beziehungen: AnamneseField;
    kinder: AnamneseField;
    eltern: AnamneseField;
    krankheiten: AnamneseField;
  };
  symptomanamnese: {
    aktuelleSymptomatik: AnamneseField;
    beginnAusloeser: AnamneseField;
    traumatisierungen: AnamneseField;
    behandlungen: AnamneseField;
    medikation: AnamneseField;
    problemloeseversuche: AnamneseField;
  };
  psychischerBefund: {
    interaktionsverhalten: AnamneseField;
    auftreten: AnamneseField;
    wirkung: AnamneseField;
    denkmuster: AnamneseField;
  };
  persoenlichkeitsstruktur: AnamneseField;
  bewertungVorlaeufigeDiagnose: AnamneseField;

  updatedAt?: number;
  sessionsCovered?: string[]; // sessionIds, die schon eingeflossen sind
}

export function emptyField(): AnamneseField {
  return { text: "", confidence: 0, sources: [] };
}

export function emptyAnamneseProfile(): AnamneseProfile {
  return {
    kindheit: {
      selbstbeschreibung: emptyField(),
      gesundheitszustand: emptyField(),
      problemeStoerungen: emptyField(),
      verluste: emptyField(),
      traumatisierungen: emptyField(),
      besondereSituationen: emptyField(),
    },
    eltern: {
      alter: emptyField(),
      beruf: emptyField(),
      persoenlichkeit: emptyField(),
      erziehungsstil: emptyField(),
      beziehungKommunikation: emptyField(),
      atmosphaere: emptyField(),
      geschwister: emptyField(),
    },
    schule: {
      abschluesse: emptyField(),
      beziehungMitschuelerLehrer: emptyField(),
    },
    beruf: {
      ausbildungen: emptyField(),
      beziehungVorgesetzteKollegen: emptyField(),
    },
    sexualitaetPartnerschaften: emptyField(),
    interessenHobbys: emptyField(),
    ressourcen: emptyField(),
    aktuelleLebenssituation: {
      wohnen: emptyField(),
      arbeit: emptyField(),
      beziehungen: emptyField(),
      kinder: emptyField(),
      eltern: emptyField(),
      krankheiten: emptyField(),
    },
    symptomanamnese: {
      aktuelleSymptomatik: emptyField(),
      beginnAusloeser: emptyField(),
      traumatisierungen: emptyField(),
      behandlungen: emptyField(),
      medikation: emptyField(),
      problemloeseversuche: emptyField(),
    },
    psychischerBefund: {
      interaktionsverhalten: emptyField(),
      auftreten: emptyField(),
      wirkung: emptyField(),
      denkmuster: emptyField(),
    },
    persoenlichkeitsstruktur: emptyField(),
    bewertungVorlaeufigeDiagnose: emptyField(),
    sessionsCovered: [],
  };
}

// Flache Liste aller Felder mit Pfad + Label – für UI-Rendering und Iteration.
export interface FieldSpec {
  path: string;          // z.B. "kindheit.selbstbeschreibung"
  section: string;       // z.B. "Kindheit"
  label: string;         // z.B. "Selbstbeschreibung"
}

export const ANAMNESE_FIELD_SPECS: FieldSpec[] = [
  { section: "Kindheit", path: "kindheit.selbstbeschreibung", label: "Selbstbeschreibung" },
  { section: "Kindheit", path: "kindheit.gesundheitszustand", label: "Gesundheitszustand" },
  { section: "Kindheit", path: "kindheit.problemeStoerungen", label: "Probleme, Störungen" },
  { section: "Kindheit", path: "kindheit.verluste", label: "Verluste" },
  { section: "Kindheit", path: "kindheit.traumatisierungen", label: "Traumatisierungen" },
  { section: "Kindheit", path: "kindheit.besondereSituationen", label: "Besondere Situationen" },

  { section: "Eltern", path: "eltern.alter", label: "Alter" },
  { section: "Eltern", path: "eltern.beruf", label: "Beruf" },
  { section: "Eltern", path: "eltern.persoenlichkeit", label: "Persönlichkeit" },
  { section: "Eltern", path: "eltern.erziehungsstil", label: "Erziehungsstil" },
  { section: "Eltern", path: "eltern.beziehungKommunikation", label: "Beziehung und Kommunikation" },
  { section: "Eltern", path: "eltern.atmosphaere", label: "Atmosphäre im Elternhaus" },
  { section: "Eltern", path: "eltern.geschwister", label: "Geschwister" },

  { section: "Schule", path: "schule.abschluesse", label: "Abschlüsse" },
  { section: "Schule", path: "schule.beziehungMitschuelerLehrer", label: "Beziehung zu Mitschülern und Lehrern" },

  { section: "Beruf", path: "beruf.ausbildungen", label: "Ausbildungen" },
  { section: "Beruf", path: "beruf.beziehungVorgesetzteKollegen", label: "Beziehungen zu Vorgesetzten und Kollegen" },

  { section: "Sexualität & Partnerschaften", path: "sexualitaetPartnerschaften", label: "Sexuelle Entwicklung und Partnerschaften" },

  { section: "Interessen / Ressourcen", path: "interessenHobbys", label: "Interessen / Hobbys / Aktivitäten" },
  { section: "Interessen / Ressourcen", path: "ressourcen", label: "Ressourcen" },

  { section: "Aktuelle Lebenssituation", path: "aktuelleLebenssituation.wohnen", label: "Wohnen" },
  { section: "Aktuelle Lebenssituation", path: "aktuelleLebenssituation.arbeit", label: "Arbeit" },
  { section: "Aktuelle Lebenssituation", path: "aktuelleLebenssituation.beziehungen", label: "Beziehungen" },
  { section: "Aktuelle Lebenssituation", path: "aktuelleLebenssituation.kinder", label: "Kinder" },
  { section: "Aktuelle Lebenssituation", path: "aktuelleLebenssituation.eltern", label: "Eltern" },
  { section: "Aktuelle Lebenssituation", path: "aktuelleLebenssituation.krankheiten", label: "Krankheiten, Einschränkungen" },

  { section: "Symptomanamnese", path: "symptomanamnese.aktuelleSymptomatik", label: "Aktuelle Symptomatik" },
  { section: "Symptomanamnese", path: "symptomanamnese.beginnAusloeser", label: "Beginn der Entwicklung, Auslöser" },
  { section: "Symptomanamnese", path: "symptomanamnese.traumatisierungen", label: "Traumatisierungen" },
  { section: "Symptomanamnese", path: "symptomanamnese.behandlungen", label: "Behandlungen" },
  { section: "Symptomanamnese", path: "symptomanamnese.medikation", label: "Medikation" },
  { section: "Symptomanamnese", path: "symptomanamnese.problemloeseversuche", label: "Problemlöseversuche" },

  { section: "Psychischer Befund", path: "psychischerBefund.interaktionsverhalten", label: "Interaktionsverhalten" },
  { section: "Psychischer Befund", path: "psychischerBefund.auftreten", label: "Auftreten" },
  { section: "Psychischer Befund", path: "psychischerBefund.wirkung", label: "Wirkung" },
  { section: "Psychischer Befund", path: "psychischerBefund.denkmuster", label: "Denkmuster" },

  { section: "Persönlichkeit & Diagnose", path: "persoenlichkeitsstruktur", label: "Persönlichkeitsstruktur" },
  { section: "Persönlichkeit & Diagnose", path: "bewertungVorlaeufigeDiagnose", label: "Bewertung & vorläufige Diagnose" },
];

export function getField(profile: AnamneseProfile, path: string): AnamneseField {
  const parts = path.split(".");
  let obj: any = profile;
  for (const p of parts) obj = obj?.[p];
  return obj ?? emptyField();
}

export function setField(profile: AnamneseProfile, path: string, value: AnamneseField): AnamneseProfile {
  const next = structuredClone(profile);
  const parts = path.split(".");
  let obj: any = next;
  for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
  obj[parts[parts.length - 1]] = value;
  return next;
}

// Merge: nimmt neue Felder vom LLM und ergänzt sie ins bestehende Profil.
// Wenn neuer Text leer → alter Text bleibt. Sonst: neuer Text ersetzt,
// Quellen werden additiv angehängt (dedupliziert nach sessionId+quote).
export function mergeProfiles(
  base: AnamneseProfile,
  incoming: Partial<AnamneseProfile>,
  newSessionId?: string,
): AnamneseProfile {
  const next = structuredClone(base);
  for (const spec of ANAMNESE_FIELD_SPECS) {
    const incField = getField(incoming as AnamneseProfile, spec.path);
    if (!incField || !incField.text?.trim()) continue;
    const oldField = getField(next, spec.path);
    const mergedSources = [
      ...(oldField.sources ?? []),
      ...(incField.sources ?? []),
    ].filter((s, i, arr) =>
      arr.findIndex(x => x.sessionId === s.sessionId && x.quote === s.quote) === i
    );
    const merged: AnamneseField = {
      text: incField.text.trim(),
      confidence: Math.max(oldField.confidence ?? 0, incField.confidence ?? 0),
      sources: mergedSources,
    };
    Object.assign(next, setField(next, spec.path, merged));
    // Hack: setField returns a clone; reassign manually
    const parts = spec.path.split(".");
    let obj: any = next;
    for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
    obj[parts[parts.length - 1]] = merged;
  }
  next.updatedAt = Date.now();
  if (newSessionId) {
    next.sessionsCovered = Array.from(new Set([...(next.sessionsCovered ?? []), newSessionId]));
  }
  return next;
}
