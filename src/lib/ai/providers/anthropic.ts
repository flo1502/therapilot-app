import type { AiProvider, AiProviderRequest, AiProviderResponse } from "./types";

// TODO: call the Anthropic API (likely via a Supabase Edge Function so the
// API key never reaches the client). Only ever send data-class "internal" /
// "public" content here — see src/config/data-classes.ts.

export const anthropicProvider: AiProvider = {
  name: "anthropic",
  async complete(_request: AiProviderRequest): Promise<AiProviderResponse> {
    throw new Error("anthropicProvider.complete: not implemented");
  },
};
