import "server-only";

import { adminDb } from "@/lib/firebase/firebaseAdmin";
import type { IncomingSignal } from "@/lib/models/signal";

export type WhatsappSendResult =
  | { ok: true; provider: string; messageId: string; mode: "real" | "mock" }
  | { ok: false; provider: string; errorMessage: string; mode: "real" | "mock" };

type SettingsForSend = {
  whatsappProvider: "mock" | "twilio" | "meta";
  whatsappNumber: string;
  mockMode: boolean;
  secrets?: {
    twilioSid?: string;
    twilioAuthToken?: string;
    twilioFromNumber?: string;
    metaAccessToken?: string;
    metaPhoneNumberId?: string;
  };
};

async function loadSettings(): Promise<SettingsForSend | null> {
  const snap = await adminDb.collection("settings").doc("main").get();
  if (!snap.exists) return null;
  return snap.data() as SettingsForSend;
}

function formatMessage(signal: IncomingSignal) {
  const ts = new Date(signal.timestamp);
  const local = isNaN(ts.getTime()) ? signal.timestamp : ts.toLocaleString();

  return `${signal.signal} Signal\nSymbol: ${signal.symbol}\nTimeframe: ${signal.timeframe}\nPrice: ${signal.price}\nTime: ${local}`;
}

async function sendMock(): Promise<WhatsappSendResult> {
  return {
    ok: true,
    provider: "mock",
    messageId: `mock_${Date.now()}`,
    mode: "mock",
  };
}

async function sendTwilio(_to: string, _body: string): Promise<WhatsappSendResult> {
  return {
    ok: false,
    provider: "twilio",
    errorMessage:
      "Twilio provider is not implemented in this MVP. Enable mock mode or implement provider.",
    mode: "real",
  };
}

async function sendMeta(_to: string, _body: string): Promise<WhatsappSendResult> {
  return {
    ok: false,
    provider: "meta",
    errorMessage:
      "Meta WhatsApp Cloud API provider is not implemented in this MVP. Enable mock mode or implement provider.",
    mode: "real",
  };
}

export async function sendWhatsappNotification(signal: IncomingSignal) {
  const settings = await loadSettings();

  const provider: SettingsForSend["whatsappProvider"] = settings?.whatsappProvider || "mock";
  const mockMode = settings?.mockMode ?? true;
  const to = settings?.whatsappNumber || "";
  const body = formatMessage(signal);

  if (mockMode || provider === "mock") {
    return await sendMock();
  }

  if (!to) {
    return {
      ok: false,
      provider,
      errorMessage: "WhatsApp phone number is not configured.",
      mode: "real",
    } satisfies WhatsappSendResult;
  }

  if (provider === "twilio") return await sendTwilio(to, body);
  if (provider === "meta") return await sendMeta(to, body);

  return {
    ok: false,
    provider,
    errorMessage: "Unsupported WhatsApp provider.",
    mode: "real",
  } satisfies WhatsappSendResult;
}
