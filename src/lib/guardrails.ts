// src/lib/guardrails.ts
// Validation + Personalization for therapeutic AI output

import type {
  Slide,
  Template,
  StageConfig,
  PatientInfo,
  ValidationError,
  ValidationResult,
  GuardrailsConfig,
} from "./types";
import { DEFAULT_GUARDRAILS_CONFIG } from "./types";

// ═══════════════════════════════════════════════════════════════
// READABILITY: Flesch-Index für Deutsch
// ═══════════════════════════════════════════════════════════════
//
// Wir nutzen den Flesch-Reading-Ease (Amstad-Variante für Deutsch),
// nicht Flesch-Kincaid Grade Level. Für Deutsch ist Amstad besser.
//
// Formel (Amstad 1978 für Deutsch):
//   FRE = 180 - ASL - (58.5 × ASW)
//   ASL = average sentence length (wörter pro satz)
//   ASW = average syllables per word
//
// Skala:
//   90-100: sehr leicht (Grundschule)
//   60-70:  einfach (A1-A2)
//   30-50:  mittel (B1-B2)
//   0-30:   schwer (akademisch)
//
// Für unseren Zweck (A1-A2 für Therapie-Patienten):
//   Mindestens FRE > 60 wäre ideal.

const VOWEL_GROUPS_DE = /[aeiouäöüy]+/gi;

/**
 * Approximate syllable count for a German word.
 * Uses vowel-group heuristic. Not perfect but good enough.
 */
function countSyllables(word: string): number {
  if (!word) return 0;
  const cleaned = word.toLowerCase().replace(/[^a-zäöüß]/g, "");
  if (cleaned.length === 0) return 0;
  if (cleaned.length <= 3) return 1;

  const matches = cleaned.match(VOWEL_GROUPS_DE);
  const count = matches ? matches.length : 1;
  return Math.max(1, count);
}

/**
 * Tokenize German text into sentences.
 */
function splitSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Tokenize into words.
 */
function splitWords(text: string): string[] {
  return text
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => /[a-zäöüßA-ZÄÖÜ]/.test(w));
}

/**
 * Calculate Amstad/Flesch-Reading-Ease for German text.
 * Higher = easier. For A1-A2 we want FRE > 60.
 */
export function calculateReadability(text: string): {
  fre: number;
  avgSentenceLength: number;
  avgSyllablesPerWord: number;
  level: "sehr leicht" | "leicht" | "mittel" | "schwer" | "sehr schwer";
} {
  const sentences = splitSentences(text);
  const words = splitWords(text);

  if (sentences.length === 0 || words.length === 0) {
    return {
      fre: 100,
      avgSentenceLength: 0,
      avgSyllablesPerWord: 0,
      level: "sehr leicht",
    };
  }

  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = totalSyllables / words.length;

  // Amstad formula for German
  const fre = 180 - avgSentenceLength - 58.5 * avgSyllablesPerWord;

  let level: "sehr leicht" | "leicht" | "mittel" | "schwer" | "sehr schwer";
  if (fre >= 80) level = "sehr leicht";
  else if (fre >= 60) level = "leicht";
  else if (fre >= 40) level = "mittel";
  else if (fre >= 20) level = "schwer";
  else level = "sehr schwer";

  return {
    fre: Math.round(fre * 10) / 10,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
    level,
  };
}

/**
 * Helper: extract all text from a slide.
 */
function slideText(slide: Slide): string {
  const parts: string[] = [slide.title];
  if (slide.bullets) parts.push(...slide.bullets);
  if (slide.example) parts.push(slide.example);
  return parts.join(". ");
}

/**
 * Helper: extract all text from a template.
 */
