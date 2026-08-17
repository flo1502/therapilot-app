// Cloud-Sync für TheraPilot:
//   - beim Start: alle Cloud-Datensätze in Dexie spiegeln
//   - Realtime: Änderungen aus der Cloud live in Dexie übernehmen
//   - Dexie-Hooks: lokale Schreibvorgänge automatisch in die Cloud pushen
//     (nur wenn eingeloggt; sonst still lassen, UI toastet beim Versuch)
//
// Cloud-Tabellen patients/sessions haben Spalten:
//   id text, patient_id text (nur sessions), data jsonb, updated_at bigint
//
// `data` enthält den vollständigen Dexie-Datensatz als JSON.

import { supabase } from "@/integrations/supabase/client";
import { db, type Patient, type SessionEntry } from "@/lib/db";

type AnyRecord = Patient | SessionEntry;

let initialized = false;
let suppressPush = false; // verhindert Echo-Loops, wenn wir nach Pull/Realtime in Dexie schreiben

async function isAuthed(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return !!data.session?.user;
}

function withSuppress<T>(fn: () => Promise<T>): Promise<T> {
  suppressPush = true;
  return fn().finally(() => { suppressPush = false; });
}

// ---------- Pull (initial) ----------

async function pullAll() {
  const [pats, sess] = await Promise.all([
    supabase.from("patients").select("data"),
    supabase.from("sessions").select("data"),
  ]);

  await withSuppress(async () => {
    if (pats.data?.length) {
      await db.patients.bulkPut(pats.data.map((r: any) => r.data as Patient));
    }
    if (sess.data?.length) {
      await db.sessions.bulkPut(sess.data.map((r: any) => r.data as SessionEntry));
    }
  });
}

// ---------- Realtime ----------

function subscribeRealtime() {
  supabase
    .channel("therapilot-sync")
    .on("postgres_changes", { event: "*", schema: "public", table: "patients" }, async (payload) => {
      await withSuppress(async () => {
        if (payload.eventType === "DELETE") {
          const oldId = (payload.old as any)?.id;
          if (oldId) await db.patients.delete(oldId);
        } else {
          const row: any = payload.new;
          if (row?.data) await db.patients.put(row.data as Patient);
        }
      });
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, async (payload) => {
      await withSuppress(async () => {
        if (payload.eventType === "DELETE") {
          const oldId = (payload.old as any)?.id;
          if (oldId) await db.sessions.delete(oldId);
        } else {
          const row: any = payload.new;
          if (row?.data) await db.sessions.put(row.data as SessionEntry);
        }
      });
    })
    .subscribe();
}

// ---------- Push ----------

export async function pushPatient(p: Patient) {
  if (!(await isAuthed())) return;
  await supabase.from("patients").upsert({
    id: p.id,
    data: p as any,
    updated_at: p.updatedAt ?? Date.now(),
  });
}

export async function pushSession(s: SessionEntry) {
  if (!(await isAuthed())) return;
  await supabase.from("sessions").upsert({
    id: s.id,
    patient_id: s.patientId,
    data: s as any,
    updated_at: s.createdAt ?? Date.now(),
  });
}

export async function removePatient(id: string) {
  if (!(await isAuthed())) return;
  await supabase.from("patients").delete().eq("id", id);
}
export async function removeSession(id: string) {
  if (!(await isAuthed())) return;
  await supabase.from("sessions").delete().eq("id", id);
}

// ---------- Dexie-Hooks ----------

function attachDexieHooks() {
  db.patients.hook("creating", (_pk, obj) => {
    if (!suppressPush) pushPatient(obj as Patient).catch(console.warn);
  });
  // Dexie übergibt in `obj` den Stand VOR der Änderung. Ohne das Einmischen von
  // `mods` würde der alte Datensatz hochgeladen und die gerade gespeicherte
  // Änderung beim nächsten pullAll() (bulkPut ersetzt ganze Zeilen) wieder
  // lokal überschrieben — betraf u.a. anamneseProfile, Befund und Briefing.
  db.patients.hook("updating", (mods, _pk, obj) => {
    if (!suppressPush) pushPatient({ ...(obj as Patient), ...(mods as Partial<Patient>) }).catch(console.warn);
  });
  db.patients.hook("deleting", (pk) => {
    if (!suppressPush) removePatient(pk as string).catch(console.warn);
  });

  db.sessions.hook("creating", (_pk, obj) => {
    if (!suppressPush) pushSession(obj as SessionEntry).catch(console.warn);
  });
  db.sessions.hook("updating", (mods, _pk, obj) => {
    if (!suppressPush) pushSession({ ...(obj as SessionEntry), ...(mods as Partial<SessionEntry>) }).catch(console.warn);
  });
  db.sessions.hook("deleting", (pk) => {
    if (!suppressPush) removeSession(pk as string).catch(console.warn);
  });
}

// ---------- Public Init ----------

export async function initCloudSync() {
  if (initialized) return;
  initialized = true;
  attachDexieHooks();
  try {
    await pullAll();
  } catch (e) {
    console.warn("[cloudSync] pull failed", e);
  }
  subscribeRealtime();
}

/** Einmal-Migration: alle lokalen Datensätze in die Cloud hochladen.
 *  Decrypted Klarnamen/Notizen werden als plaintext in `name`/`notes` gespeichert,
 *  damit andere Browser sie sehen können. */
export async function migrateLocalToCloud(): Promise<{ patients: number; sessions: number }> {
  if (!(await isAuthed())) {
    throw new Error("Bitte zuerst einloggen.");
  }
  const { safeDecrypt } = await import("@/lib/legacyCrypto");

  const patients = await db.patients.toArray();
  const sessions = await db.sessions.toArray();

  // Klarnamen entschlüsseln und in plaintext name/notes übernehmen
  for (const p of patients) {
    const anyP = p as any;
    if (anyP.encName && !anyP.name) anyP.name = await safeDecrypt(anyP.encName);
    if (anyP.encNotes && !anyP.notes) anyP.notes = await safeDecrypt(anyP.encNotes);
  }

  // Bulk-Upsert
  if (patients.length) {
    await supabase.from("patients").upsert(
      patients.map(p => ({ id: p.id, data: p as any, updated_at: p.updatedAt ?? Date.now() })),
    );
    // lokale Dexie-Records auch updaten (mit plaintext)
    await withSuppress(() => db.patients.bulkPut(patients));
  }
  if (sessions.length) {
    await supabase.from("sessions").upsert(
      sessions.map(s => ({ id: s.id, patient_id: s.patientId, data: s as any, updated_at: s.createdAt ?? Date.now() })),
    );
  }

  localStorage.setItem("therapilot.migrated", "true");
  return { patients: patients.length, sessions: sessions.length };
}
