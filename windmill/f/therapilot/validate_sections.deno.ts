// Pflichtsektionen laut src/lib/kvDocTypes.ts (KVDocumentation / KV_SECTION_ORDER).
// naechste_schritte ist dort ausdrücklich NICHT Teil der 7 Pflichtsektionen
// und wird hier daher nicht geprüft.
const REQUIRED_SECTIONS = [
  "aktuelle_symptomatik",
  "inhalte_der_sitzung",
  "therapeutische_interventionen",
  "verlauf_und_einschaetzung",
  "vereinbarungen",
  "risikoabklaerung",
  "administrative_hinweise",
] as const;

export async function main(structured: Record<string, unknown>) {
  const missing: string[] = [];
  const empty: string[] = [];

  for (const key of REQUIRED_SECTIONS) {
    if (!(key in structured)) {
      missing.push(key);
      continue;
    }
    const value = structured[key];
    if (typeof value !== "string" || !value.trim()) {
      empty.push(key);
    }
  }

  if (missing.length || empty.length) {
    const parts: string[] = [];
    if (missing.length) parts.push(`fehlend: ${missing.join(", ")}`);
    if (empty.length) parts.push(`leer: ${empty.join(", ")}`);
    throw new Error(`validate_sections: Pflichtsektionen ungültig (${parts.join(" | ")})`);
  }

  console.log(`validate_sections: ok sections=${REQUIRED_SECTIONS.length}`);

  return structured;
}
