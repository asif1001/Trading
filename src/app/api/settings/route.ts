import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { requireIdToken } from "@/lib/server/authz";
import { SettingsUpdateSchema } from "@/lib/models/settings";
import { nowIso } from "@/lib/server/time";

function redactSecrets(secrets: any) {
  return {
    twilioSidSet: !!secrets?.twilioSid,
    twilioAuthTokenSet: !!secrets?.twilioAuthToken,
    twilioFromNumberSet: !!secrets?.twilioFromNumber,
    metaAccessTokenSet: !!secrets?.metaAccessToken,
    metaPhoneNumberIdSet: !!secrets?.metaPhoneNumberId,
  };
}

export async function GET() {
  try {
    await requireIdToken();

    const ref = adminDb.collection("settings").doc("main");
    const snap = await ref.get();

    if (!snap.exists) {
      const createdAt = nowIso();
      const doc = {
        whatsappProvider: "mock",
        whatsappNumber: "",
        mockMode: true,
        webhookSecret: "change_me_please",
        createdAt,
        updatedAt: createdAt,
        secrets: {},
      };
      await ref.set(doc);

      return NextResponse.json({
        whatsappProvider: doc.whatsappProvider,
        whatsappNumber: doc.whatsappNumber,
        mockMode: doc.mockMode,
        webhookSecret: doc.webhookSecret,
        redaction: redactSecrets(doc.secrets),
      });
    }

    const data = snap.data() as any;

    return NextResponse.json({
      whatsappProvider: data.whatsappProvider,
      whatsappNumber: data.whatsappNumber,
      mockMode: !!data.mockMode,
      webhookSecret: data.webhookSecret,
      redaction: redactSecrets(data.secrets),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireIdToken();

    const body = await req.json().catch(() => null);
    const parsed = SettingsUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const update = parsed.data;

    const ref = adminDb.collection("settings").doc("main");
    const snap = await ref.get();
    const existing = snap.exists ? (snap.data() as any) : null;

    const createdAt = existing?.createdAt || nowIso();

    const secrets = {
      twilioSid: update.twilioSid || existing?.secrets?.twilioSid,
      twilioAuthToken: update.twilioAuthToken || existing?.secrets?.twilioAuthToken,
      twilioFromNumber: update.twilioFromNumber || existing?.secrets?.twilioFromNumber,
      metaAccessToken: update.metaAccessToken || existing?.secrets?.metaAccessToken,
      metaPhoneNumberId: update.metaPhoneNumberId || existing?.secrets?.metaPhoneNumberId,
    };

    const doc = {
      whatsappProvider: update.whatsappProvider,
      whatsappNumber: update.whatsappNumber,
      mockMode: update.mockMode,
      webhookSecret: update.webhookSecret,
      createdAt,
      updatedAt: nowIso(),
      secrets,
    };

    await ref.set(doc, { merge: true });

    return NextResponse.json({ ok: true, redaction: redactSecrets(secrets) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 401 }
    );
  }
}
