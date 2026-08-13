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
        naechste_schritte: {
          type: "array",
          items: { type: "string" },
          description: "3-5 offene Aufgaben/Hausaufgaben für die Patient:in, die in der Sitzung besprochen wurden. Leeres Array, wenn keine.",
        },
      },
      required: [
        "aktuelle_symptomatik","inhalte_der_sitzung","therapeutische_interventionen",
        "verlauf_und_einschaetzung","vereinbarungen","risikoabklaerung","administrative_hinweise",
        "naechste_schritte",
      ],
      additionalProperties: false,
    },
  },
};

async function callGateway(apiKey: string, model: string, body: any): Promise<any> {
  const fallbacks = model !== "google/gemini-2.5-pro" ? [model, "google/gemini-2.5-pro"] : [model];
  let lastStatus = 0;
  let lastBody = "";
  for (const m of fallbacks) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: m, ...body }),
      });
      if (resp.status === 429) throw new Error("RATE_LIMIT");
      if (resp.status === 402) throw new Error("PAYMENT_REQUIRED");
      if (resp.ok) {
        const data = await resp.json();
        const call = data.choices?.[0]?.message?.tool_calls?.[0];
        if (!call?.function?.arguments) throw new Error("Keine strukturierte Antwort.");
        return JSON.parse(call.function.arguments);
      }
      lastStatus = resp.status;
      lastBody = await resp.text();
      console.error(`AI-Gateway Fehler (model=${m}, attempt=${attempt + 1}):`, resp.status, lastBody);
      if (resp.status >= 500 && resp.status < 600) {
        await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
        continue;
      }
      break;
    }
  }
  throw new Error(`AI-Gateway Fehler (${lastStatus})`);
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
- naechste_schritte: max. 3-5 knappe Stichpunkte mit offenen Aufgaben/Hausaufgaben für die Patient:in, die in der Sitzung besprochen wurden. Jeweils ein kurzer Satz, ohne Nummerierung. Wenn keine besprochen wurden: leeres Array.
- administrative_hinweise: nur ausfüllen, wenn im Transkript/Kontext tatsächlich etwas mit Fristen oder Formalia genannt wurde (z. B. Antrag läuft aus, Verlängerung nötig, Bericht fällig). Nichts erfinden – sonst leer lassen ("").
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

// ============== Depression KPI Extraction ==============

