// n8n Webhook
// WICHTIG: Dies muss die Produktions-/Test-Webhook-URL sein (endet auf /webhook/<id>
// bzw. /webhook-test/<id>), nicht der Editor-Link (/workflow/...).
export const N8N_WEBHOOK_URL =
  "https://fsv5.app.n8n.cloud/webhook/zScWbskPg0wtgVXP";

export type N8nSessionPayload = {
  event: string;
  sentAt: string;
  sessions: {
    id: string;
    patientId: string;
    date: number;
    durationMin: number;
    format?: string;
    transcript?: string;
  }[];
};

export async function postSessionsToN8n(payload: N8nSessionPayload) {
  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn("n8n webhook responded with", res.status);
      return null;
    }
    return await res.text();
  } catch (e) {
    console.warn("n8n webhook call failed", e);
    return null;
  }
}
