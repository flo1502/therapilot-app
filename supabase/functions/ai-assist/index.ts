// AI-Assist Edge Function für TheraPilot
// WICHTIG: Hier kommen NUR pseudonymisierte Daten an. Trotzdem keine Persistenz.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

// Übersetzt die bestehenden OpenAI-Tool-Schemas (type:"function", function:{...})
// auf Anthropics Messages-API-Form und ruft diese direkt auf — ersetzt den
// vormaligen Lovable-AI-Gateway-Call. Rückgabewert bleibt unverändert das
// geparste Tool-Input-Objekt, damit alle Aufrufer (runKVDocumentation etc.)
// unverändert bleiben können.
async function callAnthropic(apiKey: string, model: string, body: any): Promise<any> {
  const systemMsg = (body.messages ?? []).find((m: any) => m.role === "system")?.content ?? "";
  const messages = (body.messages ?? [])
    .filter((m: any) => m.role !== "system")
    .map((m: any) => ({ role: m.role, content: m.content }));

  const tools = (body.tools ?? []).map((t: any) => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: t.function.parameters,
  }));
  const forcedName = body.tool_choice?.function?.name;

  let lastStatus = 0;
  let lastBody = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 8192,
        system: systemMsg,
        messages,
        tools,
        ...(forcedName ? { tool_choice: { type: "tool", name: forcedName } } : {}),
      }),
    });
    if (resp.status === 429) throw new Error("RATE_LIMIT");
    if (resp.ok) {
      const data = await resp.json();
      const toolUse = (data.content ?? []).find((b: any) => b.type === "tool_use");
      if (!toolUse?.input) throw new Error("Keine strukturierte Antwort.");
      return toolUse.input;
    }
    lastStatus = resp.status;
    lastBody = await resp.text();
    console.error(`Anthropic API Fehler (model=${model}, attempt=${attempt + 1}):`, resp.status, lastBody);
    if (resp.status >= 500 || resp.status === 529) {
      await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
      continue;
    }
    break;
  }
  throw new Error(`Anthropic API Fehler (${lastStatus}): ${lastBody.slice(0, 300)}`);
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

  const extract = await callAnthropic(apiKey, "claude-sonnet-5", {
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

  const documentation = await callAnthropic(apiKey, "claude-opus-5", {
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

  return await callAnthropic(apiKey, "claude-sonnet-5", {
    messages: [
      { role: "system", content: system },
      { role: "user", content: `Transkript:\n${transcript}` },
    ],
    tools: [SCHEMA_TOOL],
    tool_choice: { type: "function", function: { name: "return_schema_analysis" } },
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

  return await callAnthropic(apiKey, "claude-sonnet-5", {
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

// ============== Vorbereitungs-Briefing ("Aktueller Stand", letzte 3 Sitzungen) ==============
// Prompt-Referenz: prompts/briefing.v1.md. Eingabe sind fertige KV-Verlaufs-
// dokumentationen, keine Rohtranskripte. Internes Arbeitsmittel, geht nicht an
// Kassen/Gutachter:innen – Diagnose-/Spekulationsverbot gilt trotzdem.

const BRIEFING_TOOL = {
  type: "function",
  function: {
    name: "return_briefing",
    description: "Liefert das Vorbereitungs-Briefing aus den letzten bis zu 3 dokumentierten Sitzungen.",
    parameters: {
      type: "object",
      properties: {
        stand: { type: "string", description: "Wo die Behandlung inhaltlich steht, 2-4 Sätze." },
        veraenderung: { type: "string", description: "Dokumentierte Unterschiede über die Sitzungen hinweg, 1-3 Sätze. Kein Werturteil." },
        risiko_status: { type: "string", description: "PFLICHT, nie leer. Suizidalität über alle herangezogenen Sitzungen, 1-2 Sätze." },
        offene_vereinbarungen: { type: "array", items: { type: "string" }, description: "Max. 4 Einträge, je max. 12 Wörter." },
        offene_themen: { type: "array", items: { type: "string" }, description: "Max. 3 Einträge, je max. 12 Wörter." },
        administratives: { type: "string", description: "1 Satz oder leerer String." },
        hinweis_datenlage: { type: "string", description: "Nur bei eingeschränkter Datengrundlage, sonst leerer String." },
      },
      required: [
        "stand", "veraenderung", "risiko_status", "offene_vereinbarungen",
        "offene_themen", "administratives", "hinweis_datenlage",
      ],
      additionalProperties: false,
    },
  },
};

async function runBriefingGeneration(apiKey: string, payload: any, pseudo?: string) {
  const docs: any[] = Array.isArray(payload?.sessions) ? payload.sessions : [];
  if (docs.length === 0) {
    throw new Error("Keine dokumentierten Sitzungen vorhanden.");
  }

  const system =
    "Du bist ein klinischer Dokumentations-Assistent für approbierte Psychotherapeut:innen in Deutschland. " +
    "Du erstellst ein internes Vorbereitungs-Briefing, das die Therapeut:in unmittelbar vor einer Sitzung in " +
    "ein bis zwei Minuten liest. Deine Eingabe sind BEREITS ERSTELLTE KV-Verlaufsdokumentationen der letzten " +
    "bis zu drei Sitzungen – keine Rohtranskripte. Du extrahierst nichts neu, du verdichtest nur.\n\n" +
    `Patient:in (pseudonymisiert): '${pseudo ?? "[PATIENT:IN]"}'. Verwende NIE einen Klarnamen.\n\n` +
    "SITZUNGSBEZUG: Die Sitzungen sind dir positionell benannt ('jüngste', 'mittlere', 'älteste'), nicht mit " +
    "Datum – echte Sitzungsdaten verlassen das Gerät nicht. Beziehe dich ausschließlich auf diese " +
    "Positionsbezeichnungen. Erfinde keine Datumsangaben.\n\n" +
    "UMFANG: insgesamt ca. 150-200 Wörter. Keine Füllfloskeln.\n\n" +
    "KEINE EMPFEHLUNGEN: Du gibst keine Behandlungsempfehlungen und schlägst keine Interventionen für die " +
    "kommende Sitzung vor. offene_themen ist rein beschreibend – was laut Doku offen liegt, ohne Priorisierung " +
    "und ohne Vorschlag, womit begonnen werden sollte.\n\n" +
    "KEINE DIAGNOSE: Du stellst keine Diagnose und deutest keine an, auch nicht abgeschwächt ('wirkt', " +
    "'vermutlich'). Du bewertest nicht, ob die Therapie gut oder schlecht läuft.\n\n" +
    "ABWESENHEIT IST KEINE BESSERUNG (kritisch): Ein Symptom, das in einer früheren der herangezogenen " +
    "Sitzungen dokumentiert ist und in der jüngsten fehlt, kann zurückgegangen sein ODER schlicht nicht " +
    "angesprochen worden sein. Aus den Dokumenten ist das nicht unterscheidbar. Formulierungen wie 'hat sich " +
    "gebessert', 'rückläufig', 'nicht mehr vorhanden' oder 'stabilisiert' sind UNZULÄSSIG, wenn ihnen nur ein " +
    "Fehlen zugrunde liegt. Zulässig ist ausschließlich der Befund an den Dokumenten: 'in der jüngsten Sitzung " +
    "nicht mehr erwähnt'.\n\n" +
    "RISIKO_STATUS (Pflichtfeld, nie leer): Aussage zur Suizidalität über alle herangezogenen Sitzungen. Steht " +
    "in keinem Quelldokument etwas dazu: 'Suizidalität ist in den herangezogenen Sitzungen nicht dokumentiert.' " +
    "– NICHT 'keine Suizidalität', denn nicht dokumentiert und verneint sind verschieden. War Suizidalität in " +
    "EINER der Sitzungen dokumentiert und taucht in späteren nicht mehr auf, MUSS sie trotzdem genannt werden, " +
    "mit Angabe der Sitzungsposition und mit dem jüngsten Stand daneben – niemals als Entwarnung weglassen.\n\n" +
    "ZAHLEN: Stundenkontingent, Fristen und Sitzungsnummern nur wörtlich übernehmen, niemals schätzen oder " +
    "hochrechnen. Steht nichts da, bleibt administratives leer.\n\n" +
    "STILREGELN: klinisch-neutral, knappe Fließtext-Sätze, indirekte Wiedergabe, keine direkte Rede, keine " +
    "wertenden Adjektive ('erfreulich', 'motiviert', 'schwierig'). Wird unter Zeitdruck gelesen – jeder Satz " +
    "muss beim ersten Lesen verständlich sein.";

  const userContent =
    `KV-VERLAUFSDOKUMENTATIONEN (neueste zuerst, ${docs.length} Stück):\n` +
    `${JSON.stringify(docs, null, 0).slice(0, 16000)}\n\n` +
    "Erstelle jetzt das Vorbereitungs-Briefing.";

  return await callAnthropic(apiKey, "claude-opus-5", {
    messages: [
      { role: "system", content: system },
      { role: "user", content: userContent },
    ],
    tools: [BRIEFING_TOOL],
    tool_choice: { type: "function", function: { name: "return_briefing" } },
  });
}

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

  return await callAnthropic(apiKey, "claude-opus-5", {
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

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY fehlt");

    // Spezial-Pfad: KV-Verlaufsdokumentation (zwei sequentielle LLM-Calls)
    if (task === "kv-documentation") {
      try {
        const result = await runKVDocumentation(ANTHROPIC_API_KEY, payload ?? {}, patientPseudonym);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        const msg = e?.message ?? "Unbekannt";
        if (msg === "RATE_LIMIT") {
          return new Response(JSON.stringify({ error: "Zu viele Anfragen – bitte kurz warten." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        return new Response(JSON.stringify({ error: msg }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Spezial-Pfad: CBT-Schema-Analyse
    if (task === "cbt-schema-analysis") {
      try {
        const result = await runSchemaAnalysis(ANTHROPIC_API_KEY, payload ?? {}, patientPseudonym);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        const msg = e?.message ?? "Unbekannt";
        if (msg === "RATE_LIMIT") {
          return new Response(JSON.stringify({ error: "Zu viele Anfragen – bitte kurz warten." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        return new Response(JSON.stringify({ error: msg }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }


    // Spezial-Pfad: Depression KPI Extraction
    // Spezial-Pfad: Anamnese-Extraktion (VT-Bögen 1–3)
    if (task === "anamnese-extract") {
      try {
        const result = await runAnamneseExtraction(ANTHROPIC_API_KEY, payload ?? {}, patientPseudonym);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        const msg = e?.message ?? "Unbekannt";
        const status = msg === "RATE_LIMIT" ? 429 : 500;
        const text = msg === "RATE_LIMIT" ? "Zu viele Anfragen – bitte kurz warten." : msg;
        return new Response(JSON.stringify({ error: text }),
          { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }


    // Spezial-Pfad: Vorbereitungs-Briefing (letzte 3 dokumentierte Sitzungen)
    if (task === "briefing-generate") {
      try {
        const result = await runBriefingGeneration(ANTHROPIC_API_KEY, payload ?? {}, patientPseudonym);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        const msg = e?.message ?? "Unbekannt";
        const status = msg === "RATE_LIMIT" ? 429 : 500;
        const text = msg === "RATE_LIMIT" ? "Zu viele Anfragen – bitte kurz warten." : msg;
        return new Response(JSON.stringify({ error: text }),
          { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }


    // Spezial-Pfad: Psychotherapeutischer Befund
    if (task === "befund-generate") {
      try {
        const result = await runBefundGeneration(ANTHROPIC_API_KEY, payload ?? {}, patientPseudonym);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        const msg = e?.message ?? "Unbekannt";
        const status = msg === "RATE_LIMIT" ? 429 : 500;
        const text = msg === "RATE_LIMIT" ? "Zu viele Anfragen – bitte kurz warten." : msg;
        return new Response(JSON.stringify({ error: text }),
          { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }


    // Jede unterstützte Task hat oben einen eigenen Pfad. Alles andere ist ein
    // Aufruf-Fehler und wird als solcher gemeldet, statt in einen generischen
    // Prompt zu laufen.
    return new Response(JSON.stringify({ error: `Unbekannte Task: ${task}` }), {
      status: 400,
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
