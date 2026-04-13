import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { requireIdToken } from "@/lib/server/authz";
import { IncomingSignalSchema } from "@/lib/models/signal";
import { nowIso } from "@/lib/server/time";
import { sendWhatsappNotification } from "@/lib/server/whatsapp/whatsappService";

export async function POST(req: Request) {
  try {
    await requireIdToken();

    const body = await req.json().catch(() => null);

    const { sendNow, ...rest } = (body || {}) as any;
    const parsed = IncomingSignalSchema.safeParse(rest);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const incoming = parsed.data;

    const createdAt = nowIso();
    const updatedAt = createdAt;

    const docRef = await adminDb.collection("signals").add({
      ...incoming,
      source: incoming.source || "manual",
      whatsappStatus: sendNow ? "pending" : "pending",
      createdAt,
      updatedAt,
    });

    if (!sendNow) {
      return NextResponse.json({ ok: true, id: docRef.id, whatsappStatus: "pending" });
    }

    const sendResult = await sendWhatsappNotification(incoming);

    if (sendResult.ok) {
      const status = sendResult.mode === "mock" ? "mock_success" : "success";
      await docRef.update({
        whatsappStatus: status,
        whatsappMessageId: sendResult.messageId,
        errorMessage: "",
        updatedAt: nowIso(),
      });
      return NextResponse.json({ ok: true, id: docRef.id, whatsappStatus: status });
    }

    await docRef.update({
      whatsappStatus: "failed",
      errorMessage: sendResult.errorMessage,
      updatedAt: nowIso(),
    });

    return NextResponse.json(
      { ok: false, id: docRef.id, error: sendResult.errorMessage },
      { status: 502 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 401 }
    );
  }
}
