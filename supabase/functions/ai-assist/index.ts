// AI-Assist Edge Function für TheraPilot
// WICHTIG: Hier kommen NUR pseudonymisierte Daten an. Trotzdem keine Persistenz.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "google/gemini-2.5-flash";

function tool(name: string, description: string, parameters: any) {
  return { type: "function", function: { name, description, parameters } };
}

function buildRequest(task: string, payload: any, pseudo?: string) {
  const baseSystem =
    "Du bist ein klinischer Assistent für approbierte Psycholog:innen in Deutschland. " +
    "Antworte präzise, fachlich, in deutscher Sprache. " +
    "Stelle KEINE Diagnosen, gib keine medizinischen Anweisungen an Patient:innen direkt. " +
    "Du arbeitest ausschließlich mit pseudonymisierten Daten. Verwende immer den Platzhalter " +
    `'${pseudo ?? "[PATIENT:IN]"}' statt eines Namens.`;

  if (task === "structure-session") {
    return {
      messages: [
        { role: "system", content: baseSystem },
        {
          role: "user",
          content:
            `Strukturiere die folgenden Roh-Sitzungsnotizen im Format ${payload.format ?? "SOAP"}. ` +
            `Therapieansatz: ${payload.approach ?? "unbekannt"}. ` +
            `Therapieziel(e): ${payload.goals ?? "—"}.\n\n` +
            `Roh-Notiz:\n${payload.rawNotes ?? ""}`,
        },
      ],
      tools: [
        tool(
          "return_structured_session",
          "Liefert die strukturierte Sitzungsdokumentation.",
          {
            type: "object",
            properties: {
              subjektiv: { type: "string", description: "Subjektives Erleben des:der Patient:in." },
              objektiv: { type: "string", description: "Beobachtungen der Therapeut:in (Affekt, Verhalten, Mimik)." },
              assessment: { type: "string", description: "Fachliche Einschätzung, Hypothesen, Verlauf." },
              plan: { type: "string", description: "Plan für nächste Schritte / Sitzung." },
              hausaufgabe: { type: "string", description: "Konkrete therapeutische Hausaufgabe." },
              naechsterFokus: { type: "string", description: "Vorgeschlagener Fokus der Folgesitzung." },
            },
            required: ["subjektiv", "objektiv", "assessment", "plan"],
            additionalProperties: false,
          },
        ),
      ],
      tool_choice: { type: "function", function: { name: "return_structured_session" } },
    };
  }

  if (task === "personalize-slides") {
    return {
      messages: [
        { role: "system", content: baseSystem },
        {
          role: "user",
          content:
            `Personalisiere ein Psychoedukations-Slidedeck zum Thema "${payload.topic}". ` +
            `Therapieansatz: ${payload.approach ?? "—"}. ` +
            `Patient:in (pseudonymisiert): Altersgruppe ${payload.ageGroup ?? "—"}, ` +
            `Therapieziele: ${payload.goals ?? "—"}, Diagnosen: ${(payload.diagnoses ?? []).join(", ") || "—"}. ` +
            `Verwende ${payload.slideCount ?? 6} Slides. Sprache: einfach, empathisch, deutsch. ` +
            (payload.templateOutline
              ? `Orientiere dich an dieser Template-Struktur, passe Beispiele an: ${JSON.stringify(payload.templateOutline)}`
              : ""),
        },
      ],
      tools: [
        tool("return_deck", "Liefert ein personalisiertes Slidedeck.", {
          type: "object",
          properties: {
            title: { type: "string" },
            slides: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  bullets: { type: "array", items: { type: "string" } },
                  notes: { type: "string", description: "Sprechernotizen für Therapeut:in." },
                },
                required: ["title", "bullets"],
                additionalProperties: false,
              },
            },
          },
          required: ["title", "slides"],
          additionalProperties: false,
        }),
      ],
      tool_choice: { type: "function", function: { name: "return_deck" } },
    };
  }

  if (task === "suggest-slides") {
    return {
      messages: [
        { role: "system", content: baseSystem },
        {
          role: "user",
          content:
            `Wähle die 2-3 für den aktuellen Behandlungsschritt am besten passenden Folien aus den verfügbaren Quellen aus. ` +
            `Behandlungsschritt: "${payload.stepLabel}" — ${payload.stepDescription ?? ""}. ` +
            `Therapieansatz: ${payload.approach ?? "—"}. ` +
            `Therapieziele: ${payload.goals ?? "—"}. ` +
            `Aktuelle Sitzungsnotiz (Auszug, pseudonymisiert): ${(payload.notesExcerpt ?? "").slice(0, 800)}\n\n` +
            `Verfügbare Folien (Kandidaten):\n${JSON.stringify(payload.candidates ?? [], null, 0)}\n\n` +
            `Gib genau 2-3 Vorschläge zurück. Bevorzuge personalisierte Patienten-Decks (source="deck") wenn vorhanden und passend.`,
        },
      ],
      tools: [
        tool("return_suggestions", "Liefert 2-3 Folien-Vorschläge.", {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  source: { type: "string", enum: ["template", "deck"] },
                  sourceId: { type: "string" },
                  slideIndex: { type: "number" },
                  reason: { type: "string", description: "Kurze fachliche Begründung (1 Satz)." },
                },
                required: ["source", "sourceId", "slideIndex", "reason"],
                additionalProperties: false,
              },
            },
          },
          required: ["suggestions"],
          additionalProperties: false,
        }),
      ],
      tool_choice: { type: "function", function: { name: "return_suggestions" } },
    };
  }

  if (task === "session-prep") {
    return {
      messages: [
        { role: "system", content: baseSystem },
        {
          role: "user",
          content:
            `Schlage eine Sitzungsvorbereitung vor. Therapieansatz: ${payload.approach ?? "—"}. ` +
            `Therapieziele: ${payload.goals ?? "—"}. ` +
            `Letzte Sitzung (strukturiert): ${payload.lastStructured ?? "Keine Vorinfo."}`,
        },
      ],
      tools: [
        tool("return_prep", "Liefert Vorschläge zur Sitzungsvorbereitung.", {
          type: "object",
          properties: {
            agenda: { type: "array", items: { type: "string" } },
            interventionsvorschlaege: { type: "array", items: { type: "string" } },
            checkInFragen: { type: "array", items: { type: "string" } },
          },
          required: ["agenda", "interventionsvorschlaege", "checkInFragen"],
          additionalProperties: false,
        }),
      ],
      tool_choice: { type: "function", function: { name: "return_prep" } },
    };
  }

  throw new Error("Unbekannte Task: " + task);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { task, payload, patientPseudonym } = await req.json();
    if (!task) throw new Error("task fehlt");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY fehlt");

    const reqBody = buildRequest(task, payload ?? {}, patientPseudonym);

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, ...reqBody }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Zu viele Anfragen – bitte kurz warten." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "AI-Guthaben aufgebraucht. Bitte in Lovable Workspace aufladen." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI-Gateway Fehler:", resp.status, t);
      return new Response(JSON.stringify({ error: "AI-Gateway Fehler" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) {
      return new Response(JSON.stringify({ error: "Keine strukturierte Antwort." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(call.function.arguments);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-assist Fehler:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unbekannt" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