const KPI_TOOL = {
  type: "function",
  function: {
    name: "return_session_kpis",
    description: "Extrahiert quantitative Depression-KPIs aus der Sitzung inkl. klinischer Sub-Signale.",
    parameters: {
      type: "object",
      properties: {
        depressionSeverity: { type: "integer", minimum: 0, maximum: 100, description: "Globaler Eindruck 0-100. 0=keine Symptome, 100=schwerste." },
        negativeBeliefsCount: { type: "integer", minimum: 0 },
        adaptiveBeliefsCount: { type: "integer", minimum: 0 },
        positiveActivitiesCount: { type: "integer", minimum: 0 },
        activeActivities: { type: "integer", minimum: 0 },
        passiveActivities: { type: "integer", minimum: 0 },
        socialContactsCount: { type: "integer", minimum: 0 },
        socialInitiated: { type: "integer", minimum: 0 },
        socialPassive: { type: "integer", minimum: 0 },
        emotionAwareness: { type: "integer", minimum: 0, maximum: 5 },
        emotionRegulation: { type: "integer", minimum: 0, maximum: 5 },
        positiveSelfStatements: { type: "integer", minimum: 0 },
        negativeSelfStatements: { type: "integer", minimum: 0 },

        // Klinische Sub-Signale 0-10
        mood: { type: "integer", minimum: 0, maximum: 10, description: "Stimmung: 0=sehr niedergedrückt, 10=ausgeglichen/positiv." },
        anhedonia: { type: "integer", minimum: 0, maximum: 10, description: "Freudverlust 0=keiner, 10=komplette Anhedonie." },
        energy: { type: "integer", minimum: 0, maximum: 10, description: "Antrieb 0=erschöpft, 10=vital." },
        cognition: { type: "integer", minimum: 0, maximum: 10, description: "Konzentration/Denken 0=blockiert, 10=klar." },
        hopelessness: { type: "integer", minimum: 0, maximum: 10, description: "Hoffnungslosigkeit 0=keine, 10=total." },
        selfDeprecation: { type: "integer", minimum: 0, maximum: 10, description: "Selbstabwertung 0=keine, 10=stark." },
        guilt: { type: "integer", minimum: 0, maximum: 10, description: "Schuldgefühle 0=keine, 10=überwältigend." },
        avoidanceCount: { type: "integer", minimum: 0, description: "Berichtete Vermeidungs-Episoden." },
        functioningWork: { type: "integer", minimum: 0, maximum: 10, description: "Funktion Arbeit/Studium 0=nicht arbeitsfähig, 10=voll." },
        functioningSocial: { type: "integer", minimum: 0, maximum: 10 },
        functioningDaily: { type: "integer", minimum: 0, maximum: 10, description: "Alltag/Selbstversorgung." },
        sleepDisturbance: { type: "integer", minimum: 0, maximum: 10, description: "Schlafstörung 0=keine, 10=massiv." },
        psychomotor: { type: "integer", minimum: 0, maximum: 10, description: "Psychomotorische Verlangsamung/Agitation 0=keine, 10=ausgeprägt." },
        somaticSymptoms: { type: "integer", minimum: 0, maximum: 10, description: "Somatische Beschwerden 0=keine, 10=stark." },

        // Risiko
        riskLevel: { type: "integer", minimum: 0, maximum: 3, description: "0=keine, 1=passive Ideation, 2=aktive Ideation, 3=Planung." },
        riskNotes: { type: "string", description: "Kurze Begründung bei Risk>0, sonst leer." },

        // SCID/CIDI proxy
        scid: {
          type: "object",
          description: "Rekonstruierter Status nach DSM-5/ICD-10 Major Depressive Episode.",
          properties: {
            coreSymptoms: { type: "boolean", description: "Kernsymptome (Stimmung ODER Anhedonie) ≥2 Wochen." },
            durationOver2Weeks: { type: "boolean" },
            functionalImpairment: { type: "boolean" },
            exclusionOtherDisorder: { type: ["boolean", "null"], description: "Andere Störung ausgeschlossen? null wenn unklar." },
            confidence: { type: "string", enum: ["low", "medium", "high"] },
            likelyDiagnosis: { type: "string", description: "z.B. 'Major Depressive Episode' oder 'Anpassungsstörung'." },
          },
          required: ["coreSymptoms", "durationOver2Weeks", "functionalImpairment", "confidence"],
          additionalProperties: false,
        },

        // Drilldown
        keyQuotes: {
          type: "array",
          maxItems: 5,
          description: "Bis zu 5 wörtliche, prägnante Zitate aus dem Transkript.",
          items: {
            type: "object",
            properties: {
              text: { type: "string" },
              tag: { type: "string", enum: ["belief", "emotion", "risk", "activity", "insight"] },
            },
            required: ["text", "tag"],
            additionalProperties: false,
          },
        },

        notes: { type: "string", description: "Kurze Begründung, 1-2 Sätze." },
      },
      required: [
        "depressionSeverity","negativeBeliefsCount","adaptiveBeliefsCount",
        "positiveActivitiesCount","socialContactsCount",
        "emotionAwareness","emotionRegulation","positiveSelfStatements",
      ],
      additionalProperties: false,
    },
  },
};

