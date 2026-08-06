// Data classification: patient | internal | public.
// Used to tag fields/tables so guardrails and prompt-loaders can enforce
// what may leave the device (patient data) vs. what may go to third-party APIs.

export type DataClass = "patient" | "internal" | "public";
