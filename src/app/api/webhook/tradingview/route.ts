import { NextResponse } from "next/server";
import { z } from "zod";
import { IncomingSignalSchema } from "@/lib/models/signal";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { nowIso } from "@/lib/server/time";
import { sendWhatsappNotification } from "@/lib/server/whatsapp/whatsappService";

const TradingViewPayloadSchema = IncomingSignalSchema.extend({
  secret: z.string().min(1),
});

export async function POST(req: Request) {
  const expected = process.env.WEBHOOK_SECRET;

  if (!expected) {
    return NextResponse.json(
      { error: "Server not configured: WEBHOOK_SECRET env var is missing." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = TradingViewPayloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { secret, ...incoming } = parsed.data;

  if (secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const createdAt = nowIso();
  const updatedAt = createdAt;

  const signalRef = await adminDb.collection("signals").add({
    ...incoming,
    source: "tradingview",
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