async function runKPIExtraction(apiKey: string, payload: any, pseudo?: string) {
  const transcript: string = payload?.transcript ?? "";
  if (!transcript.trim()) throw new Error("Transkript fehlt");

  const system =
    "Du bist ein quantitativer Therapie-Analyst für Depression (F32/F33) in Deutschland. " +
    `Du arbeitest mit pseudonymisierten Sitzungs-Transkripten. Patient:in: '${pseudo ?? "[PATIENT:IN]"}'.\n\n` +
    "AUFGABE: Extrahiere QUANTITATIVE KPIs und klinische Sub-Signale aus einer einzelnen Sitzung.\n\n" +
    "STRENGE REGELN:\n" +
    "1. Nur werten, was im Transkript explizit genannt oder klar erkennbar ist. Im Zweifel niedriger / 0.\n" +
    "2. Sub-Signale (mood/anhedonia/energy/cognition/sleepDisturbance/psychomotor/somaticSymptoms/guilt/hopelessness/selfDeprecation): " +
    "Skala 0-10. Wenn nicht erwähnt: weglassen (NICHT raten). Bei mood/energy/cognition: 10 = positiv/gesund, 0 = schlecht. " +
    "Bei anhedonia/hopelessness/selfDeprecation/guilt/sleepDisturbance/psychomotor/somaticSymptoms: 10 = stark belastend, 0 = nicht vorhanden.\n" +
    "3. functioningWork/Social/Daily: 10 = volle Funktion, 0 = nicht funktionsfähig. Nur setzen wenn berichtet.\n" +
    "4. riskLevel: 0 default. Nur erhöhen bei klaren Hinweisen. 1=Lebensmüdigkeit ohne Plan, 2=aktive Suizidgedanken, 3=Plan/Vorbereitung. " +
    "Bei riskLevel>0 immer riskNotes mit Original-Hinweis.\n" +
    "5. scid: konservativ. confidence='high' nur wenn alle 4 Kriterien klar im Transkript belegt. Sonst 'medium' oder 'low'.\n" +
    "6. keyQuotes: max. 5 WÖRTLICHE kurze Zitate (max. 20 Wörter), die zentrale beliefs/emotions/risks/insights belegen.\n" +
    "7. Beliefs: zähle DISTINKTE Aussagen, keine Wiederholungen.\n" +
    "8. depressionSeverity: Gesamteindruck 0-100, grob an PHQ-9-Logik. Verlaufs-Indikator, KEINE Diagnose.\n" +
    "9. notes: 1-2 Sätze neutrale Begründung.";

  return await callGateway(apiKey, "google/gemini-2.5-pro", {
    messages: [
      { role: "system", content: system },
      { role: "user", content: `Sitzungs-Transkript:\n${transcript}` },
    ],
    tools: [KPI_TOOL],
    tool_choice: { type: "function", function: { name: "return_session_kpis" } },
  });
}


// ============== Anamnese-Extraktion (VT-Bögen 1–3) ==============

const ANAMNESE_FIELD_PATHS = [
  "kindheit.selbstbeschreibung","kindheit.gesundheitszustand","kindheit.problemeStoerungen",
  "kindheit.verluste","kindheit.traumatisierungen","kindheit.besondereSituationen",
  "eltern.alter","eltern.beruf","eltern.persoenlichkeit","eltern.erziehungsstil",
  "eltern.beziehungKommunikation","eltern.atmosphaere","eltern.geschwister",
  "schule.abschluesse","schule.beziehungMitschuelerLehrer",
  "beruf.ausbildungen","beruf.beziehungVorgesetzteKollegen",
  "sexualitaetPartnerschaften",
  "interessenHobbys","ressourcen",
  "aktuelleLebenssituation.wohnen","aktuelleLebenssituation.arbeit","aktuelleLebenssituation.beziehungen",
  "aktuelleLebenssituation.kinder","aktuelleLebenssituation.eltern","aktuelleLebenssituation.krankheiten",
  "symptomanamnese.aktuelleSymptomatik","symptomanamnese.beginnAusloeser",
  "symptomanamnese.traumatisierungen","symptomanamnese.behandlungen",
  "symptomanamnese.medikation","symptomanamnese.problemloeseversuche",
  "psychischerBefund.interaktionsverhalten","psychischerBefund.auftreten",
  "psychischerBefund.wirkung","psychischerBefund.denkmuster",
  "persoenlichkeitsstruktur","bewertungVorlaeufigeDiagnose",
];

