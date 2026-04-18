// Entfernt potenziell identifizierende Inhalte vor AI-Calls.
// Konservativ: Eigennamen werden durch Platzhalter ersetzt.

const COMMON_GERMAN_FIRSTNAMES = [
  "Anna","Maria","Lisa","Julia","Sarah","Laura","Lena","Marie","Sophie","Hannah",
  "Michael","Stefan","Thomas","Andreas","Markus","Peter","Klaus","Hans","Jürgen","Wolfgang",
  "Daniel","Florian","Sebastian","Alexander","Tobias","Christian","Matthias","Martin","David","Jonas",
];

export function pseudonymize(text: string, patientPseudonym?: string): string {
  if (!text) return text;
  let out = text;

  // Telefonnummern
  out = out.replace(/(\+?\d[\d\s\-\/()]{6,}\d)/g, "[TEL]");
  // E-Mails
  out = out.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[EMAIL]");
  // Adressen mit Hausnummer (heuristisch)
  out = out.replace(/\b([A-ZÄÖÜ][a-zäöüß]+(?:straße|str\.|weg|allee|platz|gasse|ring))\s+\d+\b/gi, "[ADRESSE]");
  // Geburtsdaten
  out = out.replace(/\b(\d{1,2})\.(\d{1,2})\.(\d{2,4})\b/g, "[DATUM]");

  // Vornamen ersetzen
  const re = new RegExp(`\\b(${COMMON_GERMAN_FIRSTNAMES.join("|")})\\b`, "gi");
  out = out.replace(re, patientPseudonym ?? "[PATIENT:IN]");

  return out;
}