function templateText(template: Template): string {
  return template.slides.map(slideText).join(" ");
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION: Individual checks
// ═══════════════════════════════════════════════════════════════

/**
 * Check 1: Readability
 */
function checkReadability(
  slides: Slide[],
  config: GuardrailsConfig
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Map A1/A1-A2/A2 language levels to minimum FRE thresholds
  // (higher FRE = easier; we want FRE >= threshold)
  const minFRE = 60; // A1-A2 baseline

  slides.forEach((slide, i) => {
    const text = slideText(slide);
    const result = calculateReadability(text);

    if (result.fre < minFRE) {
      errors.push({
        type: "readability",
        severity: "error",
        slideIndex: i,
        message: `Folie ${i + 1}: Sprache zu komplex (FRE=${result.fre}, ${result.level}). Ziel: FRE > ${minFRE}.`,
        suggestion: `Kürze Sätze (aktuell ⌀ ${result.avgSentenceLength} Wörter/Satz, Ziel < 12).`,
      });
    } else if (result.fre < minFRE + 10) {
      errors.push({
        type: "readability",
        severity: "warning",
        slideIndex: i,
        message: `Folie ${i + 1}: Sprache grenzwertig (FRE=${result.fre}).`,
      });
    }
  });

  return errors;
}

/**
 * Check 2: Concrete examples present
 */
function checkExamples(
  slides: Slide[],
  patientInfo: PatientInfo,
  stageConfig: StageConfig
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!stageConfig.examples_required) return errors;

  const exampleMarkers = [
    "beispiel",
    "z.b.",
    "z. b.",
    "zum beispiel",
    "etwa",
    "stellt euch vor",
    "stell dir vor",
  ];

  slides.forEach((slide, i) => {
    const text = slideText(slide).toLowerCase();
    const hasExplicitExample =
      slide.example !== undefined && slide.example.length > 10;
    const hasInlineExample = exampleMarkers.some((m) => text.includes(m));
    const hasPatientReference =
      patientInfo.name && text.includes(patientInfo.name.toLowerCase());

    if (!hasExplicitExample && !hasInlineExample && !hasPatientReference) {
      errors.push({
        type: "examples",
        severity: "error",
        slideIndex: i,
        message: `Folie ${i + 1}: Kein konkretes Beispiel gefunden.`,
        suggestion: `Füge ein Beispiel mit ${patientInfo.name} ein (Beruf: ${patientInfo.beruf || "?"}).`,
      });
    }
  });

  return errors;
}

/**
 * German stop words and meta-words that shouldn't count as required content.
 */
const CONTENT_STOPWORDS = new Set([
  "der", "die", "das", "den", "dem", "des",
  "ein", "eine", "einer", "eines", "einem", "einen",
  "und", "oder", "aber", "auch", "nicht", "kein", "keine",
  "ist", "sind", "war", "waren", "hat", "haben", "hatte",
  "für", "mit", "ohne", "bei", "von", "zu", "an", "auf",
  "etc", "etwa", "z.b", "zb", "bzw",
  "einfach", "konkret", "etc.", "usw",
]);

/**
 * Extract meaningful content keywords from a "required content" string.
 * Removes stopwords, parentheticals, and meta-instructions.
 */
function extractContentKeywords(required: string): string[] {
  // Remove parenthetical clarifications: "Definition Panikattacke (einfach, nicht medizinisch)"
  // → "Definition Panikattacke"
  const stripped = required.replace(/\([^)]*\)/g, "").trim();

  return stripped
    .toLowerCase()
    .split(/[\s,\/+\-]+/)
    .filter((w) => w.length >= 4) // skip short words
    .filter((w) => !CONTENT_STOPWORDS.has(w));
}

/**
 * Check 3: Required content present (stage curriculum)
 *
 * Uses semantic-ish matching: extract meaningful keywords, ignore stopwords
 * and parenthetical clarifications. Require ≥50% of keywords present.
 */
function checkRequiredContent(
  slides: Slide[],
  stageConfig: StageConfig
): ValidationError[] {
  const errors: ValidationError[] = [];

  const allText = slides.map(slideText).join(" ").toLowerCase();

  stageConfig.erforderliche_inhalte.forEach((required) => {
    const keywords = extractContentKeywords(required);
    if (keywords.length === 0) return;

    const matched = keywords.filter((k) => allText.includes(k));
    const matchRate = matched.length / keywords.length;

    if (matchRate < 0.4) {
      errors.push({
        type: "content",
        severity: "error",
        message: `Erforderlicher Inhalt fehlt: "${required}"`,
        suggestion: `Gesucht: ${keywords.join(", ")}. Gefunden: ${matched.join(", ") || "keine"}.`,
      });
    } else if (matchRate < 0.7) {
      errors.push({
        type: "content",
        severity: "warning",
        message: `Erforderlicher Inhalt nur teilweise abgedeckt: "${required}"`,
      });
    }
  });

  return errors;
}

