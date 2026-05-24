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

  if (task === "generate-stage-slides") {
    // Curriculum-spezifische Slide-Generierung mit deutschem Spezial-Prompt
    const { curriculum, stageConfig, patientInfo, sessionNotes } = payload ?? {};
    const numSlides = stageConfig?.num_slides || stageConfig?.folienthemen?.length || 3;

    const personalization = [
      `- Name: ${patientInfo?.name ?? pseudo ?? "[PATIENT:IN]"}`,
      patientInfo?.alter && `- Alter: ${patientInfo.alter}`,
      patientInfo?.beruf && `- Beruf: ${patientInfo.beruf}`,
      patientInfo?.triggers?.length && `- Trigger-Situationen: ${patientInfo.triggers.join(", ")}`,
      patientInfo?.hauptsymptome?.length && `- Hauptsymptome: ${patientInfo.hauptsymptome.join(", ")}`,
      patientInfo?.hauptangst_gedanken?.length && `- Angst-Gedanken: ${patientInfo.hauptangst_gedanken.join(", ")}`,
      patientInfo?.vermeidungs_verhalten?.length && `- Vermeidung: ${patientInfo.vermeidungs_verhalten.join(", ")}`,
      patientInfo?.ziele?.length && `- Therapieziele: ${patientInfo.ziele.join(", ")}`,
      patientInfo?.lernstil && `- Lernstil: ${patientInfo.lernstil}`,
    ].filter(Boolean).join("\n");

    const stageBlock = `
AKTUELLER BEHANDLUNGSKONTEXT:
- Diagnose: ${curriculum?.name} (${curriculum?.diagnose})
- Leitlinie: ${curriculum?.leitlinie}
- Evidenzbasis: ${curriculum?.evidence_basis}
- Aktuelles Stadium: ${stageConfig?.stadium} - ${stageConfig?.name}
- Geplante Sitzungen: ${stageConfig?.sitzungen}

LERNZIELE FÜR DIESES STADIUM:
${(stageConfig?.lernziele ?? []).map((z: string, i: number) => `${i + 1}. ${z}`).join("\n")}

ERFORDERLICHE INHALTE (alle müssen vorkommen!):
${(stageConfig?.erforderliche_inhalte ?? []).map((c: string, i: number) => `${i + 1}. ${c}`).join("\n")}

FOLIENTHEMEN:
${(stageConfig?.folienthemen ?? []).map((t: string, i: number) => `${i + 1}. ${t}`).join("\n")}

SPRACHE: ${stageConfig?.sprach_niveau}
TONE: ${stageConfig?.tone}

PATIENT-PERSONALISIERUNG (alle Folien personalisieren!):
${personalization}

BEISPIEL-STRUKTUR FÜR DIESES STADIUM:
${(stageConfig?.beispiel_struktur ?? []).map((b: string) => `- ${b}`).join("\n")}

DIDAKTISCHER HINWEIS:
${stageConfig?.therapeut_notizen ?? ""}
${sessionNotes?.trim() ? `\nSITZUNGS-NOTIZEN DES THERAPEUTEN:\n${sessionNotes}` : ""}
`.trim();

    const fullSystem = `Du bist ein spezialisierter KI-Assistent für Psychotherapeuten in Deutschland.
SPEZIALISIERUNG: Strukturierte Psychoedukations-Folien nach DGPPN/DGPs-Leitlinien.
EINSCHRÄNKUNGEN:
- IMMER das Curriculum für das aktuelle Stadium befolgen
- NIE Inhalte außerhalb des aktuellen Stadiums
- NIE Behandlungsempfehlungen direkt an Patient:in
- IMMER konkrete Fallbeispiele mit Patient-Bezug
- NIE Fachjargon ohne einfache Erklärung
- IMMER auf Deutsch (A1-A2, einfache Sprache)

SPRACHE-REGELN:
- Sätze max. 12 Wörter
- Stichpunkte max. 15 Wörter
- Aktive Verben, Du-Form
- Konkret statt abstrakt

THERAPEUTISCHE PRINZIPIEN:
- Normalisierung, Hoffnung, Selbstwirksamkeit
- Sokratische Methode statt Vorträge
- Lebenswelt-Bezug (Beruf!) in Beispielen

VERBOTENE FORMULIERUNGEN:
"Sie haben eine Störung" → "Du erlebst Panik"
"Das ist gefährlich" → "Das fühlt sich unangenehm an"
"Pathologisch" → "Stärker als normal"

Patient-Pseudonym: '${pseudo ?? "[PATIENT:IN]"}'.

${stageBlock}

OUTPUT: Erstelle EXAKT ${numSlides} Folien. Jede Folie hat: title, bullets (3-4), example, speaker_notes.
Validiere selbst: Sind alle erforderlichen Inhalte enthalten? Ist personalisiert? Sind Beispiele konkret?`;

    return {
      messages: [
        { role: "system", content: fullSystem },
        { role: "user", content: `Generiere die ${numSlides} Folien jetzt.` },
      ],
      tools: [
        tool("return_stage_slides", "Liefert curriculum-konforme Stadien-Folien.", {
          type: "object",
          properties: {
            slides: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Folientitel, max. 60 Zeichen." },
                  bullets: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
                  example: { type: "string", description: "Konkretes Beispiel mit Patient-Bezug." },
                  speaker_notes: { type: "string", description: "Hinweise für Therapeut:in." },
                },
                required: ["title", "bullets", "example"],
                additionalProperties: false,
              },
            },
          },
          required: ["slides"],
          additionalProperties: false,
        }),
      ],
      tool_choice: { type: "function", function: { name: "return_stage_slides" } },
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

