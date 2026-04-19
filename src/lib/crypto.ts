// AES-GCM Verschlüsselung mit Master-Passwort (PBKDF2)
// Klarnamen werden NIE im Klartext gespeichert.

const enc = new TextEncoder();
const dec = new TextDecoder();

let cachedKey: CryptoKey | null = null;
let cachedSalt: Uint8Array | null = null;

const SALT_KEY = "therapilot.salt";
const VERIFY_KEY = "therapilot.verify"; // base64(iv + ciphertext("ok"))

function b64encode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
function b64decode(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey("raw", enc.encode(password) as BufferSource, "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 200_000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export function isEncryptionInitialized(): boolean {
  return !!localStorage.getItem(SALT_KEY) && !!localStorage.getItem(VERIFY_KEY);
}

export function isUnlocked(): boolean {
  return cachedKey !== null;
}

export async function initializeEncryption(password: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, enc.encode("ok") as BufferSource);
  const verify = new Uint8Array(iv.length + ct.byteLength);
  verify.set(iv, 0);
  verify.set(new Uint8Array(ct), iv.length);
  localStorage.setItem(SALT_KEY, b64encode(salt));
  localStorage.setItem(VERIFY_KEY, b64encode(verify));
  cachedKey = key;
  cachedSalt = salt;
}

export async function unlock(password: string): Promise<boolean> {
  const saltB = localStorage.getItem(SALT_KEY);
  const verifyB = localStorage.getItem(VERIFY_KEY);
  if (!saltB || !verifyB) return false;
  const salt = b64decode(saltB);
  const verify = b64decode(verifyB);
  const iv = verify.slice(0, 12);
  const ct = verify.slice(12);
  try {
    const key = await deriveKey(password, salt);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, ct as BufferSource);
    if (dec.decode(pt) !== "ok") return false;
    cachedKey = key;
    cachedSalt = salt;
    return true;
  } catch {
    return false;
  }
}

export function lock() {
  cachedKey = null;
  cachedSalt = null;
}

async function ensureKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  const AUTO_PWD_KEY = "therapilot.autopwd";
  let pwd = localStorage.getItem(AUTO_PWD_KEY);
  if (!pwd) {
    const rnd = crypto.getRandomValues(new Uint8Array(32));
    pwd = b64encode(rnd);
    localStorage.setItem(AUTO_PWD_KEY, pwd);
  }
  if (!isEncryptionInitialized()) {
    await initializeEncryption(pwd);
  } else {
    await unlock(pwd);
  }
  if (!cachedKey) throw new Error("Konnte Schlüssel nicht initialisieren.");
  return cachedKey;
}

export async function encryptString(plain: string): Promise<string> {
  const key = await ensureKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, cachedKey, enc.encode(plain) as BufferSource);
  const out = new Uint8Array(iv.length + ct.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(ct), iv.length);
  return b64encode(out);
}

export async function decryptString(payload: string): Promise<string> {
  const key = await ensureKey();
  const data = b64decode(payload);
  const iv = data.slice(0, 12);
  const ct = data.slice(12);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, cachedKey, ct as BufferSource);
  return dec.decode(pt);
}

export async function safeDecrypt(payload?: string): Promise<string> {
  if (!payload) return "";
  try { return await decryptString(payload); } catch { return ""; }
}
