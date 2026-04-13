export function SignalBadge({ signal }: { signal: string }) {
  const normalized = String(signal || "").toUpperCase();
  if (normalized === "BUY") return <span className="badge badgeBuy">BUY</span>;
  if (normalized === "SELL") return <span className="badge badgeSell">SELL</span>;
  return <span className="badge badgeNeutral">{normalized || "-"}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "success") {
    return <span className="badge badgeBuy">success</span>;
  }
  if (normalized === "failed") {
    return <span className="badge badgeSell">failed</span>;
  }
  if (normalized === "mock_success") {
    return <span className="badge badgeNeutral">mock</span>;
  }
  return <span className="badge badgeNeutral">{normalized || "-"}</span>;
}
