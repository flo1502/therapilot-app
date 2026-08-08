import { createClient } from "npm:@supabase/supabase-js@2";

// Liest public.sessions (id text PK, patient_id text, data jsonb,
// updated_at bigint, owner_id uuid) — siehe supabase/migrations/*.sql.
// Das Transkript liegt NICHT in einer eigenen Spalte, sondern unter
// data.transcript (SessionEntry.transcript, src/lib/db.ts) — data ist ein
// 1:1-Spiegel des lokalen Dexie-Datensatzes, siehe src/lib/cloudSync.ts.

export async function main(session_id: string, supabase: RT.Therapilot_supabase) {
  const client = createClient(supabase.url, supabase.service_role_key);

  const { data: row, error } = await client
    .from("sessions")
    .select("id, patient_id, data")
    .eq("id", session_id)
    .maybeSingle();

  if (error) {
    throw new Error(
      `fetch_session: Supabase-Fehler beim Lesen von sessions/${session_id}: ${error.message}`,
    );
  }
  if (!row) {
    throw new Error(`fetch_session: keine Session mit id=${session_id} gefunden`);
  }

  const transcript = (row.data as Record<string, unknown> | null)?.transcript;
  if (typeof transcript !== "string" || !transcript.trim()) {
    throw new Error(
      `fetch_session: Session ${session_id} hat kein Transkript (data.transcript fehlt oder ist leer)`,
    );
  }

  // Nur Metadaten loggen, niemals Transkript-Inhalte (Patientendaten).
  console.log(
    `fetch_session: ok session_id=${session_id} patient_id=${row.patient_id ?? "-"} transcript_len=${transcript.length}`,
  );

  return {
    transcript,
    patient_id: (row.patient_id as string | null) ?? null,
  };
}
