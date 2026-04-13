import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { requireIdToken } from "@/lib/server/authz";
import { sendWhatsappNotification } from "@/lib/server/whatsapp/whatsappService";
import { nowIso } from "@/lib/server/time";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireIdToken();

    const { id } = await params;
    const ref = adminDb.collection("signals").doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Signal not found" }, { status: 404 });
    }

    const data = snap.data() as any;

    const sendResult = await sendWhatsappNotification({
      symbol: data.symbol,
      signal: data.signal,
      timeframe: data.timeframe,
      price: data.price,
      timestamp: data.timestamp,
      note: data.note,
      source: data.source,
    });

    if (sendResult.ok) {
      const status = sendResult.mode === "mock" ? "mock_success" : "success";
      await ref.update({
        whatsappStatus: status,
        whatsappMessageId: sendResult.messageId,
        errorMessage: "",
        updatedAt: nowIso(),
      });
      return NextResponse.json({ ok: true, whatsappStatus: status, errorMessage: "" });
    }

    await ref.update({
      whatsappStatus: "failed",
      errorMessage: sendResult.errorMessage,
      updatedAt: nowIso(),
    });

    return NextResponse.json(
      { ok: false, whatsappStatus: "failed", errorMessage: sendResult.errorMessage },
      { status: 502 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 401 }
    );
  }
}
