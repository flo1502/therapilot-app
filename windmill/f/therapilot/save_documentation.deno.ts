import { createClient } from "npm:@supabase/supabase-js@2";

// Schreibt in public.sessions.data.kvDocumentation (SessionEntry.kvDocumentation,
// src/lib/db.ts / src/lib/kvDocTypes.ts) — per Read-Merge-Write, damit andere
// additive Felder in data (rawNotes, schemaAnalysis, sessionKPIs, ...) erhalten
// bleiben.
//
// ACHTUNG (Lücke, siehe Bestandsaufnahme): SessionEntry hat aktuell KEIN Feld
// für prompt_version. kvDocumentationMeta ist daher ein NEUES, additives Feld,
// nicht Teil der bestehenden src/lib/db.ts-Typen — dort ergänzen, wenn das
// Frontend promptVersion anzeigen soll.

export async function main(
  session_id: string,
  structured: Record<string, unknown>,
  prompt_version: string,
  supabase: RT.Therapilot_supabase,
) {
  const client = createClient(supabase.url, supabase.service_role_key);

  const { data: row, error: readError } = await client
    .from("sessions")
    .select("data")
    .eq("id", session_id)
    .maybeSingle();

  if (readError) {
    throw new Error(
      `save_documentation: Supabase-Fehler beim Lesen von sessions/${session_id}: ${readError.message}`,
    );
  }
  if (!row) {
    throw new Error(`save_documentation: keine Session mit id=${session_id} gefunden`);
  }

  const currentData = (row.data ?? {}) as Record<string, unknown>;
  const nextData = {
    ...currentData,
    kvDocumentation: structured,
    kvDocumentationMeta: {
      promptVersion: prompt_version,
      generatedAt: Date.now(),
      source: "windmill",
    },
  };

  const { error: writeError } = await client
    .from("sessions")
    .update({ data: nextData, updated_at: Date.now() })
    .eq("id", session_id);

  if (writeError) {
    throw new Error(
      `save_documentation: Supabase-Fehler beim Schreiben von sessions/${session_id}: ${writeError.message}`,
    );
  }

  // Nur Metadaten loggen, niemals Dokumentations-Inhalte (Patientendaten).
  console.log(`save_documentation: ok session_id=${session_id} prompt_version=${prompt_version}`);

  return { session_id, saved: true };
}
