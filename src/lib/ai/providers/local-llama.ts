import type { AiProvider, AiProviderRequest, AiProviderResponse } from "./types";

// Talks to services/local-llm (or any OpenAI-compatible endpoint, e.g. Ollama)
// via the /chat/completions API. This is the provider allowed to see
// data-class "patient" content, since inference stays on-device.

const DEFAULT_BASE_URL = "http://localhost:11434/v1";
const DEFAULT_MODEL = "psyco";

const BASE_URL = (
  import.meta.env.VITE_LOCAL_LLM_URL ?? DEFAULT_BASE_URL
).replace(/\/+$/, "");
const MODEL = import.meta.env.VITE_LOCAL_LLM_MODEL ?? DEFAULT_MODEL;

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

export const localLlamaProvider: AiProvider = {
  name: "local-llama",
  async complete(request: AiProviderRequest): Promise<AiProviderResponse> {
    let response: Response;
    try {
      response = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          temperature: 0.2,
          messages: [
            { role: "system", content: request.prompt },
            { role: "user", content: JSON.stringify(request.input) },
          ],
        }),
      });
    } catch (error) {
      throw new Error(
        `localLlamaProvider.complete: failed to reach ${BASE_URL} (${
          error instanceof Error ? error.message : String(error)
        })`,
      );
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `localLlamaProvider.complete: ${response.status} ${response.statusText} ${body}`.trim(),
      );
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const output = data.choices?.[0]?.message?.content;
    if (!output) {
      throw new Error(
        "localLlamaProvider.complete: response contained no message content",
      );
    }

    return { output, raw: data };
  },
};
