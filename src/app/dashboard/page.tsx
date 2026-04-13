"use client";

import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useRequireAuth } from "@/lib/auth/requireAuth";
import { firebaseDb } from "@/lib/firebase/firebaseClient";

type Summary = {
  total: number;
  buy: number;
  sell: number;
  lastSignalTime: string | null;
  lastWhatsappStatus: string | null;
};

export default function DashboardPage() {
  const { user, loading } = useRequireAuth();
  const [summary, setSummary] = useState<Summary>({
    total: 0,
    buy: 0,
    sell: 0,
    lastSignalTime: null,
    lastWhatsappStatus: null,
  });

  const canLoad = useMemo(() => !loading && !!user, [loading, user]);

  useEffect(() => {
    if (!canLoad) return;

    async function load() {
      const signalsCol = collection(firebaseDb, "signals");

      const totalSnap = await getCountFromServer(query(signalsCol));
      const buySnap = await getCountFromServer(
        query(signalsCol, where("signal", "==", "BUY"))
      );
      const sellSnap = await getCountFromServer(
        query(signalsCol, where("signal", "==", "SELL"))
      );

      const last = query(signalsCol, orderBy("createdAt", "desc"), limit(1));

      let lastSignalTime: string | null = null;
      let lastWhatsappStatus: string | null = null;

      const lastSnap = await getDocs(last);
      if (!lastSnap.empty) {
        const d = lastSnap.docs[0]!.data() as any;
        lastSignalTime = d.timestamp || d.createdAt || null;
        lastWhatsappStatus = d.whatsappStatus || null;
      }

      setSummary({
        total: totalSnap.data().count,
        buy: buySnap.data().count,
        sell: sellSnap.data().count,
        lastSignalTime,
        lastWhatsappStatus,
      });
    }

    load();
  }, [canLoad]);

  return (
    <AppShell title="Dashboard">
      <div className="gridCards" style={{ marginBottom: 12 }}>
        <div className="card">
          <div className="cardTitle">Total signals</div>
          <div className="cardValue">{summary.total}</div>
        </div>
        <div className="card">
          <div className="cardTitle">BUY signals</div>
          <div className="cardValue">{summary.buy}</div>
        </div>
        <div className="card">
          <div className="cardTitle">SELL signals</div>
          <div className="cardValue">{summary.sell}</div>
        </div>
        <div className="card">
          <div className="cardTitle">Last signal</div>
          <div className="cardValue" style={{ fontSize: 14, fontWeight: 700 }}>
            {summary.lastSignalTime ? summary.lastSignalTime : "-"}
          </div>
          <div className="muted" style={{ marginTop: 6 }}>
            WhatsApp: {summary.lastWhatsappStatus || "-"}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="cardTitle">Quick actions</div>
        <div className="btnRow" style={{ marginTop: 10 }}>
          <Link className="btn btnPrimary" href="/signals/new">
            Add test signal
          </Link>
          <Link className="btn" href="/signals">
            View signal history
          </Link>
          <Link className="btn" href="/settings">
            Settings
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="cardTitle">Webhook endpoint</div>
        <div className="muted" style={{ marginTop: 6, wordBreak: "break-word" }}>
          POST <b>/api/webhook/signal</b>
        </div>
      </div>
    </AppShell>
  );
}
