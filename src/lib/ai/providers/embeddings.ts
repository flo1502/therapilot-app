import type { EmbeddingProvider } from "./types";

// TODO: embeddings for rag-query / services/local-llm/app/rag. Should stay
// local (data-class "patient" content is expected here), so this likely
// wraps local-llama.ts rather than a cloud embedding API.

export const embeddingProvider: EmbeddingProvider = {
  name: "local-embeddings",
  async embed(_texts: string[]): Promise<number[][]> {
    throw new Error("embeddingProvider.embed: not implemented");
  },
};
