// AI-Provider Abstraktion.
// Phase 1: Lovable AI Gateway via Edge Function.
// Phase 2 (später): Lokales Ollama – gleiche Schnittstelle.

import { supabase } from "@/integrations/supabase/client";
import { pseudonymize } from "@/lib/pseudonymize";

export type AiTask = "structure-session" | "personalize-slides" | "session-prep" | "suggest-slides";

export interface SuggestedSlideRef {
  source: "template" | "deck";
  sourceId: string;       // templateId oder deckId
  slideIndex: number;     // Index innerhalb des Quell-Decks/Templates
  reason: string;         // kurze Begründung warum diese Folie passt
}

export interface SuggestedSlides {
  suggestions: SuggestedSlideRef[];
}

export interface AiRequest {
  task: AiTask;
  payload: Record<string, any>;
  patientPseudonym?: string;
}

export interface StructuredSession {
  subjektiv: string;
  objektiv: string;
  assessment: string;
  plan: string;
  hausaufgabe?: string;
  naechsterFokus?: string;
}

export interface GeneratedDeck {
  title: string;
  slides: { title: string; bullets: string[]; notes?: string }[];
}

function deepPseudonymize<T>(obj: T, pseudo?: string): T {
  if (typeof obj === "string") return pseudonymize(obj, pseudo) as any;
  if (Array.isArray(obj)) return obj.map(o => deepPseudonymize(o, pseudo)) as any;
  if (obj && typeof obj === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(obj as any)) out[k] = deepPseudonymize(v, pseudo);
    return out;
  }
  return obj;
}

export async function callAi<T = any>(req: AiRequest): Promise<T> {
  const safePayload = deepPseudonymize(req.payload, req.patientPseudonym);
  const { data, error } = await supabase.functions.invoke("ai-assist", {
    body: { task: req.task, payload: safePayload, patientPseudonym: req.patientPseudonym },
  });
  if (error) throw new Error(error.message || "AI-Fehler");
  if (data?.error) throw new Error(data.error);
  return data as T;
}

// Stub für Phase 2 – nicht aktiv.
export const ollamaProvider = {
  async call(_req: AiRequest) {
    throw new Error("Ollama-Provider noch nicht aktiv. Aktivierung in Phase 2 (Electron-Build).");
  },
};
