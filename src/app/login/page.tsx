"use client";

import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { firebaseAuth } from "@/lib/firebase/firebaseClient";
import { useAuth } from "@/lib/auth/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const disabled = useMemo(
    () => status === "loading" || !email || !password,
    [email, password, status]
  );

  useEffect(() => {
    if (loading) return;
    if (user) router.replace("/dashboard");
  }, [loading, router, user]);

  if (!loading && user) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      router.replace("/dashboard");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Login failed");
      return;
    }

    setStatus("idle");
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 18 }}>
      <div className="card">
        <div className="cardTitle">Admin Login</div>
        <div className="muted" style={{ marginBottom: 14 }}>
          Sign in with your Firebase Auth email/password.
        </div>

        {errorMessage ? (
          <div className="alert alertError" style={{ marginBottom: 12 }}>
            {errorMessage}
          </div>
        ) : null}

        <form className="row" onSubmit={onSubmit}>
          <div>
            <div className="label">Email</div>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="admin@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <div className="label">Password</div>
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button className="btn btnPrimary" disabled={disabled} type="submit">
            {status === "loading" ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
