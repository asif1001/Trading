"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/firebaseClient";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link className={`navLink ${active ? "navLinkActive" : ""}`} href={href}>
      {label}
    </Link>
  );
}

export function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function onLogout() {
    await signOut(firebaseAuth);
    router.replace("/login");
  }

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="sidebarTitle">Trade Signal Notifier</div>
        <nav className="nav">
          <NavLink href="/dashboard" label="Dashboard" />
          <NavLink href="/signals/new" label="Manual Test Signal" />
          <NavLink href="/signals" label="Signal History" />
          <NavLink href="/settings" label="Settings" />
        </nav>
        <div style={{ marginTop: 16 }}>
          <button className="btn" onClick={onLogout} type="button">
            Logout
          </button>
        </div>
      </aside>

      <div className="content">
        <div className="topbar">
          <div>
            <div className="pageTitle">{title}</div>
            <div className="muted" style={{ marginTop: 2 }}>
              Admin panel
            </div>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
