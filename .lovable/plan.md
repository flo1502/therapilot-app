
# CBT-Schema-Analyse für Sitzungstranskripte

Ergänzt TheraPilot um eine Schema-Erkennung, die aus dem bestehenden Transkript (KV-Verlauf-Tab) dysfunktionale kognitive Schemata extrahiert und als WhatsApp-artiger Benachrichtigungs-Feed darstellt.

## 1. Datenmodell (`src/lib/db.ts`)

Dexie auf Version 4 anheben. Neue Felder auf `SessionEntry`:
- `schemaAnalysis?: SchemaAnalysisResult`
- `schemaAnalyzedAt?: number`

## 2. Typen (`src/lib/schemaTypes.ts`, neu)

```ts
export const SCHEMA_CATEGORIES = [
  "Defekt / Scham",
  "Versagen / Unzulänglichkeit",
  "Gefahr / Unsicherheit",
  "Verlassenwerden",
  "Misstrauen / Bewertung durch andere",
  "Kontrollverlust",
] as const;

export type SchemaCategory = typeof SCHEMA_CATEGORIES[number];

export interface SchemaExample {
  trigger_sentence: string;   // exaktes Zitat
  context: string;            // kurzer Kontext
  timestamp?: string;         // falls im Transkript vorhanden
}

export interface SchemaGroup {
  type: SchemaCategory;
  count: number;
  chat_preview: string;       // z.B. "💬 3 neue Hinweise auf Selbstwert-Schema erkannt"
  examples: SchemaExample[];
}

export interface SchemaAnalysisResult {
  session_id: string;
  schema_summary_chat: SchemaGroup[];
  generatedAt: number;
}
```

## 3. Edge Function (`supabase/functions/ai-assist/index.ts`)

Neuer Task `cbt-schema-analysis`:
- Modell: `google/gemini-2.5-pro` (gut bei nuancierter Klassifikation, großem Kontext)
- Tool-Calling für strukturiertes JSON (keine freie JSON-Anweisung)
- Strenger System-Prompt mit den 6 Kategorien als Enum, Evidence-Rule (nur exakte Patient:innenzitate oder vom Patienten bestätigte Therapeut-Paraphrasen), Anti-Keyword-Match-Regel, Counting-Regel, leere Ergebnisse wenn keine Evidenz
- Input: `{ transcript, sessionId }`
- Output: `SchemaAnalysisResult`
- Pseudonymisierung läuft bereits über `pseudonymize` vor dem Call

Tool-Schema (Auszug):
```ts
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
          chat_preview: { type: "string" },
          examples: {
            type: "array",
            items: {
              type: "object",
              properties: {
                trigger_sentence: { type: "string" },
                context: { type: "string" },
                timestamp: { type: "string" }
              },
              required: ["trigger_sentence", "context"]
            }
          }
        },
        required: ["type", "count", "chat_preview", "examples"]
      }
    }
  },
  required: ["schema_summary_chat"]
}
```

## 4. AI-Provider (`src/lib/ai/provider.ts`)

`AiTask` um `"cbt-schema-analysis"` erweitern; kein UI-spezifisches Verhalten, nur Pass-Through.

## 5. UI-Komponente (`src/components/SchemaChatFeed.tsx`, neu)

WhatsApp-Style Feed mit:
- Header: „💬 CBT Schema Alert" + „Analysieren"-Button + Re-Run + Stand-Zeitstempel
- Pro Schema eine **Chat-Bubble** (Card mit abgerundeten Ecken, farbcodierter Punkt 🔴🟠🟡 je nach Count, links-bündig wie eingehende Nachricht):
  - Titel: `Kategorie ↑ count`
  - Top 2 Zitate als Vorschau
  - „Tap for details" → expandiert (Accordion) alle `examples` mit `trigger_sentence`, `context`, optional Timestamp
- Leerer Zustand: „Keine schemarelevanten Aussagen erkannt."
- Keine Bearbeitung – read-only Analyse

Farbcode:
- count ≥ 3 → destructive
- count = 2 → warning (orange)
- count = 1 → muted

## 6. Integration in `SessionEdit.tsx`

Neuer Tab **„CBT-Schemata"** neben SOAP / KV-Verlauf / Folien:
- nutzt `s.transcript` (oder Fallback `s.rawNotes`)
- Wenn kein Transkript: Hinweis „Bitte Transkript im KV-Verlauf-Tab einfügen."
- Button „Schemata analysieren" → ruft Edge Function → speichert `schemaAnalysis` in Dexie
- Re-Analyse möglich

## 7. Stil & Design

- Tailwind semantische Tokens, keine Custom-Farben
- Chat-Bubbles: `rounded-2xl rounded-tl-sm bg-muted/40` mit subtilem Schatten
- Monospace nicht nötig; bestehende Schrift
- Mobil-first (User-Viewport ist klein)

## 8. Sicherheit / Datenschutz

- Transkript wird bereits pseudonymisiert vor AI-Call (bestehende `deepPseudonymize`)
- Ergebnis wird **nur lokal in Dexie** gespeichert, nicht serverseitig

## 9. Out of Scope (jetzt nicht)

- Persistente Verlaufsanalyse über mehrere Sessions
- Export als PDF
- Editierbarkeit der Treffer

## Offene Fragen

1. Soll die Analyse **automatisch** nach erfolgreicher KV-Verlaufserzeugung mitlaufen, oder nur **manuell per Button** im neuen Tab? (Empfehlung: manuell – Token-Kosten + Therapeut entscheidet.)
2. Soll der Feed zusätzlich auf einer **Patient-Detail-Seite** kumuliert über alle Sessions angezeigt werden, oder reicht für jetzt **pro Session**? (Empfehlung: pro Session jetzt, Aggregation später.)
