// src/lib/curriculum-database.ts
// German psychotherapy curriculum database
// Based on DGPPN/DGPs guidelines + S3-Leitlinien

import type { Curriculum, ICDCode } from "./types";

// ═══════════════════════════════════════════════════════════════
// F41.0 — PANIKSTÖRUNG
// Leitlinie: S3-Leitlinie Behandlung von Angststörungen (DGPPN, AWMF)
// ═══════════════════════════════════════════════════════════════

export const PANIKSTOERUNG_CURRICULUM: Curriculum = {
  diagnose: "F41.0",
  name: "Panikstörung",
  leitlinie: "S3-Leitlinie Angststörungen (DGPPN/AWMF Reg.-Nr. 051-028)",
  evidence_basis:
    "Kognitive Verhaltenstherapie + Expositionstherapie (Evidenzgrad Ia)",
  gesamtdauer: "12-25 Sitzungen (KZT) oder bis 80 Sitzungen (LZT)",
  therapy_types: ["KZT", "LZT"],

  stadien: [
    // ─────────────────────────────────────────────────────────────
    // STADIUM 1: Psychoedukation & Normalisierung
    // ─────────────────────────────────────────────────────────────
    {
      stadium: 1,
      name: "Psychoedukation & Normalisierung",
      sitzungen: "1-2",
      lernziele: [
        "Patient versteht: Panik ist eine Angststörung, keine körperliche Krankheit",
        "Patient kann Symptome benennen und einordnen",
        "Patient hat Hoffnung: Panik ist gut behandelbar (80% Erfolgsrate)",
        "Patient versteht: 2-3% der Bevölkerung haben Panikstörung",
      ],
      erforderliche_inhalte: [
        "Definition Panikattacke (einfach, nicht medizinisch)",
        "Fight-or-Flight Reaktion",
        "Symptome sind körperlich, aber nicht gefährlich",
        "Differentialdiagnose abgeklärt (kein Herzproblem etc.)",
        "Behandelbarkeit + Hoffnung",
        "Häufigkeit in Bevölkerung",
      ],
      folienthemen: [
        "Was passiert bei einer Panikattacke?",
        "Warum fühlt sich das so gefährlich an?",
        "Du bist nicht allein - und es ist behandelbar",
      ],
      sprach_niveau: "A1",
      tone: "normalisierend, hoffnungsvoll, nicht beängstigend",
      examples_required: true,
      beispiel_struktur: [
        "[PATIENT_NAME], [BERUF], erste Panikattacke in [SITUATION]",
        "Symptome: [HAUPTSYMPTOME]",
        "Erster Gedanke: 'Ich kriege einen Herzinfarkt!'",
        "Wahrheit: Körper reagiert mit Fight-or-Flight, aber sicher",
      ],
      patient_personalisierung_erforderlich: [
        "patient_name",
        "patient_beruf",
        "patient_erstes_panic_ereignis",
        "patient_hauptsymptome",
        "patient_hauptangst",
      ],
      therapeut_notizen:
        "Normalisierung ist zentral. Patient muss Sicherheit fühlen, dass Symptome nicht gefährlich sind. Vorher körperliche Abklärung sicherstellen!",
      num_slides: 3,
    },

    // ─────────────────────────────────────────────────────────────
    // STADIUM 2: Teufelskreis verstehen
    // ─────────────────────────────────────────────────────────────
    {
      stadium: 2,
      name: "Teufelskreis verstehen",
      sitzungen: "3-4",
      lernziele: [
        "Patient versteht den Teufelskreis: Trigger → Symptom → Gedanke → mehr Angst",
        "Patient kann seinen eigenen Teufelskreis aufzeichnen",
        "Patient erkennt: Vermeidung verstärkt das Problem",
        "Patient sieht mögliche Ausstiegspunkte",
      ],
      erforderliche_inhalte: [
        "Teufelskreis-Diagramm (4 Stationen: Trigger, Körper, Gedanke, Reaktion)",
        "Beispiel mit Patient-spezifischer Situation",
        "Vermeidungsverhalten als Verstärker",
        "Ausstiegspunkte aus dem Teufelskreis",
      ],
      folienthemen: [
        "Der Teufelskreis der Panik",
        "Dein persönlicher Teufelskreis",
        "Wo können wir den Kreis durchbrechen?",
      ],
      sprach_niveau: "A1-A2",
      tone: "erklärend, ermächtigend, klar strukturiert",
      examples_required: true,
      beispiel_struktur: [
        "[PATIENT_NAME] in [TRIGGER_SITUATION]",
        "Schritt 1 - Trigger: [SPECIFIC_TRIGGER]",
        "Schritt 2 - Körper: [PATIENT_HAUPTSYMPTOM]",
        "Schritt 3 - Gedanke: [PATIENT_ANGSTGEDANKE]",
        "Schritt 4 - Reaktion: [VERMEIDUNG]",
        "Resultat: Kurzfristig Erleichterung, langfristig mehr Angst",
      ],
      patient_personalisierung_erforderlich: [
        "patient_name",
        "patient_spezifische_symptome",
        "patient_spezifische_angst_gedanken",
        "patient_spezifisches_vermeidungs_verhalten",
        "patient_trigger_situation",
      ],
      therapeut_notizen:
        "Teufelskreis SOLLTE zusammen mit Patient aufgezeichnet werden. Patient malt selbst — nicht passiv konsumieren!",
      num_slides: 3,
    },

    // ─────────────────────────────────────────────────────────────
    // STADIUM 3: Atemtechniken & Körper-Selbsthilfe
    // ─────────────────────────────────────────────────────────────
    {
      stadium: 3,
      name: "Atemtechniken & Körper-Selbsthilfe",
      sitzungen: "5-6",
      lernziele: [
        "Patient beherrscht 4-7-8 Atemtechnik (oder Alternative)",
        "Patient versteht: Langsames Atmen beruhigt Vagusnerv",
        "Patient hat Selbstwirksamkeitsgefühl",
        "Patient übt täglich (nicht nur bei Panik!)",
      ],
      erforderliche_inhalte: [
        "Warum Atmung Nervensystem beruhigt (Vagus, einfach)",
        "4-7-8 Technik Schritt für Schritt",
        "Häufige Fehler (zu schnell, hyperventilieren)",
        "Übung in der Sitzung",
        "Hausaufgabe: Tägliches Üben",
      ],
      folienthemen: [
        "Wie dein Atem dein Nervensystem beruhigt",
        "Die 4-7-8 Atemtechnik Schritt für Schritt",
        "Hausaufgabe: 1x täglich üben",
      ],
      sprach_niveau: "A1",
      tone: "anleitend, praktisch, ermutigend",
      examples_required: true,
      beispiel_struktur: [
        "[PATIENT_NAME] sitzt am Schreibtisch",
        "Spürt: Leichtes Herzrasen",
        "Macht: 4-7-8 Atmung (4 Sekunden ein, 7 halten, 8 aus)",
        "Nach 1 Minute: Herz wieder normal",
        "Erkenntnis: 'Ich habe das selbst kontrolliert!'",
      ],
      patient_personalisierung_erforderlich: [
        "patient_name",
        "patient_lieblings_atemtechnik",
        "patient_lernstil",
        "patient_tagesablauf_für_übung",
      ],
      therapeut_notizen:
        "WICHTIG: In der Sitzung gemeinsam üben! Nicht nur erklären. Patient muss Technik mindestens 3x korrekt durchführen, bevor er nach Hause geht.",
      num_slides: 3,
    },

    // ─────────────────────────────────────────────────────────────
    // STADIUM 4: Expositions-Hierarchie aufbauen
    // ─────────────────────────────────────────────────────────────
    {
      stadium: 4,
      name: "Expositions-Hierarchie aufbauen",
      sitzungen: "7-12",
      lernziele: [
        "Patient versteht Expositionstherapie + Habituation",
        "Patient erstellt eigene Hierarchie (10-15 Stufen)",
        "Patient bewertet jede Situation auf Angst-Skala 0-100",
        "Patient ist bereit für erste leichte Exposition",
      ],
      erforderliche_inhalte: [
        "Was ist Expositionstherapie (Sicherheit betonen)",
        "Habituationskurve: Angst sinkt nach 20-30 Min",
        "Angst-Skala 0-100 (subjektive Angst-Einheit)",
        "Hierarchie-Erstellung Schritt für Schritt",
        "Hausaufgaben-Exposition zwischen Sitzungen",
      ],
      folienthemen: [
        "Wie Expositionstherapie funktioniert",
        "Deine persönliche Angst-Hierarchie",
        "Erste Übung: Welche Stufe diese Woche?",
      ],
      sprach_niveau: "A1-A2",
      tone: "ermutigend, realistisch, schritt-für-schritt",
      examples_required: true,
      beispiel_struktur: [
        "Stufe 1 (Angst 20): [LEICHTE_SITUATION für Patient]",
        "Stufe 2 (Angst 30): [SITUATION_2]",
        "Stufe 3 (Angst 40): [SITUATION_3]",
        "...weitere Stufen...",
        "Stufe 10 (Angst 100): [HAUPTANGST_SITUATION]",
      ],
      patient_personalisierung_erforderlich: [
        "patient_name",
        "patient_spezifische_vermiedene_situationen",
        "patient_angst_skala_pro_situation",
        "patient_lebens_ziele",
      ],
      therapeut_notizen:
        "Hierarchie MUSS Patient selbst aufstellen! Therapeut stellt Fragen, Patient bewertet. Ziele aus Stadium 1 hier aktivieren.",
      num_slides: 3,
    },

    // ─────────────────────────────────────────────────────────────
    // STADIUM 5: Kognitive Umstrukturierung
    // ─────────────────────────────────────────────────────────────
    {
      stadium: 5,
      name: "Kognitive Umstrukturierung",
      sitzungen: "10-15",
      lernziele: [
        "Patient identifiziert katastrophale Gedanken",
        "Patient prüft Gedanken auf Beweise",
        "Patient formuliert realistische Alternativen",
        "Patient nutzt Gedanken-Tagebuch",
      ],
      erforderliche_inhalte: [
        "Gedanken sind nicht automatisch wahr",
        "Katastrophen-Denken erkennen",
        "Beweis-Check: Spricht dafür/dagegen?",
        "Realistische Alternative formulieren",
        "Gedanken-Tagebuch als Werkzeug",
      ],
      folienthemen: [
        "Gedanken sind nicht automatisch wahr",
        "Den Beweis-Check machen",
        "Dein Gedanken-Tagebuch",
      ],
      sprach_niveau: "A2",
      tone: "sokratisch, fragend, neugierig",
      examples_required: true,
      beispiel_struktur: [
        "[PATIENT_NAME] spürt Herzrasen",
        "Gedanke: '[PATIENT_HAUPTANGST_GEDANKE]'",
        "Beweis dafür: [zB. 'Mein Herz schlägt schnell']",
        "Beweis dagegen: [zB. 'EKG war normal, Kardiologe hat geprüft']",
        "Alternative: 'Das ist Panik, nicht Infarkt. Ich bin sicher.'",
      ],
      patient_personalisierung_erforderlich: [
        "patient_name",
        "patient_hauptangst_gedanken",
        "patient_beweise_gegen_gedanken",
        "patient_lieblings_alternative_gedanken",
      ],
      therapeut_notizen:
        "Sokratische Methode! Patient muss SELBST zur Einsicht kommen. Nicht 'erklären', sondern fragen.",
      num_slides: 3,
    },

    // ─────────────────────────────────────────────────────────────
    // STADIUM 6: Rückfallprävention & Abschluss
    // ─────────────────────────────────────────────────────────────
    {
      stadium: 6,
      name: "Rückfallprävention & Abschluss",
      sitzungen: "20-25",
      lernziele: [
        "Patient versteht: Rückfall ist normal, nicht Katastrophe",
        "Patient kennt seine Frühwarnsignale",
        "Patient hat persönlichen Notfallplan",
        "Patient fühlt sich selbstwirksam und befähigt",
      ],
      erforderliche_inhalte: [
        "Rückfall normalisieren (kein Versagen)",
        "Frühwarnsignale identifizieren",
        "Notfallplan: Was tun, wenn Panik wieder kommt?",
        "Skills-Reaktivierung (Atmung, Exposition, Gedanken)",
        "Selbstständigkeit: Patient = sein eigener Therapeut",
      ],
      folienthemen: [
        "Rückfall ist normal - du bist vorbereitet",
        "Deine Frühwarnsignale",
        "Dein persönlicher Notfallplan",
      ],
      sprach_niveau: "A1-A2",
      tone: "ermutigend, vertrauensvoll, abschließend",
      examples_required: true,
      beispiel_struktur: [
        "[PATIENT_NAME] hat große Fortschritte gemacht",
        "Mögliche Frühwarnsignale: [PATIENT_FRUEH_WARNSIGNALE]",
        "Notfallplan: 1. Atmung, 2. Gedanken-Check, 3. Mini-Exposition",
        "Erinnerung: 'Ich habe das schon einmal geschafft.'",
      ],
      patient_personalisierung_erforderlich: [
        "patient_name",
        "patient_persönlicher_rückfall_plan",
        "patient_früh_warnsignale",
        "patient_selbstständigkeits_ziele",
      ],
      therapeut_notizen:
        "Letzte Sitzungen. Patient muss Sicherheit haben, alleine weiter zu kommen. Follow-up nach 3/6 Monaten anbieten.",
      num_slides: 3,
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// F32 — DEPRESSIVE EPISODE (Stub - to be expanded)
// ═══════════════════════════════════════════════════════════════

export const DEPRESSION_CURRICULUM: Curriculum = {
  diagnose: "F32",
  name: "Depressive Episode",
  leitlinie: "S3-Leitlinie Unipolare Depression (DGPPN/AWMF)",
  evidence_basis:
    "Kognitive Verhaltenstherapie + Verhaltensaktivierung (Evidenzgrad Ia)",
  gesamtdauer: "16-25 Sitzungen (KZT) oder bis 80 Sitzungen (LZT)",
  therapy_types: ["KZT", "LZT"],

  stadien: [
    {
      stadium: 1,
      name: "Psychoedukation: Was ist Depression?",
      sitzungen: "1-2",
      lernziele: [
        "Patient versteht: Depression ist eine Krankheit, nicht Schwäche",
        "Patient versteht biopsychosoziales Modell",
        "Patient hat Hoffnung: Depression ist gut behandelbar",
        "Patient kann Symptome einordnen",
      ],
      erforderliche_inhalte: [
        "Definition Depression (nicht Traurigkeit, nicht Faulheit)",
        "Biopsychosoziales Modell einfach",
        "Häufigkeit: 5-7% der Bevölkerung",
        "Behandelbarkeit + Hoffnung",
        "Symptom-Cluster: Stimmung, Antrieb, Schlaf, Appetit, Selbstwert",
      ],
      folienthemen: [
        "Was ist Depression wirklich?",
        "Symptome erkennen und benennen",
        "Es gibt Hoffnung und Hilfe",
      ],
      sprach_niveau: "A1",
      tone: "normalisierend, hoffnungsvoll, validierend",
      examples_required: true,
      beispiel_struktur: [
        "[PATIENT_NAME], [BERUF], seit Wochen müde und freudlos",
        "Symptome: [PATIENT_HAUPTSYMPTOME]",
        "Gedanke: 'Ich bin schwach, ich sollte mich zusammenreißen'",
        "Wahrheit: Depression ist eine echte Krankheit, nicht Charakter",
      ],
      patient_personalisierung_erforderlich: [
        "patient_name",
        "patient_beruf",
        "patient_hauptsymptome",
      ],
      therapeut_notizen:
        "Validierung ist zentral. Patient hat oft Schuldgefühle ('Ich sollte das doch alleine schaffen'). Diese ernst nehmen.",
      num_slides: 3,
    },

    {
      stadium: 2,
      name: "Verhaltensaktivierung",
      sitzungen: "3-6",
      lernziele: [
        "Patient versteht: Inaktivität verstärkt Depression",
        "Patient erstellt Aktivitäten-Hierarchie",
        "Patient plant kleine, realistische Schritte",
        "Patient erlebt erste Erfolge",
      ],
      erforderliche_inhalte: [
        "Teufelskreis Inaktivität-Stimmung",
        "Verhaltensaktivierung Prinzip",
        "Aktivitäten-Hierarchie (leicht zu schwer)",
        "Pleasure & Mastery Aktivitäten",
        "Wochenplan erstellen",
      ],
      folienthemen: [
        "Der Teufelskreis der Inaktivität",
        "Deine Aktivitäts-Hierarchie",
        "Diese Woche: Kleine Schritte",
      ],
      sprach_niveau: "A1-A2",
      tone: "ermutigend, schritt-für-schritt, realistisch",
      examples_required: true,
      beispiel_struktur: [
        "[PATIENT_NAME] bleibt im Bett",
        "Gefühl: Müde, antriebslos",
        "Gedanke: 'Hat eh keinen Sinn'",
        "Konsequenz: Noch weniger Energie, mehr Hoffnungslosigkeit",
        "Alternative: Kleine Aktivität (5 Min Spaziergang)",
        "Resultat: Etwas besser, kleines Erfolgserlebnis",
      ],
      patient_personalisierung_erforderlich: [
        "patient_name",
        "patient_beruf",
        "patient_lebens_ziele",
      ],
      therapeut_notizen:
        "Klein anfangen! 'Pleasure-Mastery'-Liste mit Patient zusammen. Realistische Wochenpläne, nicht zu ambitioniert.",
      num_slides: 3,
    },

    // Weitere Stadien zu ergänzen: Kognitive Umstrukturierung, Soziale Aktivierung, Rückfallprävention
  ],
};

// ═══════════════════════════════════════════════════════════════
// F42 — ZWANGSSTÖRUNG (Stub)
// ═══════════════════════════════════════════════════════════════

export const ZWANGSSTOERUNG_CURRICULUM: Curriculum = {
  diagnose: "F42",
  name: "Zwangsstörung",
  leitlinie: "S3-Leitlinie Zwangsstörungen (DGPPN/AWMF Reg.-Nr. 038-017)",
  evidence_basis: "Exposition mit Reaktionsmanagement (ERP, Evidenzgrad Ia)",
  gesamtdauer: "20-40 Sitzungen",
  therapy_types: ["KZT", "LZT"],

  stadien: [
    {
      stadium: 1,
      name: "Psychoedukation: Was ist Zwangsstörung wirklich?",
      sitzungen: "1-2",
      lernziele: [
        "Patient versteht: OCD ist nicht Sauberkeit oder Ordnung (Mythos!)",
        "Patient versteht: Zwangsgedanken + Zwangshandlungen",
        "Patient versteht: Das ist neurobiologisch real",
        "Patient hat Hoffnung: ERP wirkt bei 60-80% der Patienten",
      ],
      erforderliche_inhalte: [
        "Definition: Intrusive Gedanken + Zwangshandlungen",
        "Mythos vs. Realität (nicht Pingelig-Sein)",
        "Neurobiologische Basis einfach",
        "Häufigkeit: 1-3% der Bevölkerung",
        "ERP als Behandlung der Wahl",
      ],
      folienthemen: [
        "Was ist echtes OCD? (nicht Ordnung-lieben)",
        "Der Gedanken-Zwang-Kreislauf",
        "Wie ERP-Therapie hilft",
      ],
      sprach_niveau: "A1-A2",
      tone: "validierend, entstigmatisierend, hoffnungsvoll",
      examples_required: true,
      beispiel_struktur: [
        "[PATIENT_NAME] hat intrusive Gedanken über [SPEZIFISCH]",
        "Versucht durch [ZWANGSHANDLUNG] Angst zu reduzieren",
        "Funktioniert kurzfristig, langfristig schlimmer",
        "Wahrheit: Das sind nur Gedanken, nicht Realität",
      ],
      patient_personalisierung_erforderlich: [
        "patient_name",
        "patient_hauptangst_gedanken",
        "patient_spezifisches_vermeidungs_verhalten",
      ],
      therapeut_notizen:
        "Patient ist oft beschämt durch intrusive Gedanken (besonders bei aggressiven/sexuellen Inhalten). Unbedingt entstigmatisieren!",
      num_slides: 3,
    },

    // Weitere Stadien zu ergänzen
  ],
};

// ═══════════════════════════════════════════════════════════════
// CURRICULUM REGISTRY
// ═══════════════════════════════════════════════════════════════

export const CURRICULUM_DATABASE: Record<ICDCode, Curriculum> = {
  "F41.0": PANIKSTOERUNG_CURRICULUM,
  "F32": DEPRESSION_CURRICULUM,
  "F42": ZWANGSSTOERUNG_CURRICULUM,
  // Stubs für später:
  "F41.1": PANIKSTOERUNG_CURRICULUM, // GAD - eigenes Curriculum nötig
  "F33": DEPRESSION_CURRICULUM, // Rezidivierende Depression
  "F43.1": PANIKSTOERUNG_CURRICULUM, // PTBS - eigenes Curriculum nötig
};

/**
 * Get curriculum for a given ICD-10 code
 */
export function getCurriculum(diagnosis: ICDCode): Curriculum | undefined {
  return CURRICULUM_DATABASE[diagnosis];
}

/**
 * Get a specific stage configuration
 */
export function getStageConfig(diagnosis: ICDCode, stadium: number) {
  const curriculum = getCurriculum(diagnosis);
  if (!curriculum) return undefined;
  return curriculum.stadien.find((s) => s.stadium === stadium);
}

/**
 * Get all available diagnoses (deduplicated by ICD code).
 */
export function getAvailableDiagnoses(): Array<{
  code: ICDCode;
  name: string;
  stadien_count: number;
}> {
  const seen = new Set<ICDCode>();
  const result: Array<{ code: ICDCode; name: string; stadien_count: number }> =
    [];
  (Object.entries(CURRICULUM_DATABASE) as [ICDCode, Curriculum][]).forEach(
    ([code, curriculum]) => {
      if (seen.has(code)) return;
      seen.add(code);
      result.push({
        code,
        name: curriculum.name,
        stadien_count: curriculum.stadien.length,
      });
    }
  );
  return result;
}