// ============== KV-Verlaufsdokumentation (2-Pass: Extract -> Compose) ==============

const KV_EXTRACT_TOOL = {
  type: "function",
  function: {
    name: "return_kv_extraction",
    description: "Extrahiert strukturierte Fakten aus dem Sitzungs-Transkript.",
    parameters: {
      type: "object",
      properties: {
        symptome: { type: "array", items: { type: "string" } },
        themen: { type: "array", items: { type: "string" } },
        interventionen: {
          type: "array",
          items: {
            type: "object",
            properties: {
              kind: {
                type: "string",
                enum: [
                  "Psychoedukation","KVT","Exposition","Kognitive Umstrukturierung",
                  "Verhaltensanalyse","Skills-Training","Achtsamkeit","Validierung",
                  "Sokratischer Dialog","Ressourcenaktivierung","Imagination",
                  "Hausaufgaben-Besprechung","Krisenintervention","Sonstiges",
                ],
              },
              beschreibung: { type: "string" },
            },
            required: ["kind", "beschreibung"],
            additionalProperties: false,
          },
        },
        vereinbarungen: { type: "array", items: { type: "string" } },
        risiken: {
          type: "object",
          properties: {
            suizidalitaet: { type: "string" },
            fremdgefahrdung: { type: "string" },
            selbstverletzung: { type: "string" },
            substanzkonsum: { type: "string" },
            sonstige: { type: "string" },
          },
          required: ["suizidalitaet"],
          additionalProperties: false,
        },
        verlauf_indikatoren: { type: "array", items: { type: "string" } },
        abrechnung: {
          type: "object",
          properties: {
            sitzungsformat: { type: "string" },
            dauerMin: { type: "number" },
            besonderheiten: { type: "string" },
            ziffer_hinweise: { type: "array", items: { type: "string" } },
          },
          additionalProperties: false,
        },
      },
      required: ["symptome", "themen", "interventionen", "vereinbarungen", "risiken", "verlauf_indikatoren", "abrechnung"],
      additionalProperties: false,
    },
  },
};

const KV_COMPOSE_TOOL = {
  type: "function",
  function: {
    name: "return_kv_documentation",
    description: "Liefert die finale 7-Sektionen Verlaufsdokumentation.",
    parameters: {
      type: "object",
      properties: {
        aktuelle_symptomatik: { type: "string" },
        inhalte_der_sitzung: { type: "string" },
        therapeutische_interventionen: { type: "string" },
        verlauf_und_einschaetzung: { type: "string" },
        vereinbarungen: { type: "string" },
        risikoabklaerung: { type: "string" },
        administrative_hinweise: { type: "string" },
      },
      required: [
        "aktuelle_symptomatik","inhalte_der_sitzung","therapeutische_interventionen",
        "verlauf_und_einschaetzung","vereinbarungen","risikoabklaerung","administrative_hinweise",
      ],
      additionalProperties: false,
    },
  },
};

