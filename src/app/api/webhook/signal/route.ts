import { NextResponse } from "next/server";
import { IncomingSignalSchema } from "@/lib/models/signal";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { nowIso } from "@/lib/server/time";
import { sendWhatsappNotification } from "@/lib/server/whatsapp/whatsappService";

export async function POST(req: Request) {
  const secret = req.headers.get("x-webhook-secret") || "";
  const expected = process.env.WEBHOOK_SECRET;

  if (!expected) {
    return NextResponse.json(
      { error: "Server not configured: WEBHOOK_SECRET env var is missing." },
      { status: 500 }
    );
  }

  if (secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = IncomingSignalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const incoming = parsed.data;

  const createdAt = nowIso();
  const updatedAt = createdAt;

  const signalRef = await adminDb.collection("signals").add({
    ...incoming,
    source: incoming.source || "webhook",
    whatsappStatus: "pending",
    createdAt,
    updatedAt,
  });

  const sendResult = await sendWhatsappNotification(incoming);

  if (sendResult.ok) {
    await signalRef.update({
      whatsappStatus: sendResult.mode === "mock" ? "mock_success" : "success",
      whatsappMessageId: sendResult.messageId,
      errorMessage: "",
      updatedAt: nowIso(),
    });

    return NextResponse.json({ ok: true, id: signalRef.id });
  }

  await signalRef.update({
    whatsappStatus: "failed",
    errorMessage: sendResult.errorMessage,
    updatedAt: nowIso(),
  });

  return NextResponse.json(
    { ok: false, id: signalRef.id, error: sendResult.errorMessage },
    { status: 502 }
  );
}
