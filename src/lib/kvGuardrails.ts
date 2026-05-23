// Lokale Post-Validation für KV-Verlaufsdokumentation
// Prüft Stil-Regeln, die das LLM verletzen könnte.

import {
  KVDocumentation,
  KVValidationResult,
  KV_SECTION_LABELS,
  KV_SECTION_ORDER,
} from "./kvDocTypes";

// Verbotene wertende Begriffe (Auswahl)
const WERTUNGS_BEGRIFFE = [
  "leider", "erfreulicherweise", "beeindruckend", "schwach", "stark betroffen",
  "bedauerlich", "tragischerweise", "glücklicherweise", "tapfer", "mutig",
  "auffällig schwierig", "schwer zugänglich", "uneinsichtig",
];

// Spekulative Diagnose-Phrasen
const DIAGNOSE_SPEKULATION = [
  /\b(vermutlich|wahrscheinlich|möglicherweise|scheinbar|wirkt)\s+(depressiv|ängstlich|traumatisiert|psychotisch|manisch|bipolar|borderline)\b/i,
  /\b(vermutlich|wahrscheinlich)\s+F\d{2}/i,
  /\bdiagnose\s+(steht\s+aus|wird\s+gestellt)\b/i,
];

// Direkte Rede – Anführungszeichen mit Inhalt > 3 Wörtern
const DIREKTE_REDE = /["„»][^"""«»]{15,}["""«»]/;

function flesch(text: string): number {
  // grobe deutsche Variante – nur als Indikator
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length || 1;
  const words = text.split(/\s+/).filter(Boolean).length || 1;
  const syllables = text
    .toLowerCase()
    .replace(/[^a-zäöüß ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .reduce((acc, w) => acc + Math.max(1, (w.match(/[aeiouäöüy]+/g) || []).length), 0);
  return 180 - words / sentences - (58.5 * syllables) / words;
}

export function validateKVDocumentation(
  doc: KVDocumentation,
  patientPseudonym?: string,
  patientFullName?: string,
): KVValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Pflicht-Sektionen vorhanden und nicht leer
  for (const key of KV_SECTION_ORDER) {
    const v = doc[key]?.trim();
    if (!v) {
      errors.push(`Pflichtsektion leer: ${KV_SECTION_LABELS[key]}`);
    } else if (v.length < 10) {
      warnings.push(`Sehr kurze Sektion: ${KV_SECTION_LABELS[key]} (${v.length} Zeichen)`);
    }
  }

  // 2. Risikoabklärung darf nie "entfällt" o.ä. komplett ohne Aussage zu Suizidalität sein
  const risiko = doc.risikoabklaerung?.toLowerCase() ?? "";
  if (risiko && !/suizid|selbst(verletzung|gefährdung|tötung)|lebensmüd/.test(risiko)) {
    errors.push("Risikoabklärung enthält keine explizite Aussage zu Suizidalität.");
  }

  // 3. Alle Sektionen gegen Stilregeln prüfen
  const all = KV_SECTION_ORDER.map((k) => doc[k] || "").join("\n\n");

  // 3a. Direkte Rede
  if (DIREKTE_REDE.test(all)) {
    errors.push("Direkte Rede gefunden – bitte indirekte Wiedergabe verwenden.");
  }

  // 3b. Wertungen
  for (const w of WERTUNGS_BEGRIFFE) {
    const re = new RegExp(`\\b${w}\\b`, "i");
    if (re.test(all)) {
      warnings.push(`Wertender Begriff gefunden: "${w}"`);
    }
  }

  // 3c. Diagnose-Spekulation
  for (const re of DIAGNOSE_SPEKULATION) {
    if (re.test(all)) {
      errors.push("Spekulative Diagnose-Formulierung gefunden.");
      break;
    }
  }

  // 4. Personalisierungs-Check: kein Klartext-Name
  if (patientFullName && patientFullName.trim().length >= 2) {
    const nameParts = patientFullName.split(/\s+/).filter((p) => p.length >= 3);
    for (const part of nameParts) {
      const re = new RegExp(`\\b${part}\\b`, "i");
      if (re.test(all)) {
        errors.push(`Klartext-Name "${part}" gefunden – sollte Pseudonym sein.`);
      }
    }
  }

  // 5. Lesbarkeits-Indikator (nur Warning)
  const f = flesch(all);
  if (f < 20) warnings.push(`Sehr komplexe Sprache (Flesch ${Math.round(f)}).`);

  // Score
  const baseDeductions = errors.length * 18 + warnings.length * 4;
  const score = Math.max(0, Math.min(100, 100 - baseDeductions));

  return {
    valid: errors.length === 0,
    score,
    errors,
    warnings,
  };
}

export function formatKVValidation(r: KVValidationResult): string {
  const parts: string[] = [`Score: ${r.score}/100 ${r.valid ? "✓" : "✗"}`];
  if (r.errors.length) {
    parts.push("Fehler:");
    r.errors.forEach((e) => parts.push(`  • ${e}`));
  }
  if (r.warnings.length) {
    parts.push("Warnungen:");
    r.warnings.forEach((w) => parts.push(`  • ${w}`));
  }
  return parts.join("\n");
}
