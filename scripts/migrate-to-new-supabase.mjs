// One-off data migration: old Lovable Cloud project -> new self-owned project.
//
// Reads patients/sessions from the OLD project's PostgREST API using its
// public anon key (RLS allows public SELECT, so no elevated access is
// needed there). Writes them into the NEW project via its service role
// key, which bypasses RLS/owner_id checks for this one-time bulk load.
//
// Plain fetch() against PostgREST directly (no @supabase/supabase-js) --
// avoids that client's eager Realtime/WebSocket init, which errors out
// under Node 20 for a script that doesn't need realtime at all.
//
// Usage:
//   NEW_SUPABASE_URL=... NEW_SUPABASE_SERVICE_ROLE_KEY=... \
//   node scripts/migrate-to-new-supabase.mjs
//
// OLD_* defaults to the values already in .env (the current/old project) if unset.
// NEW_* has no defaults on purpose -- must be the new project, set explicitly
// each run so this can never accidentally target the wrong project.

import { readFileSync } from "node:fs";

function loadDotEnvDefaults() {
  try {
    const text = readFileSync(new URL("../.env", import.meta.url), "utf8");
    const out = {};
    for (const line of text.split("\n")) {
      const m = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
      if (m) out[m[1]] = m[2];
    }
    return out;
  } catch {
    return {};
  }
}

const dotenv = loadDotEnvDefaults();

const OLD_URL = process.env.OLD_SUPABASE_URL ?? dotenv.VITE_SUPABASE_URL;
const OLD_ANON_KEY = process.env.OLD_SUPABASE_ANON_KEY ?? dotenv.VITE_SUPABASE_PUBLISHABLE_KEY;
const NEW_URL = process.env.NEW_SUPABASE_URL;
const NEW_SERVICE_ROLE_KEY = process.env.NEW_SUPABASE_SERVICE_ROLE_KEY;

if (!OLD_URL || !OLD_ANON_KEY) {
  console.error("Missing OLD_SUPABASE_URL / OLD_SUPABASE_ANON_KEY (and no .env fallback found).");
  process.exit(1);
}
if (!NEW_URL || !NEW_SERVICE_ROLE_KEY) {
  console.error("Missing NEW_SUPABASE_URL / NEW_SUPABASE_SERVICE_ROLE_KEY — these must be set explicitly, no default.");
  process.exit(1);
}

async function readAll(table) {
  const res = await fetch(`${OLD_URL}/rest/v1/${table}?select=*`, {
    headers: { apikey: OLD_ANON_KEY, Authorization: `Bearer ${OLD_ANON_KEY}` },
  });
  if (!res.ok) throw new Error(`Reading ${table} from old project failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function upsertAll(table, rows) {
  if (rows.length === 0) return;
  const res = await fetch(`${NEW_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: NEW_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${NEW_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Writing ${table} to new project failed: ${res.status} ${await res.text()}`);
}

async function countAll(table) {
  const res = await fetch(`${NEW_URL}/rest/v1/${table}?select=id`, {
    method: "HEAD",
    headers: {
      apikey: NEW_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${NEW_SERVICE_ROLE_KEY}`,
      Prefer: "count=exact",
    },
  });
  if (!res.ok) throw new Error(`Verifying ${table} on new project failed: ${res.status} ${await res.text()}`);
  const range = res.headers.get("content-range"); // "0-4/5"
  return range ? parseInt(range.split("/")[1], 10) : NaN;
}

async function migrateTable(table) {
  const data = await readAll(table);
  console.log(`Read ${data.length} row(s) from ${table} (old project).`);
  await upsertAll(table, data);
  const count = await countAll(table);
  console.log(`New project now has ${count} row(s) in ${table}. ${count === data.length ? "✓ matches" : "✗ MISMATCH"}`);
}

for (const table of ["patients", "sessions"]) {
  await migrateTable(table);
}

console.log("\nDone. Re-run any time — it upserts by id, so it's safe to repeat.");