const ANAMNESE_FIELD_SCHEMA = {
  type: "object",
  properties: {
    text: { type: "string", description: "Prägnante Zusammenfassung in 1-3 Sätzen, A2-Sprache, sachlich. Leer wenn keine neuen Infos." },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    sources: {
      type: "array",
      items: {
        type: "object",
        properties: {
          sessionId: { type: "string" },
          sessionNr: { type: "number" },
          quote: { type: "string", description: "Wörtliches Kurzzitat aus dem Transkript, max. 30 Wörter." },
        },
        required: ["sessionId", "quote"],
        additionalProperties: false,
      },
    },
  },
  required: ["text"],
  additionalProperties: false,
};

function buildAnamneseToolParameters() {
  // Erzeuge verschachteltes Schema aus den Pfaden
  const root: any = { type: "object", properties: {}, additionalProperties: false };
  for (const path of ANAMNESE_FIELD_PATHS) {
    const parts = path.split(".");
    let cur = root;
    for (let i = 0; i < parts.length; i++) {
      const key = parts[i];
      if (i === parts.length - 1) {
        cur.properties[key] = ANAMNESE_FIELD_SCHEMA;
      } else {
        if (!cur.properties[key]) {
          cur.properties[key] = { type: "object", properties: {}, additionalProperties: false };
        }
        cur = cur.properties[key];
      }
    }
  }
  return root;
}

const ANAMNESE_TOOL = {
  type: "function",
  function: {
    name: "return_anamnese",
    description: "Liefert das gemergte Anamnese-Profil nach VT-Bögen 1–3.",
    parameters: buildAnamneseToolParameters(),
  },
};

async function runAnamneseExtraction(apiKey: string, payload: any, pseudo?: string) {
  const transcript: string = payload?.transcript ?? "";
  const sessionId: string = payload?.sessionId ?? "unknown";
  const sessionNr: number | undefined = payload?.sessionNr;
  const currentProfile = payload?.currentProfile ?? null;
  if (!transcript.trim()) throw new Error("Transkript fehlt");

  const system =
    "Du bist klinischer Anamnese-Assistent für ambulante Psychotherapie in Deutschland (VT-Standard).\n" +
    `Patient:in (pseudonymisiert): '${pseudo ?? "[PATIENT:IN]"}'.\n\n` +
    "AUFGABE: Extrahiere aus dem Sitzungs-Transkript NUR Fakten, die in die VT-Anamnese-Struktur (Bögen 1–3) passen, " +
    "und liefere ein MERGED Anamnese-Profil (bestehendes Profil + neue Infos aus dieser Session).\n\n" +
    "STRENGE REGELN:\n" +
    "1. Nichts erfinden. Nur was Patient:in oder Therapeut:in im Transkript explizit sagt.\n" +
    "2. KEINE Diagnosen stellen. Im Feld 'bewertungVorlaeufigeDiagnose' nur Hypothesen wiedergeben, die explizit genannt wurden.\n" +
    "3. Pro Feld: prägnante Zusammenfassung, max. 3 Sätze, sachliche A2-Sprache.\n" +
    "4. Jede neue Aussage MUSS mit mindestens einem WÖRTLICHEN Kurzzitat aus dem Transkript belegt werden (sources[].quote, max. 30 Wörter).\n" +
    "5. Bestehende Felder NICHT überschreiben, wenn keine neuen Infos da sind → 'text' leer lassen.\n" +
    "6. Bei Widerspruch zu bestehender Info: neue Info ergänzen, alte Info im Text erwähnen (\"zuvor: …; jetzt: …\").\n" +
    "7. Pseudonyme beibehalten, keine Klarnamen.\n" +
    `8. sessionId IMMER auf '${sessionId}' setzen, sessionNr auf ${sessionNr ?? "null"}.\n` +
    "9. confidence 0-1: 0.9+ nur bei expliziter, eindeutiger Aussage; 0.5-0.7 bei Andeutungen; <0.5 nicht ausgeben.\n" +
    "10. Felder, zu denen NICHTS gesagt wurde, gar nicht im Output erscheinen lassen (Tool akzeptiert teilweise Objekte).\n\n" +
    "OUTPUT: tool-call 'return_anamnese' – nur Felder mit NEUEN Inhalten aus diesem Transkript.";

  const userContent =
    `BESTEHENDES ANAMNESE-PROFIL (zur Orientierung, nicht wiederholen):\n` +
    `${currentProfile ? JSON.stringify(currentProfile, null, 0).slice(0, 8000) : "(noch leer)"}\n\n` +
    `SITZUNGS-NR: ${sessionNr ?? "—"} · SESSION-ID: ${sessionId}\n\n` +
    `TRANSKRIPT:\n${transcript}`;

  return await callGateway(apiKey, "google/gemini-2.5-pro", {
    messages: [
      { role: "system", content: system },
      { role: "user", content: userContent },
    ],
    tools: [ANAMNESE_TOOL],
    tool_choice: { type: "function", function: { name: "return_anamnese" } },
  });
}


