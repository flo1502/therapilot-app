// AI-Assist Edge Function für TheraPilot
// WICHTIG: Hier kommen NUR pseudonymisierte Daten an. Trotzdem keine Persistenz.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "google/gemini-2.5-flash";
const MODEL_SLIDES = "openai/gpt-5"; // Slide-Generierung profitiert stark von Reasoning

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
    const slideCount = payload.slideCount ?? 6;
    return {
      messages: [
        { role: "system", content: baseSystem },
        {
          role: "user",
          content:
            `Erstelle ein psychoedukatives Slidedeck zum Thema "${payload.topic}" für eine:n Patient:in.\n\n` +
            `Therapieansatz: ${payload.approach ?? "—"}.\n` +
            `Patient:in (pseudonymisiert): Altersgruppe ${payload.ageGroup ?? "—"}, ` +
            `Therapieziele: ${payload.goals ?? "—"}, Diagnosen: ${(payload.diagnoses ?? []).join(", ") || "—"}.\n` +
            `Anzahl inhaltlicher Slides: ${slideCount}.\n\n` +
            `WICHTIG – DIDAKTIK:\n` +
            `• Vermeide reine Bullet-Wüsten. Nutze für jede Folie das passende Layout.\n` +
            `• Layouts: "headline" (eine zentrale Botschaft, kurz & prägnant), "model" (3-5 Schlüsselbegriffe nebeneinander mit Kurzerklärung), ` +
            `"vicious-cycle" (4 Knoten im Kreis – z.B. Auslöser → Gedanke → Körperreaktion → Verhalten), ` +
            `"before-after" (Vorher/Nachher oder ungesund/gesund), "steps" (3-5 konkrete Schritte einer Übung), ` +
            `"question" (Reflexionsfrage zum Innehalten), "bullets" (nur wenn nichts anderes passt, max. 4 Bullets).\n` +
            `• Empfohlener Aufbau: Slide 1 "headline" (Einstieg), 1-2 "model" oder "vicious-cycle" (Erklärung), ` +
            `1 "before-after" oder "steps" (Anwendung), 1 "question" (Reflexion).\n` +
            `• Sprache: einfach, empathisch, deutsch, Sie-Form/neutral.\n` +
            `• Texte kurz: Bullets max. 12 Wörter, Headlines max. 10 Wörter, Beschreibungen max. 15 Wörter.\n` +
            `• Sprechernotizen ("notes") für die Therapeut:in ausführlicher.\n` +
            `• Verwende für jede Folie einen passenden iconKey aus: ` +
            `brain, heart, compass, breath, scale, lightbulb, target, leaf, sun, cycle, steps, question, shield, hands.\n\n` +
            (payload.templateOutline
              ? `Template-Orientierung (Inhalte anpassen, Layout neu wählen): ${JSON.stringify(payload.templateOutline)}`
              : ""),
        },
      ],
      tools: [
        tool("return_deck", "Liefert ein didaktisch reiches Slidedeck.", {
          type: "object",
          properties: {
            title: { type: "string", description: "Deck-Titel, max. 8 Wörter." },
            slides: {
              type: "array",
              minItems: 3,
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Slide-Titel, max. 8 Wörter." },
                  layout: {
                    type: "string",
                    enum: ["headline", "model", "vicious-cycle", "before-after", "steps", "question", "bullets"],
                  },
                  iconKey: {
                    type: "string",
                    enum: ["brain", "heart", "compass", "breath", "scale", "lightbulb", "target", "leaf", "sun", "cycle", "steps", "question", "shield", "hands"],
                  },
                  bullets: {
                    type: "array",
                    items: { type: "string" },
                    description: "Bei layout='bullets': Hauptinhalte. Sonst: 1-3 Punkte als Kurz-Zusammenfassung/Fallback.",
                  },
                  headline: { type: "string", description: "Bei 'headline'/'question': zentrale Aussage." },
                  subline: { type: "string", description: "Optionaler Untertitel." },
                  nodes: {
                    type: "array",
                    description: "Bei 'model': 3-5 Knoten.",
                    items: {
                      type: "object",
                      properties: { label: { type: "string" }, description: { type: "string" } },
                      required: ["label"],
                      additionalProperties: false,
                    },
                  },
                  centerLabel: { type: "string", description: "Bei 'vicious-cycle': Begriff in der Mitte." },
                  cycleNodes: {
                    type: "array",
                    description: "Bei 'vicious-cycle': genau 4 Knoten.",
                    items: {
                      type: "object",
                      properties: { label: { type: "string" }, description: { type: "string" } },
                      required: ["label"],
                      additionalProperties: false,
                    },
                  },
                  before: {
                    type: "object",
                    description: "Bei 'before-after': linke Seite.",
                    properties: { title: { type: "string" }, items: { type: "array", items: { type: "string" } } },
                    required: ["title", "items"],
                    additionalProperties: false,
                  },
                  after: {
                    type: "object",
                    description: "Bei 'before-after': rechte Seite.",
                    properties: { title: { type: "string" }, items: { type: "array", items: { type: "string" } } },
                    required: ["title", "items"],
                    additionalProperties: false,
                  },
                  steps: {
                    type: "array",
                    description: "Bei 'steps': 3-5 Schritte.",
                    items: {
                      type: "object",
                      properties: { title: { type: "string" }, description: { type: "string" } },
                      required: ["title"],
                      additionalProperties: false,
                    },
                  },
                  notes: { type: "string", description: "Sprechernotizen für Therapeut:in." },
                },
                required: ["title", "layout", "bullets"],
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
