// Lesepfad für ALTE, lokal verschlüsselte Datensätze (Felder `encName`/`encNotes`).
//
// WICHTIG: Das ist KEIN aktiver Schutzmechanismus.
// - Es wird nirgends mehr verschlüsselt; die App speichert Klarnamen heute im
//   Klartextfeld `name` (siehe PatientEdit.tsx).
// - Der zugehörige Schlüssel wurde seinerzeit aus einem zufällig erzeugten
//   Passwort abgeleitet, das UNVERSCHLÜSSELT in localStorage liegt. Wer Zugriff
//   auf den Browser-Speicher hat, hat damit auch den Schlüssel.
//
// Dieses Modul existiert nur, damit Datensätze aus früheren Versionen weiterhin
// lesbar bleiben. Sobald sicher ist, dass keine `encName`/`encNotes`-Felder mehr
// im Umlauf sind, kann es ersatzlos entfallen.

const dec = new TextDecoder();
const enc = new TextEncoder();

const SALT_KEY = "therapilot.salt";
const AUTO_PWD_KEY = "therapilot.autopwd";

let cachedKey: CryptoKey | null = null;

function b64decode(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password) as BufferSource,
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 200_000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
}

/** Lädt den Altschlüssel, sofern Passwort und Salt noch im localStorage liegen. */
async function loadLegacyKey(): Promise<CryptoKey | null> {
  if (cachedKey) return cachedKey;
  let pwd: string | null = null;
  let saltB: string | null = null;
  try {
    pwd = localStorage.getItem(AUTO_PWD_KEY);
    saltB = localStorage.getItem(SALT_KEY);
  } catch {
    return null; // localStorage nicht verfügbar
  }
  if (!pwd || !saltB) return null;
  cachedKey = await deriveKey(pwd, b64decode(saltB));
  return cachedKey;
}

/**
 * Entschlüsselt ein Altfeld. Liefert "" zurück, wenn nichts anliegt, der
 * Schlüssel fehlt oder die Daten nicht zum Schlüssel passen — der Aufrufer
 * fällt dann auf das Klartextfeld zurück.
 */
export async function safeDecrypt(payload?: string): Promise<string> {
  if (!payload) return "";
  try {
    const key = await loadLegacyKey();
    if (!key) return "";
    const data = b64decode(payload);
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: data.slice(0, 12) as BufferSource },
      key,
      data.slice(12) as BufferSource,
    );
    return dec.decode(pt);
  } catch {
    return "";
  }
}