async function callGateway(apiKey: string, model: string, body: any): Promise<any> {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, ...body }),
  });
  if (resp.status === 429) throw new Error("RATE_LIMIT");
  if (resp.status === 402) throw new Error("PAYMENT_REQUIRED");
  if (!resp.ok) {
    const t = await resp.text();
    console.error("AI-Gateway Fehler:", resp.status, t);
    throw new Error("AI-Gateway Fehler");
  }
  const data = await resp.json();
  const call = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!call?.function?.arguments) throw new Error("Keine strukturierte Antwort.");
  return JSON.parse(call.function.arguments);
}

async function runKVDocumentation(apiKey: string, payload: any, pseudo?: string) {
  const transcript: string = payload?.transcript ?? "";
  const context = payload?.context ?? {};
  const previousErrors: string[] = payload?.previousErrors ?? [];

  if (!transcript.trim()) throw new Error("Transkript fehlt");

  const baseSystem =
    "Du bist ein klinischer Dokumentations-Assistent für approbierte Psychotherapeut:innen in Deutschland. " +
    "Du arbeitest ausschließlich mit pseudonymisierten Daten. Patient:in wird mit dem Pseudonym " +
    `'${pseudo ?? "[PATIENT:IN]"}' bezeichnet. ` +
    "Du stellst KEINE Diagnosen und gibst KEINE Behandlungsanweisungen.";

  // PASS 1 – EXTRACT
  const extractSystem = `${baseSystem}

AUFGABE: Extrahiere strukturierte Fakten aus dem Transkript einer psychotherapeutischen Sitzung.

REGELN:
- Nur explizit Genanntes oder klar Beobachtbares extrahieren – keine Vermutungen.
- Interventionen klassifizieren nach Whitelist (siehe Tool-Schema).
- Risiken: Suizidalität ist Pflichtfeld. Wenn nicht thematisiert: "nicht exploriert" oder "kein Hinweis im Transkript".
- Abrechnungs-Hinweise: nur Format/Dauer/Besonderheiten erkennen, KEINE konkreten EBM-Ziffern erfinden.
- Vereinbarungen umfassen Hausaufgaben, nächste Sitzung, Absprachen.
- Knapp und neutral formulieren.`;

  const extract = await callGateway(apiKey, "google/gemini-2.5-pro", {
    messages: [
      { role: "system", content: extractSystem },
      {
        role: "user",
        content:
          `Kontext:\n- Diagnose(n): ${(context.diagnoses ?? []).join(", ") || "—"}\n` +
          `- Therapieansatz: ${context.approach ?? "—"}\n` +
          `- Therapieziele: ${context.goals ?? "—"}\n` +
          `- Sitzungsdauer (Min): ${context.durationMin ?? "—"}\n\n` +
          `Transkript:\n${transcript}`,
      },
    ],
    tools: [KV_EXTRACT_TOOL],
    tool_choice: { type: "function", function: { name: "return_kv_extraction" } },
  });

  // PASS 2 – COMPOSE
  const composeSystem = `${baseSystem}

AUFGABE: Erstelle eine KV-konforme psychotherapeutische Verlaufsdokumentation in EXAKT 7 Abschnitten:
1. Aktuelle Symptomatik
2. Inhalte der Sitzung
3. Therapeutische Interventionen
4. Verlauf und Einschätzung
5. Vereinbarungen
6. Risikoabklärung
7. Administrative / Abrechnungsrelevante Hinweise

STIL-REGELN (kritisch!):
- Klinisch-neutral, knapp, indirekte Wiedergabe.
- KEINE direkte Rede ("..."), KEINE wörtlichen Zitate.
- KEINE wertenden Aussagen ("leider", "beeindruckend", "tapfer" etc.).
- KEINE spekulativen Diagnosen ("vermutlich depressiv", "wirkt traumatisiert").
- Therapeutische Fachsprache korrekt, aber sparsam – keine Bullet-Wüsten.
- Nur Inhalte, die explizit genannt oder beobachtbar sind.
- Risikoabklärung MUSS eine explizite Aussage zu Suizidalität enthalten (auch "nicht exploriert").
- Patient:in immer mit Pseudonym '${pseudo ?? "[PATIENT:IN]"}' oder neutral ("die Patientin", "der Patient", "Pat.").
- Abrechnungsrelevante Hinweise priorisieren (Format, Dauer, Setting, Besonderheiten).
${previousErrors.length ? `\nVORHERIGER VERSUCH HATTE FEHLER – BITTE BEHEBEN:\n${previousErrors.map((e) => `- ${e}`).join("\n")}` : ""}`;

  const documentation = await callGateway(apiKey, "openai/gpt-5", {
    messages: [
      { role: "system", content: composeSystem },
      {
        role: "user",
        content:
          `Extrahierte Fakten (Pass 1):\n${JSON.stringify(extract, null, 2)}\n\n` +
          `Kontext:\n- Diagnose(n): ${(context.diagnoses ?? []).join(", ") || "—"}\n` +
          `- Therapieansatz: ${context.approach ?? "—"}\n` +
          `- Therapieziele: ${context.goals ?? "—"}\n` +
          `- Sitzungsdauer (Min): ${context.durationMin ?? "—"}\n\n` +
          `Verfasse jetzt die 7-Sektionen-Dokumentation.`,
      },
    ],
    tools: [KV_COMPOSE_TOOL],
    tool_choice: { type: "function", function: { name: "return_kv_documentation" } },
  });

  return { extraction: extract, documentation };
}

