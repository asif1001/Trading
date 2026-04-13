"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useRequireAuth } from "@/lib/auth/requireAuth";

type SettingsForm = {
  whatsappProvider: "mock" | "twilio" | "meta";
  whatsappNumber: string;
  mockMode: boolean;
  webhookSecret: string;
  twilioSid: string;
  twilioAuthToken: string;
  twilioFromNumber: string;
  metaAccessToken: string;
  metaPhoneNumberId: string;
};

type Redaction = {
  twilioSidSet: boolean;
  twilioAuthTokenSet: boolean;
  twilioFromNumberSet: boolean;
  metaAccessTokenSet: boolean;
  metaPhoneNumberIdSet: boolean;
};

export default function SettingsPage() {
  const { user, loading } = useRequireAuth();

  const [form, setForm] = useState<SettingsForm>({
    whatsappProvider: "mock",
    whatsappNumber: "",
    mockMode: true,
    webhookSecret: "",
    twilioSid: "",
    twilioAuthToken: "",
    twilioFromNumber: "",
    metaAccessToken: "",
    metaPhoneNumberId: "",
  });

  const [redaction, setRedaction] = useState<Redaction>({
    twilioSidSet: false,
    twilioAuthTokenSet: false,
    twilioFromNumberSet: false,
    metaAccessTokenSet: false,
    metaPhoneNumberIdSet: false,
  });

  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);

  const disabled = useMemo(
    () => loading || !user || status === "saving",
    [loading, status, user]
  );

  function update<K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  useEffect(() => {
    if (loading || !user) return;

    const u = user;

    async function load() {
      setStatus("loading");
      setMessage(null);

      const idToken = await u.getIdToken();
      const res = await fetch("/api/settings", {
        headers: { authorization: `Bearer ${idToken}` },
      });

      const data = (await res.json()) as any;
      if (!res.ok) {
        setStatus("error");
        setMessage(data?.error || "Failed to load settings");
        return;
      }

      setForm((p) => ({
        ...p,
        whatsappProvider: data.whatsappProvider,
        whatsappNumber: data.whatsappNumber,
        mockMode: data.mockMode,
        webhookSecret: data.webhookSecret,
      }));

      setRedaction(data.redaction);
      setStatus("idle");
    }

    load();
  }, [loading, user]);

  async function save() {
    if (!user) return;
    setStatus("saving");
    setMessage(null);

    const u = user;
    const idToken = await u.getIdToken();

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(form),
      });

      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data?.error || "Failed to save");

      setRedaction(data.redaction);
      setStatus("success");
      setMessage("Settings saved.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Failed to save");
    }
  }

  return (
    <AppShell title="Settings">
      {message ? (
        <div
          className={`alert ${status === "error" ? "alertError" : "alertSuccess"}`}
          style={{ marginBottom: 12 }}
        >
          {message}
        </div>
      ) : null}

      <div className="card" style={{ maxWidth: 760 }}>
        <div className="cardTitle">WhatsApp settings</div>
        <div className="muted" style={{ marginTop: 6 }}>
          Secrets are stored server-side and never returned to the browser.
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <div>
            <div className="label">Provider</div>
            <select
              className="input"
              value={form.whatsappProvider}
              onChange={(e) => update("whatsappProvider", e.target.value as any)}
              disabled={disabled}
            >
              <option value="mock">Mock (recommended for MVP)</option>
              <option value="twilio">Twilio WhatsApp</option>
              <option value="meta">Meta WhatsApp Cloud API</option>
            </select>
          </div>

          <div>
            <div className="label">Destination WhatsApp number</div>
            <input
              className="input"
              value={form.whatsappNumber}
              onChange={(e) => update("whatsappNumber", e.target.value)}
              placeholder="+201234567890"
              disabled={disabled}
            />
          </div>

          <div>
            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={form.mockMode}
                onChange={(e) => update("mockMode", e.target.checked)}
                disabled={disabled}
              />
              <span>Mock mode</span>
            </label>
            <div className="muted" style={{ marginTop: 6 }}>
              If enabled, sends are simulated and stored as mock success.
            </div>
          </div>

          <div>
            <div className="label">Webhook secret</div>
            <input
              className="input"
              value={form.webhookSecret}
              onChange={(e) => update("webhookSecret", e.target.value)}
              placeholder="Set a random secret (min 8 chars)"
              disabled={disabled}
            />
            <div className="muted" style={{ marginTop: 6 }}>
              Incoming webhook must send header <b>x-webhook-secret</b>.
            </div>
          </div>

          <div className="card" style={{ padding: 12 }}>
            <div className="cardTitle">Twilio (optional)</div>
            <div className="muted" style={{ marginBottom: 10 }}>
              {redaction.twilioSidSet || redaction.twilioAuthTokenSet ? "Saved on server" : "Not set"}
            </div>

            <div className="row">
              <div>
                <div className="label">Twilio SID</div>
                <input
                  className="input"
                  value={form.twilioSid}
                  onChange={(e) => update("twilioSid", e.target.value)}
                  placeholder={redaction.twilioSidSet ? "********" : "AC..."}
                  disabled={disabled}
                />
              </div>
              <div>
                <div className="label">Twilio Auth Token</div>
                <input
                  className="input"
                  value={form.twilioAuthToken}
                  onChange={(e) => update("twilioAuthToken", e.target.value)}
                  placeholder={redaction.twilioAuthTokenSet ? "********" : "token"}
                  disabled={disabled}
                />
              </div>
              <div>
                <div className="label">Twilio WhatsApp from number</div>
                <input
                  className="input"
                  value={form.twilioFromNumber}
                  onChange={(e) => update("twilioFromNumber", e.target.value)}
                  placeholder={redaction.twilioFromNumberSet ? "********" : "whatsapp:+1..."}
                  disabled={disabled}
                />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 12 }}>
            <div className="cardTitle">Meta WhatsApp (optional)</div>
            <div className="muted" style={{ marginBottom: 10 }}>
              {redaction.metaAccessTokenSet || redaction.metaPhoneNumberIdSet ? "Saved on server" : "Not set"}
            </div>

            <div className="row">
              <div>
                <div className="label">Meta Access Token</div>
                <input
                  className="input"
                  value={form.metaAccessToken}
                  onChange={(e) => update("metaAccessToken", e.target.value)}
                  placeholder={redaction.metaAccessTokenSet ? "********" : "token"}
                  disabled={disabled}
                />
              </div>
              <div>
                <div className="label">Meta Phone Number ID</div>
                <input
                  className="input"
                  value={form.metaPhoneNumberId}
                  onChange={(e) => update("metaPhoneNumberId", e.target.value)}
                  placeholder={redaction.metaPhoneNumberIdSet ? "********" : "id"}
                  disabled={disabled}
                />
              </div>
            </div>
          </div>

          <div className="btnRow">
            <button className="btn btnPrimary" type="button" onClick={save} disabled={disabled}>
              {status === "saving" ? "Saving..." : "Save settings"}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
