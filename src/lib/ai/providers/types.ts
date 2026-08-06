// Shared interface every AI provider (Anthropic, local Llama, ...) implements.
// lib/ai/tasks.ts routes an AiTask to one of these by name via index.ts.

export interface AiProviderRequest {
  task: string;
  prompt: string;
  input: Record<string, unknown>;
}

export interface AiProviderResponse {
  output: string;
  raw?: unknown;
}

export interface AiProvider {
  name: string;
  complete(request: AiProviderRequest): Promise<AiProviderResponse>;
}

export interface EmbeddingProvider {
  name: string;
  embed(texts: string[]): Promise<number[][]>;
}