/**
 * Check 4: Tone (no scary/anxiety-inducing words for normalizing stages)
 *
 * Smart-match: If a "scary" word appears within a few words of a negation
 * ("keine Gefahr", "nicht gefährlich"), it's actually reassuring — skip it.
 */
function checkTone(
  slides: Slide[],
  stageConfig: StageConfig,
  config: GuardrailsConfig
): ValidationError[] {
  const errors: ValidationError[] = [];

  const isNormalizingStage = /normalisierend|hoffnungsvoll|validierend/i.test(
    stageConfig.tone
  );
  if (!isNormalizingStage) return errors;

  // Negation words that flip the meaning of a nearby scary word
  const negations = [
    "kein", "keine", "keinen", "keiner", "keinem",
    "nicht", "nie", "niemals", "ohne",
  ];

  /**
   * Returns true if `scaryWord` appears in `text` in a NON-negated context.
   */
  const hasUnreassuredScary = (text: string, scaryWord: string): boolean => {
    const lowerText = text.toLowerCase();
    const regex = new RegExp(`\\b${scaryWord}\\b`, "gi");
    let match;
    while ((match = regex.exec(lowerText)) !== null) {
      const pos = match.index;
      // Check the 30 characters before this match for a negation
      const window = lowerText.substring(Math.max(0, pos - 30), pos);
      const isNegated = negations.some((neg) =>
        new RegExp(`\\b${neg}\\b`, "i").test(window)
      );
      if (!isNegated) {
        return true; // found an unreassured occurrence
      }
    }
    return false;
  };

  slides.forEach((slide, i) => {
    const text = slideText(slide);
    const found = config.scaryWordsBlocklist.filter((word) =>
      hasUnreassuredScary(text, word)
    );

    if (found.length > 0) {
      errors.push({
        type: "tone",
        severity: "error",
        slideIndex: i,
        message: `Folie ${i + 1}: Beängstigende Wörter ohne Entkräftung: ${found.join(", ")}`,
        suggestion: `Stadium "${stageConfig.name}" verlangt normalisierenden Ton. Verneinung hinzufügen oder Wort ersetzen.`,
      });
    }
  });

  return errors;
}

/**
 * Check 5: Patient personalization present
 */
function checkPersonalization(
  slides: Slide[],
  patientInfo: PatientInfo
): ValidationError[] {
  const errors: ValidationError[] = [];

  const allText = slides.map(slideText).join(" ").toLowerCase();
  const name = patientInfo.name?.toLowerCase();

  if (!name) {
    errors.push({
      type: "personalization",
      severity: "error",
      message: "Patient-Name fehlt in PatientInfo.",
    });
    return errors;
  }

  if (!allText.includes(name)) {
    errors.push({
      type: "personalization",
      severity: "error",
      message: `Patient-Name "${patientInfo.name}" kommt in keiner Folie vor.`,
      suggestion: "Mindestens eine Folie sollte den Patient-Namen erwähnen.",
    });
  }

  // Check for unfilled placeholders
  const placeholders = [
    "[PATIENT_NAME]",
    "[BERUF]",
    "[PROFESSION]",
    "[TRIGGER]",
    "[SYMPTOM]",
    "[SITUATION]",
  ];
  slides.forEach((slide, i) => {
    const text = slideText(slide);
    placeholders.forEach((placeholder) => {
      if (text.includes(placeholder)) {
        errors.push({
          type: "personalization",
          severity: "error",
          slideIndex: i,
          message: `Folie ${i + 1}: Unausgefüllter Platzhalter "${placeholder}".`,
        });
      }
    });
  });

  return errors;
}

/**
 * Check 6: Slide count matches stage requirements
 */
function checkSlideCount(
  slides: Slide[],
  stageConfig: StageConfig
): ValidationError[] {
  const errors: ValidationError[] = [];
  const expected = stageConfig.num_slides || stageConfig.folienthemen.length;

  if (slides.length !== expected) {
    errors.push({
      type: "slide_count",
      severity: slides.length === 0 ? "error" : "warning",
      message: `Erwartet: ${expected} Folien. Erhalten: ${slides.length}.`,
    });
  }

  return errors;
}

/**
 * Check 7: Jargon without explanation
 */
