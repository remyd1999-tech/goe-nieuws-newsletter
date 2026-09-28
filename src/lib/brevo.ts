import type { BrevoSendPayload } from "./types";

const BREVO_SMTP = "https://api.brevo.com/v3/smtp/email";
const BREVO_CAMPAIGNS = "https://api.brevo.com/v3/emailCampaigns";

export function isBrevoConfigured(): boolean {
  return Boolean(
    process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL,
  );
}

function sender() {
  return {
    email: process.env.BREVO_SENDER_EMAIL as string,
    name: process.env.BREVO_SENDER_NAME || "Goe Nieuws",
  };
}

async function brevoFetch(
  url: string,
  init: RequestInit,
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const res = await fetch(url, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": process.env.BREVO_API_KEY as string,
      ...(init.headers || {}),
    },
  });
  let body: unknown = null;
  const text = await res.text();
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  return { ok: res.ok, status: res.status, body };
}

/**
 * Transactional send to explicit recipients.
 */
async function sendTransactional(payload: BrevoSendPayload): Promise<{
  ok: boolean;
  message: string;
  messageId?: string;
}> {
  if (!payload.to?.length) {
    return { ok: false, message: "No recipients (to) provided." };
  }

  const { ok, status, body } = await brevoFetch(BREVO_SMTP, {
    method: "POST",
    body: JSON.stringify({
      sender: sender(),
      to: payload.to,
      subject: payload.subject,
      htmlContent: payload.htmlContent,
    }),
  });

  if (!ok) {
    const msg =
      typeof body === "object" && body && "message" in body
        ? String((body as { message: string }).message)
        : `Brevo SMTP error ${status}`;
    return { ok: false, message: msg };
  }

  const messageId =
    typeof body === "object" && body && "messageId" in body
      ? String((body as { messageId: string }).messageId)
      : undefined;

  return {
    ok: true,
    message: `Sent to ${payload.to.map((t) => t.email).join(", ")}`,
    messageId,
  };
}

/**
 * Create an email campaign and send immediately to list(s).
 * https://developers.brevo.com/docs/send-a-transactional-email
 * Campaigns: POST /v3/emailCampaigns then POST …/sendNow
 */
async function sendToLists(payload: BrevoSendPayload): Promise<{
  ok: boolean;
  message: string;
  campaignId?: number;
}> {
  const listIds = payload.listIds?.filter((id) => Number.isFinite(id));
  if (!listIds?.length) {
    return { ok: false, message: "No listIds provided." };
  }

  const create = await brevoFetch(BREVO_CAMPAIGNS, {
    method: "POST",
    body: JSON.stringify({
      name: payload.subject.slice(0, 80),
      subject: payload.subject,
      sender: sender(),
      htmlContent: payload.htmlContent,
      recipients: { listIds },
    }),
  });

  if (!create.ok) {
    const msg =
      typeof create.body === "object" &&
      create.body &&
      "message" in create.body
        ? String((create.body as { message: string }).message)
        : `Brevo campaign create error ${create.status}`;
    return { ok: false, message: msg };
  }

  const campaignId =
    typeof create.body === "object" &&
    create.body &&
    "id" in create.body
      ? Number((create.body as { id: number }).id)
      : NaN;

  if (!Number.isFinite(campaignId)) {
    return { ok: false, message: "Campaign created but no id returned." };
  }

  const send = await brevoFetch(`${BREVO_CAMPAIGNS}/${campaignId}/sendNow`, {
    method: "POST",
    body: JSON.stringify({}),
  });

  if (!send.ok) {
    const msg =
      typeof send.body === "object" && send.body && "message" in send.body
        ? String((send.body as { message: string }).message)
        : `Brevo campaign send error ${send.status}`;
    return {
      ok: false,
      message: `${msg} (campaign #${campaignId} was created)`,
      campaignId,
    };
  }

  return {
    ok: true,
    message: `Campaign #${campaignId} sent to list(s) ${listIds.join(", ")}`,
    campaignId,
  };
}

export async function sendViaBrevo(payload: BrevoSendPayload): Promise<{
  ok: boolean;
  message: string;
  messageId?: string;
  campaignId?: number;
}> {
  if (!isBrevoConfigured()) {
    return {
      ok: false,
      message:
        "Brevo not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL.",
    };
  }

  if (payload.listIds?.length) {
    return sendToLists(payload);
  }

  return sendTransactional(payload);
}
