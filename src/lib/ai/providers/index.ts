import type { AiProvider } from "./types";
import { anthropicProvider } from "./anthropic";
import { localLlamaProvider } from "./local-llama";

export * from "./types";
export { embeddingProvider } from "./embeddings";

const registry: Record<string, AiProvider> = {
  [anthropicProvider.name]: anthropicProvider,
  [localLlamaProvider.name]: localLlamaProvider,
};

export function getProvider(name: string): AiProvider {
  const provider = registry[name];
  if (!provider) {
    throw new Error(`Unknown AI provider: ${name}`);
  }
  return provider;
}