// ============== Psychotherapeutischer Befund ==============
// Struktur laut prompts/befund.v1.md. Eingabe sind KEINE Rohtranskripte,
// sondern bereits strukturierte Dokumente (AnamneseProfile + KVDocumentation[]).

const BEFUND_TOOL = {
  type: "function",
  function: {
    name: "return_befund",
    description: "Liefert den psychotherapeutischen Befund in 5 Abschnitten.",
    parameters: {
      type: "object",
      properties: {
        anlass_der_behandlung: { type: "string" },
        symptomatik: { type: "string" },
        diagnose: {
          type: "object",
          properties: {
            diagnosen: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  icd10_code: { type: "string", description: "Leer, wenn im Quellmaterial kein Code vorliegt." },
                  bezeichnung: { type: "string" },
                  diagnosesicherheit: { type: "string", enum: ["G", "V", "A", "Z"] },
                  typ: { type: "string", enum: ["Hauptdiagnose", "Nebendiagnose"] },
                },
                required: ["icd10_code", "bezeichnung", "diagnosesicherheit", "typ"],
                additionalProperties: false,
              },
            },
            differentialdiagnosen: { type: "array", items: { type: "string" } },
            freitext_einordnung: { type: "string" },
          },
          required: ["diagnosen", "differentialdiagnosen", "freitext_einordnung"],
          additionalProperties: false,
        },
        psychopathologischer_befund: {
          type: "object",
          description: "AMDP-Kategorien. Jede Kategorie explizit befüllen (z.B. 'unauffällig'), nicht weglassen.",
          properties: {
            bewusstsein: { type: "string" },
            orientierung: { type: "string" },
            aufmerksamkeit_gedaechtnis: { type: "string" },
            formales_denken: { type: "string" },
            befuerchtungen_zwaenge: { type: "string" },
            wahn: { type: "string" },
            sinnestaeuschungen: { type: "string" },
            ich_stoerungen: { type: "string" },
            affektivitaet: { type: "string" },
            antrieb_psychomotorik: { type: "string" },
            zirkadiane_besonderheiten: { type: "string" },
            andere_stoerungen: { type: "string" },
            suizidalitaet: { type: "string", description: "Pflichtfeld. 'Suizidalität nicht exploriert.', wenn nirgends thematisiert." },
            zusatzmerkmale: { type: "string" },
          },
          required: [
            "bewusstsein", "orientierung", "aufmerksamkeit_gedaechtnis", "formales_denken",
            "befuerchtungen_zwaenge", "wahn", "sinnestaeuschungen", "ich_stoerungen",
            "affektivitaet", "antrieb_psychomotorik", "zirkadiane_besonderheiten",
            "andere_stoerungen", "suizidalitaet", "zusatzmerkmale",
          ],
          additionalProperties: false,
        },
        therapieempfehlung: {
          type: "object",
          properties: {
            verfahren: { type: "string" },
            setting: { type: "string" },
            frequenz: { type: "string" },
            stundenkontingent_empfehlung: { type: "string", description: "Freitext, KEINE verbindliche Stundenzahl erfinden." },
            prognose: { type: "string" },
            weitere_empfehlungen: { type: "array", items: { type: "string" } },
          },
          required: ["verfahren", "setting", "frequenz", "stundenkontingent_empfehlung", "prognose", "weitere_empfehlungen"],
          additionalProperties: false,
        },
      },
      required: [
        "anlass_der_behandlung", "symptomatik", "diagnose",
        "psychopathologischer_befund", "therapieempfehlung",
      ],
      additionalProperties: false,
    },
  },
};

