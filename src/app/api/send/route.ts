import { NextResponse } from "next/server";
import { isBrevoConfigured, sendViaBrevo } from "@/lib/brevo";
import type { BrevoSendPayload } from "@/lib/types";

export const runtime = "nodejs";

type Body = {
  subject?: string;
  htmlContent?: string;
  to?: { email: string; name?: string }[];
  listIds?: number[];
  /** Convenience: comma/space-separated emails → `to` */
  emails?: string;
};

function parseEmails(raw: string | undefined): { email: string }[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\s]+/)
    .map((e) => e.trim())
    .filter(Boolean)
    .map((email) => ({ email }));
}

export async function GET() {
  return NextResponse.json({
    configured: isBrevoConfigured(),
    defaultListId: process.env.BREVO_LIST_ID
      ? Number(process.env.BREVO_LIST_ID)
      : null,
    sender: process.env.BREVO_SENDER_EMAIL || null,
  });
}

export async function POST(request: Request) {
  if (!isBrevoConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Brevo not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL on the server.",
      },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const subject = body.subject?.trim();
  const htmlContent = body.htmlContent;
  if (!subject || !htmlContent) {
    return NextResponse.json(
      { ok: false, message: "subject and htmlContent are required." },
      { status: 400 },
    );
  }

  const to = body.to?.length ? body.to : parseEmails(body.emails);
  const listIds =
    body.listIds?.filter((id) => Number.isFinite(id)) ??
    (process.env.BREVO_LIST_ID && !to.length
      ? [Number(process.env.BREVO_LIST_ID)]
      : undefined);

  if (!to.length && !listIds?.length) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Provide emails (test send) or listIds / BREVO_LIST_ID (campaign).",
      },
      { status: 400 },
    );
  }

  const payload: BrevoSendPayload = {
    subject,
    htmlContent,
    to: to.length ? to : undefined,
    listIds: !to.length ? listIds : undefined,
  };

  const result = await sendViaBrevo(payload);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