// ============== CBT-Schema-Analyse ==============

const SCHEMA_CATEGORIES = [
  "Defekt / Scham",
  "Versagen / Unzulänglichkeit",
  "Gefahr / Unsicherheit",
  "Verlassenwerden",
  "Misstrauen / Bewertung durch andere",
  "Kontrollverlust",
] as const;

const SCHEMA_TOOL = {
  type: "function",
  function: {
    name: "return_schema_analysis",
    description: "Liefert die CBT-Schema-Analyse als WhatsApp-Style-Feed.",
    parameters: {
      type: "object",
      properties: {
        schema_summary_chat: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: [...SCHEMA_CATEGORIES] },
              count: { type: "integer", minimum: 1 },
              chat_preview: { type: "string", description: "Kurze, scannable Inbox-Notification, z.B. '💬 3 neue Hinweise auf Selbstwert-Schema'." },
              examples: {
                type: "array",
                minItems: 1,
                items: {
                  type: "object",
                  properties: {
                    trigger_sentence: { type: "string", description: "Exaktes Zitat aus dem Transkript." },
                    context: { type: "string", description: "Kurzer Kontext (max. 1 Satz)." },
                    timestamp: { type: "string", description: "Optionaler Zeitstempel falls im Transkript vorhanden." },
                  },
                  required: ["trigger_sentence", "context"],
                  additionalProperties: false,
                },
              },
            },
            required: ["type", "count", "chat_preview", "examples"],
            additionalProperties: false,
          },
        },
      },
      required: ["schema_summary_chat"],
      additionalProperties: false,
    },
  },
};