async function runBefundGeneration(apiKey: string, payload: any, pseudo?: string) {
  const anamneseProfile = payload?.anamneseProfile ?? null;
  const kvDocumentations: any[] = Array.isArray(payload?.kvDocumentations) ? payload.kvDocumentations : [];

  if (!anamneseProfile && kvDocumentations.length === 0) {
    throw new Error("Weder Anamnese-Profil noch Stundenprotokolle vorhanden.");
  }

  const system =
    "Du bist ein klinischer Dokumentations-Assistent für approbierte Psychotherapeut:innen in Deutschland. " +
    "Du erstellst einen psychotherapeutischen Befund. Deine Eingabe ist NICHT ein rohes Transkript, sondern " +
    "bereits strukturierte Dokumente: das Anamnese-Profil und die bisherigen Stundenprotokolle. Du fasst " +
    "zusammen und formalisierst, du analysierst keine Rohdaten neu.\n\n" +
    `Patient:in (pseudonymisiert): '${pseudo ?? "[PATIENT:IN]"}'. Verwende NIE einen Klarnamen.\n\n` +
    "SYMPTOMATIK: Ein Symptom, das nur in einer frühen Sitzung genannt und in keiner späteren Sitzung erneut " +
    "angesprochen wurde, gilt NICHT automatisch als weiterhin bestehend – Schweigen ist keine Bestätigung. " +
    "Nicht kommentarlos als aktuell fortschreiben, sondern entweder mit Zeitbezug kennzeichnen (z.B. 'zu Beginn " +
    "berichtet, in späteren Sitzungen nicht erneut thematisiert') oder weglassen. Nur als uneingeschränkt " +
    "aktuell formulieren, wenn auch in einer jüngeren Sitzung oder im Anamnese-Profil bestätigt.\n\n" +
    "DIAGNOSE-REGEL (kritisch): Du erfindest KEINE Diagnose. Im Abschnitt 'diagnose' gibst du ausschließlich " +
    "wieder, was bereits im Anamnese-Feld 'bewertungVorlaeufigeDiagnose' oder in den Feldern " +
    "'verlauf_und_einschaetzung'/'aktuelle_symptomatik' der Stundenprotokolle als Einschätzung der " +
    "Therapeut:in dokumentiert ist. Liegt dort nichts vor: icd10_code leer lassen, freitext_einordnung " +
    "'Diagnostische Einschätzung steht noch aus.'\n\n" +
    "PSYCHOPATHOLOGISCHER BEFUND: Strukturiert nach dem AMDP-System. JEDE Kategorie explizit befüllen " +
    "(z.B. 'Unauffällig.' oder 'Kein Hinweis in den Quelldokumenten.'), niemals weglassen. suizidalitaet ist " +
    "Pflichtfeld unabhängig von den übrigen Kategorien; wenn nirgends thematisiert: " +
    "'Suizidalität nicht exploriert.'\n\n" +
    "THERAPIEEMPFEHLUNG: stundenkontingent_empfehlung niemals mit einer erfundenen konkreten Stundenzahl " +
    "befüllen, wenn im Quellmaterial keine genannt ist – dann allgemein formulieren " +
    "(z.B. 'Umfang gemäß aktueller Psychotherapie-Richtlinie durch Therapeut:in festzulegen').\n\n" +
    "STILREGELN: klinisch-neutral, knapp, indirekte Wiedergabe, keine direkte Rede/wörtlichen Zitate, keine " +
    "wertenden Aussagen, keine Diagnose-/Prognose-Spekulation über das Quellmaterial hinaus. Nur Inhalte, die " +
    "in Anamnese-Profil oder Stundenprotokollen bereits dokumentiert sind – bei Unsicherheit weglassen bzw. " +
    "'nicht dokumentiert' statt raten.";

  const userContent =
    `ANAMNESE-PROFIL:\n${anamneseProfile ? JSON.stringify(anamneseProfile, null, 0).slice(0, 12000) : "(nicht vorhanden)"}\n\n` +
    `STUNDENPROTOKOLLE (chronologisch, ${kvDocumentations.length} Stück):\n` +
    `${kvDocumentations.length ? JSON.stringify(kvDocumentations, null, 0).slice(0, 16000) : "(keine vorhanden)"}\n\n` +
    "Erstelle jetzt den psychotherapeutischen Befund in den 5 Abschnitten.";

  return await callGateway(apiKey, "openai/gpt-5", {
    messages: [
      { role: "system", content: system },
      { role: "user", content: userContent },
    ],
    tools: [BEFUND_TOOL],
    tool_choice: { type: "function", function: { name: "return_befund" } },
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


    // Spezial-Pfad: Depression KPI Extraction
    if (task === "depression-kpi-extract") {
      try {
        const result = await runKPIExtraction(LOVABLE_API_KEY, payload ?? {}, patientPseudonym);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        const msg = e?.message ?? "Unbekannt";
        const status = msg === "RATE_LIMIT" ? 429 : msg === "PAYMENT_REQUIRED" ? 402 : 500;
        const text = msg === "RATE_LIMIT" ? "Zu viele Anfragen – bitte kurz warten." :
                     msg === "PAYMENT_REQUIRED" ? "AI-Guthaben aufgebraucht." : msg;
        return new Response(JSON.stringify({ error: text }),
          { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }


    // Spezial-Pfad: Anamnese-Extraktion (VT-Bögen 1–3)
    if (task === "anamnese-extract") {
      try {
        const result = await runAnamneseExtraction(LOVABLE_API_KEY, payload ?? {}, patientPseudonym);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        const msg = e?.message ?? "Unbekannt";
        const status = msg === "RATE_LIMIT" ? 429 : msg === "PAYMENT_REQUIRED" ? 402 : 500;
        const text = msg === "RATE_LIMIT" ? "Zu viele Anfragen – bitte kurz warten." :
                     msg === "PAYMENT_REQUIRED" ? "AI-Guthaben aufgebraucht." : msg;
        return new Response(JSON.stringify({ error: text }),
          { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }


    // Spezial-Pfad: Psychotherapeutischer Befund
    if (task === "befund-generate") {
      try {
        const result = await runBefundGeneration(LOVABLE_API_KEY, payload ?? {}, patientPseudonym);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        const msg = e?.message ?? "Unbekannt";
        const status = msg === "RATE_LIMIT" ? 429 : msg === "PAYMENT_REQUIRED" ? 402 : 500;
        const text = msg === "RATE_LIMIT" ? "Zu viele Anfragen – bitte kurz warten." :
                     msg === "PAYMENT_REQUIRED" ? "AI-Guthaben aufgebraucht." : msg;
        return new Response(JSON.stringify({ error: text }),
          { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }


    const reqBody = buildRequest(task, payload ?? {}, patientPseudonym);
    const model = MODEL;

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