function checkJargon(
  slides: Slide[],
  config: GuardrailsConfig
): ValidationError[] {
  const errors: ValidationError[] = [];

  slides.forEach((slide, i) => {
    const text = slideText(slide).toLowerCase();
    config.jargonRequiringExplanation.forEach((term) => {
      const regex = new RegExp(`\\b${term}\\b`, "i");
      if (regex.test(text)) {
        // Heuristic: if jargon appears, look for explanatory phrasing nearby
        const hasExplanation =
          text.includes(`${term} (`) ||
          text.includes(`${term} —`) ||
          text.includes(`${term} -`) ||
          text.includes(`${term} ist `) ||
          text.includes(`${term} bedeutet`);

        if (!hasExplanation) {
          errors.push({
            type: "jargon",
            severity: "warning",
            slideIndex: i,
            message: `Folie ${i + 1}: Fachbegriff "${term}" ohne Erklärung.`,
            suggestion: `Erkläre "${term}" in Klammern oder einfacheren Worten.`,
          });
        }
      }
    });
  });

  return errors;
}

/**
 * Check 8: Structure quality (titles, bullet count)
 */
function checkStructure(slides: Slide[]): ValidationError[] {
  const errors: ValidationError[] = [];

  slides.forEach((slide, i) => {
    if (!slide.title || slide.title.trim().length === 0) {
      errors.push({
        type: "structure",
        severity: "error",
        slideIndex: i,
        message: `Folie ${i + 1}: Kein Titel.`,
      });
    } else if (slide.title.length > 80) {
      errors.push({
        type: "structure",
        severity: "warning",
        slideIndex: i,
        message: `Folie ${i + 1}: Titel zu lang (${slide.title.length} Zeichen, max. 80).`,
      });
    }

    if (!slide.bullets || slide.bullets.length === 0) {
      errors.push({
        type: "structure",
        severity: "error",
        slideIndex: i,
        message: `Folie ${i + 1}: Keine Stichpunkte.`,
      });
    } else if (slide.bullets.length > 5) {
      errors.push({
        type: "structure",
        severity: "warning",
        slideIndex: i,
        message: `Folie ${i + 1}: Zu viele Stichpunkte (${slide.bullets.length}, max. 5).`,
      });
    } else {
      slide.bullets.forEach((bullet, bi) => {
        const wordCount = bullet.split(/\s+/).length;
        if (wordCount > 20) {
          errors.push({
            type: "structure",
            severity: "warning",
            slideIndex: i,
            message: `Folie ${i + 1}, Stichpunkt ${bi + 1}: Zu lang (${wordCount} Wörter).`,
          });
        }
      });
    }
  });

  return errors;
}

// ═══════════════════════════════════════════════════════════════
// MAIN VALIDATION ENTRY POINT
// ═══════════════════════════════════════════════════════════════

/**
 * Run all guardrail checks on AI-generated slides.
 */
export function validateAIOutput(
  slides: Slide[],
  stageConfig: StageConfig,
  patientInfo: PatientInfo,
  config: GuardrailsConfig = DEFAULT_GUARDRAILS_CONFIG
): ValidationResult {
  const allIssues: ValidationError[] = [
    ...checkSlideCount(slides, stageConfig),
    ...checkStructure(slides),
    ...checkReadability(slides, config),
    ...checkExamples(slides, patientInfo, stageConfig),
    ...checkRequiredContent(slides, stageConfig),
    ...checkTone(slides, stageConfig, config),
    ...checkPersonalization(slides, patientInfo),
    ...checkJargon(slides, config),
  ];

  const errors = allIssues.filter((e) => e.severity === "error");
  const warnings = allIssues.filter((e) => e.severity === "warning");

  // Quality score: 100 - 10 per error - 3 per warning, floor at 0
  const score = Math.max(0, 100 - errors.length * 10 - warnings.length * 3);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    score,
  };
}

/**
 * Validate an existing template (e.g. before adding to library)
 */
export function validateTemplate(
  template: Template,
  stageConfig: StageConfig,
  patientInfo: PatientInfo,
  config: GuardrailsConfig = DEFAULT_GUARDRAILS_CONFIG
): ValidationResult {
  return validateAIOutput(template.slides, stageConfig, patientInfo, config);
}

/**
 * Filter a list of templates, keeping only those that pass guardrails.
 * Used in SessionSlidesPanel to filter library before showing to therapist.
 */