async function runSchemaAnalysis(apiKey: string, payload: any, pseudo?: string) {
  const transcript: string = payload?.transcript ?? "";
  if (!transcript.trim()) throw new Error("Transkript fehlt");

  const system =
    "Du bist CBT Cognitive Schema Analyst für approbierte Psychotherapeut:innen in Deutschland. " +
    "Du arbeitest mit pseudonymisierten Transkripten. " +
    `Patient:in wird mit '${pseudo ?? "[PATIENT:IN]"}' bezeichnet.\n\n` +
    "AUFGABE: Erkenne dysfunktionale kognitive Schemata (Core Beliefs) im Sitzungs-Transkript und gruppiere sie.\n\n" +
    "FIXE TAXONOMIE (nur diese 6 Kategorien verwenden):\n" +
    "- 'Defekt / Scham' (ich bin wertlos, kaputt, nicht gut genug)\n" +
    "- 'Versagen / Unzulänglichkeit' (ich schaffe das nicht, bin inkompetent)\n" +
    "- 'Gefahr / Unsicherheit' (es ist gefährlich, ich kippe um)\n" +
    "- 'Verlassenwerden' (niemand ist für mich da, ich werde verlassen)\n" +
    "- 'Misstrauen / Bewertung durch andere' (andere bewerten mich, ich blamiere mich)\n" +
    "- 'Kontrollverlust' (ich drehe durch, werde verrückt, verliere Kontrolle)\n\n" +
    "STRENGE EVIDENZ-REGELN:\n" +
    "1. NUR exakte Patient:innen-Zitate oder vom Patienten ausdrücklich BESTÄTIGTE Therapeut-Paraphrasen verwenden.\n" +
    "2. KEINE Inferenz, KEINE Vermutungen, NIE Beliefs erfinden.\n" +
    "3. Keyword-Treffer reicht NICHT – die Aussage muss die Schema-Bedeutung tatsächlich tragen.\n" +
    "4. Counting: jede DISTINKTE Aussage = +1. Reine Wiederholung zählt nur, wenn neuer Kontext oder getrennte Ereignisse.\n" +
    "5. Wenn keine Evidenz für eine Kategorie: Kategorie WEGLASSEN (kein leerer Eintrag).\n" +
    "6. trigger_sentence MUSS wörtlich aus dem Transkript stammen.\n" +
    "7. context: ein knapper Satz, der das Auftreten einordnet (Situation/Thema), KEINE Wertung.\n" +
    "8. chat_preview: kurz, scannable, Therapeut-Inbox-Stil (z.B. '💬 3 neue Hinweise auf Selbstwert-Schema').\n\n" +
    "Wenn das Transkript keinerlei Evidenz enthält: leeres Array zurückgeben.";

  return await callGateway(apiKey, "google/gemini-2.5-pro", {
    messages: [
      { role: "system", content: system },
      { role: "user", content: `Transkript:\n${transcript}` },
    ],
    tools: [SCHEMA_TOOL],
    tool_choice: { type: "function", function: { name: "return_schema_analysis" } },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { task, payload, patientPseudonym } = await req.json();
    if (!task) throw new Error("task fehlt");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY fehlt");

    // Spezial-Pfad: KV-Verlaufsdokumentation (zwei sequentielle LLM-Calls)
    if (task === "kv-documentation") {
      try {
        const result = await runKVDocumentation(LOVABLE_API_KEY, payload ?? {}, patientPseudonym);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        const msg = e?.message ?? "Unbekannt";
        if (msg === "RATE_LIMIT") {
          return new Response(JSON.stringify({ error: "Zu viele Anfragen – bitte kurz warten." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (msg === "PAYMENT_REQUIRED") {
          return new Response(JSON.stringify({ error: "AI-Guthaben aufgebraucht. Bitte in Lovable Workspace aufladen." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        return new Response(JSON.stringify({ error: msg }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Spezial-Pfad: CBT-Schema-Analyse
    if (task === "cbt-schema-analysis") {
      try {
        const result = await runSchemaAnalysis(LOVABLE_API_KEY, payload ?? {}, patientPseudonym);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        const msg = e?.message ?? "Unbekannt";
        if (msg === "RATE_LIMIT") {
          return new Response(JSON.stringify({ error: "Zu viele Anfragen – bitte kurz warten." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (msg === "PAYMENT_REQUIRED") {
          return new Response(JSON.stringify({ error: "AI-Guthaben aufgebraucht." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        return new Response(JSON.stringify({ error: msg }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (msg === "PAYMENT_REQUIRED") {
          return new Response(JSON.stringify({ error: "AI-Guthaben aufgebraucht. Bitte in Lovable Workspace aufladen." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        return new Response(JSON.stringify({ error: msg }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const reqBody = buildRequest(task, payload ?? {}, patientPseudonym);
    const model = (task === "personalize-slides" || task === "generate-stage-slides") ? MODEL_SLIDES : MODEL;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, ...reqBody }),
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
