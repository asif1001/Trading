"use client";

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SignalBadge, StatusBadge } from "@/components/Badge";
import { useRequireAuth } from "@/lib/auth/requireAuth";
import { firebaseDb } from "@/lib/firebase/firebaseClient";

type Row = {
  id: string;
  createdAt: string;
  timestamp: string;
  symbol: string;
  signal: string;
  timeframe: string;
  price: string;
  whatsappStatus: string;
  errorMessage?: string;
};

export default function SignalHistoryPage() {
  const { user, loading } = useRequireAuth();

  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "BUY" | "SELL">("ALL");
  const [pageSize, setPageSize] = useState(15);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const canLoad = useMemo(() => !loading && !!user, [loading, user]);

  async function load(reset: boolean) {
    setStatus("loading");
    setError(null);

    try {
      const base = collection(firebaseDb, "signals");

      const constraints: any[] = [orderBy("createdAt", "desc"), limit(pageSize)];

      if (typeFilter !== "ALL") {
        constraints.unshift(where("signal", "==", typeFilter));
      }

      if (!reset && cursor) {
        constraints.push(startAfter(cursor));
      }

      const q = query(base, ...constraints);
      const snap = await getDocs(q);

      const nextRows: Row[] = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .map((d: any) => ({
          id: d.id,
          createdAt: d.createdAt || "",
          timestamp: d.timestamp || "",
          symbol: d.symbol || "",
          signal: d.signal || "",
          timeframe: d.timeframe || "",
          price: d.price || "",
          whatsappStatus: d.whatsappStatus || "-",
          errorMessage: d.errorMessage,
        }));

      const filtered = search
        ? nextRows.filter((r) => {
            const s = search.toLowerCase();
            return (
              r.symbol.toLowerCase().includes(s) ||
              r.timeframe.toLowerCase().includes(s) ||
              r.signal.toLowerCase().includes(s)
            );
          })
        : nextRows;

      setRows((prev) => (reset ? filtered : [...prev, ...filtered]));
      setCursor(snap.docs.length ? snap.docs[snap.docs.length - 1]! : null);
      setHasMore(snap.docs.length === pageSize);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to load signals");
    }
  }

  useEffect(() => {
    if (!canLoad) return;
    setRows([]);
    setCursor(null);
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLoad, typeFilter, pageSize]);

  async function retry(id: string) {
    if (!user) return;
    const idToken = await user.getIdToken();

    const res = await fetch(`/api/signals/${id}/retry`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${idToken}`,
      },
    });

    const data = (await res.json()) as any;
    if (!res.ok) {
      alert(data?.error || "Retry failed");
      return;
    }

    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              whatsappStatus: data.whatsappStatus,
              errorMessage: data.errorMessage,
            }
          : r
      )
    );
  }

  return (
    <AppShell title="Signal History">
      {error ? (
        <div className="alert alertError" style={{ marginBottom: 12 }}>
          {error}
        </div>
      ) : null}

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="btnRow">
          <input
            className="input"
            style={{ maxWidth: 280 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search (symbol, BUY/SELL, timeframe)"
          />

          <select
            className="input"
            style={{ maxWidth: 180 }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
          >
            <option value="ALL">All</option>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>

          <select
            className="input"
            style={{ maxWidth: 160 }}
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value={10}>10 / page</option>
            <option value={15}>15 / page</option>
            <option value={25}>25 / page</option>
          </select>

          <button className="btn" type="button" onClick={() => load(true)}>
            Refresh
          </button>
        </div>
        <div className="muted" style={{ marginTop: 8 }}>
          Search is applied on the loaded page (simple MVP). For large datasets, we can move it server-side.
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th className="th">Date</th>
              <th className="th">Symbol</th>
              <th className="th">Type</th>
              <th className="th">TF</th>
              <th className="th">Price</th>
              <th className="th">WhatsApp</th>
              <th className="th">Error</th>
              <th className="th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="td">
                  <div>{r.timestamp || r.createdAt || "-"}</div>
                </td>
                <td className="td">{r.symbol}</td>
                <td className="td">
                  <SignalBadge signal={r.signal} />
                </td>
                <td className="td">{r.timeframe}</td>
                <td className="td">{r.price}</td>
                <td className="td">
                  <StatusBadge status={r.whatsappStatus} />
                </td>
                <td className="td" style={{ maxWidth: 260 }}>
                  {r.errorMessage ? (
                    <span className="muted" style={{ wordBreak: "break-word" }}>
                      {r.errorMessage}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="td">
                  <button className="btn" type="button" onClick={() => retry(r.id)}>
                    Retry
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && status !== "loading" ? (
              <tr>
                <td className="td" colSpan={8}>
                  <span className="muted">No signals found.</span>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>

        <div className="btnRow" style={{ marginTop: 12 }}>
          <button
            className="btn"
            type="button"
            disabled={status === "loading" || !hasMore}
            onClick={() => load(false)}
          >
            {status === "loading" ? "Loading..." : hasMore ? "Load more" : "No more"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