export function filterTemplatesByGuardrails(
  templates: Template[],
  stageConfig: StageConfig,
  patientInfo: PatientInfo,
  config: GuardrailsConfig = DEFAULT_GUARDRAILS_CONFIG
): Template[] {
  // We do a relaxed check at library-filter time:
  // - Readability must pass
  // - Tone must not be scary (negation-aware)
  // We DON'T enforce required-content (templates are reusable across stages)
  // and DON'T enforce personalization (templates have placeholders)

  const isNormalizing = /normalisierend|hoffnungsvoll/i.test(stageConfig.tone);
  const negations = ["kein", "keine", "nicht", "nie", "ohne"];

  const hasUnreassuredScary = (text: string, scaryWord: string): boolean => {
    const lower = text.toLowerCase();
    const regex = new RegExp(`\\b${scaryWord}\\b`, "gi");
    let match;
    while ((match = regex.exec(lower)) !== null) {
      const window = lower.substring(Math.max(0, match.index - 30), match.index);
      const negated = negations.some((n) =>
        new RegExp(`\\b${n}\\b`, "i").test(window)
      );
      if (!negated) return true;
    }
    return false;
  };

  return templates.filter((template) => {
    const text = templateText(template);

    // Readability hard floor
    const readability = calculateReadability(text);
    if (readability.fre < 50) return false;

    // Tone (only if stage requires normalizing)
    if (isNormalizing) {
      const hasScary = config.scaryWordsBlocklist.some((w) =>
        hasUnreassuredScary(text, w)
      );
      if (hasScary) return false;
    }

    return true;
  });
}

// ═══════════════════════════════════════════════════════════════
// PERSONALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Replace placeholders in slides with patient-specific data.
 * Use as fallback after AI generation, or for static templates.
 */
export function personalizeSlides(
  slides: Slide[],
  patientInfo: PatientInfo
): Slide[] {
  const replacements: Record<string, string> = {
    "[PATIENT_NAME]": patientInfo.name,
    "[BERUF]": patientInfo.beruf || "Beruf",
    "[PROFESSION]": patientInfo.beruf || "Beruf",
    "[ALTER]": patientInfo.alter ? String(patientInfo.alter) : "?",
    "[TRIGGER]": patientInfo.triggers?.[0] || "Trigger-Situation",
    "[SYMPTOM]": patientInfo.hauptsymptome?.[0] || "körperliches Symptom",
    "[HAUPTSYMPTOME]":
      patientInfo.hauptsymptome?.join(", ") || "Herzklopfen, Schwitzen",
    "[ANGSTGEDANKE]":
      patientInfo.hauptangst_gedanken?.[0] || "Etwas Schlimmes passiert",
    "[VERMEIDUNG]":
      patientInfo.vermeidungs_verhalten?.[0] || "Situation verlassen",
    "[ZIELE]": patientInfo.ziele?.join(", ") || "Lebensqualität verbessern",
  };

  const replaceInText = (text: string): string => {
    let result = text;
    Object.entries(replacements).forEach(([placeholder, value]) => {
      result = result.split(placeholder).join(value);
    });
    return result;
  };

  return slides.map((slide) => ({
    ...slide,
    title: replaceInText(slide.title),
    bullets: slide.bullets.map(replaceInText),
    example: slide.example ? replaceInText(slide.example) : undefined,
    speaker_notes: slide.speaker_notes
      ? replaceInText(slide.speaker_notes)
      : undefined,
  }));
}

// ═══════════════════════════════════════════════════════════════
// FORMATTING UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Format validation results as a human-readable report.
 */
export function formatValidationReport(result: ValidationResult): string {
  const lines: string[] = [];
  lines.push(`Quality Score: ${result.score}/100 ${result.valid ? "✅" : "❌"}`);

  if (result.errors.length > 0) {
    lines.push(`\nFehler (${result.errors.length}):`);
    result.errors.forEach((e, i) => {
      lines.push(`  ${i + 1}. [${e.type}] ${e.message}`);
      if (e.suggestion) lines.push(`     → ${e.suggestion}`);
    });
  }

  if (result.warnings.length > 0) {
    lines.push(`\nWarnungen (${result.warnings.length}):`);
    result.warnings.forEach((w, i) => {
      lines.push(`  ${i + 1}. [${w.type}] ${w.message}`);
    });
  }

  return lines.join("\n");
}
