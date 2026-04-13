"use client";

import { useMemo, useState } from "react";
import { useRequireAuth } from "@/lib/auth/requireAuth";
import { AppShell } from "@/components/AppShell";

type FormState = {
  symbol: string;
  signal: "BUY" | "SELL";
  timeframe: string;
  price: string;
  note: string;
};

export default function ManualSignalPage() {
  const { user, loading } = useRequireAuth();

  const [form, setForm] = useState<FormState>({
    symbol: "GOLD",
    signal: "BUY",
    timeframe: "1h",
    price: "",
    note: "",
  });

  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);

  const disabled = useMemo(() => loading || !user || status === "sending", [loading, status, user]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function submit(mode: "send" | "save") {
    if (!user) return;

    setStatus("sending");
    setMessage(null);

    const idToken = await user.getIdToken();

    try {
      const res = await fetch("/api/signals/create", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          symbol: form.symbol,
          signal: form.signal,
          timeframe: form.timeframe,
          price: form.price,
          timestamp: new Date().toISOString(),
          note: form.note || undefined,
          source: "manual",
          sendNow: mode === "send",
        }),
      });

      const data = (await res.json()) as any;
      if (!res.ok) {
        throw new Error(data?.error || "Request failed");
      }

      setStatus("success");
      setMessage(
        mode === "send"
          ? "Signal saved and WhatsApp send attempted."
          : "Signal saved (no send)."
      );
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <AppShell title="Manual Test Signal">
      {message ? (
        <div
          className={`alert ${status === "error" ? "alertError" : "alertSuccess"}`}
          style={{ marginBottom: 12 }}
        >
          {message}
        </div>
      ) : null}

      <div className="card" style={{ maxWidth: 640 }}>
        <div className="cardTitle">Create a signal</div>

        <div className="row" style={{ marginTop: 12 }}>
          <div>
            <div className="label">Symbol</div>
            <input
              className="input"
              value={form.symbol}
              onChange={(e) => update("symbol", e.target.value.toUpperCase())}
              placeholder="GOLD"
            />
          </div>

          <div>
            <div className="label">Signal type</div>
            <select
              className="input"
              value={form.signal}
              onChange={(e) => update("signal", e.target.value as any)}
            >
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </div>

          <div>
            <div className="label">Timeframe</div>
            <input
              className="input"
              value={form.timeframe}
              onChange={(e) => update("timeframe", e.target.value)}
              placeholder="1h"
            />
          </div>

          <div>
            <div className="label">Price</div>
            <input
              className="input"
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
              placeholder="4746.89"
            />
          </div>

          <div>
            <div className="label">Optional note</div>
            <textarea
              className="input"
              value={form.note}
              onChange={(e) => update("note", e.target.value)}
              placeholder="Optional note"
              rows={3}
            />
          </div>

          <div className="btnRow">
            <button
              className="btn btnPrimary"
              disabled={disabled}
              onClick={() => submit("send")}
              type="button"
            >
              Send Test Signal
            </button>
            <button className="btn" disabled={disabled} onClick={() => submit("save")} type="button">
              Save Only
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
