import type { BrevoSendPayload } from "./types";

/**
 * Brevo wiring comes later. This stub keeps the send path ready
 * without requiring API keys during local design work.
 */
export async function sendViaBrevo(_payload: BrevoSendPayload): Promise<{
  ok: boolean;
  message: string;
}> {
  return {
    ok: false,
    message:
      "Brevo API not connected yet. Add BREVO_API_KEY and wire src/lib/brevo.ts.",
  };
}

export function isBrevoConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY);
}
