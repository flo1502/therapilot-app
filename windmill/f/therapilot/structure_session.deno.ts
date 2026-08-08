import * as wmill from "npm:windmill-client@1";

// Die 7 Pflichtsektionen der KV-Verlaufsdokumentation. Feldnamen aus
// src/lib/kvDocTypes.ts (KVDocumentation / KV_SECTION_ORDER) — demselben
// Vertrag, den auch supabase/functions/ai-assist/index.ts (runKVDocumentation)
// bereits verwendet, nur dort cloud-basiert. Hier bewusst lokal/lokales LLM,
// weil Transkripte data-class "patient" sind (siehe src/config/data-classes.ts).
const REQUIRED_KEYS = [
  "aktuelle_symptomatik",
  "inhalte_der_sitzung",
  "therapeutische_interventionen",
  "verlauf_und_einschaetzung",
  "vereinbarungen",
  "risikoabklaerung",
  "administrative_hinweise",
] as const;

// prompts/kv-verlauf.v1.md enthält im Repo aktuell nur einen TODO-Platzhalter,
// keinen echten Prompt-Text (Stand: Bestandsaufnahme). Der Prompt kommt daher
// aus einer Windmill-Variable, die manuell befüllt werden muss, sobald es
// einen echten Prompt gibt — siehe kv_verlauf_prompt_v1.variable.yaml.
const PROMPT_VARIABLE_PATH = "f/therapilot/kv_verlauf_prompt_v1";

export async function main(transcript: string, local_llm: RT.Local_llm) {
  const prompt = await wmill.getVariable(PROMPT_VARIABLE_PATH);
  if (!prompt || !prompt.trim()) {
    throw new Error(
      `structure_session: Variable ${PROMPT_VARIABLE_PATH} ist leer. ` +
        `prompts/kv-verlauf.v1.md enthält noch keinen echten Prompt-Text.`,
    );
  }

  const baseUrl = local_llm.base_url.replace(/\/+$/, "");
  const schemaHint =
    `Antworte AUSSCHLIESSLICH mit einem JSON-Objekt mit genau diesen Feldern ` +
    `(alle als String): ${REQUIRED_KEYS.join(", ")}. ` +
    `Optional zusätzlich "naechste_schritte" als Array von Strings.`;

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: local_llm.model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `${prompt}\n\n${schemaHint}` },
          { role: "user", content: transcript },
        ],
      }),
    });
  } catch (error) {
    throw new Error(
      `structure_session: lokaler LLM-Endpunkt ${baseUrl} nicht erreichbar (${
        error instanceof Error ? error.message : String(error)
      })`,
    );
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `structure_session: ${response.status} ${response.statusText} ${body}`.trim(),
    );
  }

  const data = await response.json();
  const content: string | undefined = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("structure_session: Antwort enthielt keinen message.content");
  }

  let structured: Record<string, unknown>;
  try {
    structured = JSON.parse(content);
  } catch {
    throw new Error("structure_session: Antwort war kein valides JSON");
  }

  // Nur Metadaten loggen, niemals Transkript- oder Dokumentations-Inhalte.
  console.log(
    `structure_session: ok model=${local_llm.model} keys=${Object.keys(structured).length} transcript_len=${transcript.length}`,
  );

  return structured;
}
