"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import type { Key } from "@/lib/dict";

const NAV: { href: string; icon: string; label: Key }[] = [
  { href: "/dashboard", icon: "🏠", label: "navDashboard" },
  { href: "/products", icon: "📦", label: "navProducts" },
  { href: "/sales", icon: "🛒", label: "navSales" },
  { href: "/purchases", icon: "🧾", label: "navPurchases" },
  { href: "/customers", icon: "👥", label: "navCustomers" },
  { href: "/suppliers", icon: "🚚", label: "navSuppliers" },
  { href: "/expenses", icon: "💸", label: "navExpenses" },
  { href: "/reports", icon: "📊", label: "navReports" },
  { href: "/settings", icon: "⚙️", label: "navSettings" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, ready, logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) return <div className="splash">…</div>;

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="side-brand">
          <Logo light tagline={false} />
        </Link>
        <nav>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={pathname.startsWith(n.href) ? "on" : ""}>
              <span>{n.icon}</span> {t(n.label)}
            </Link>
          ))}
        </nav>
        <div className="side-foot">
          {t("needHelp")}
          <br />
          📞 {lang === "bn" ? "০৯৬৭৮-১২৩৪৫৬" : "09678-123456"}
        </div>
      </aside>
      <div className="content">
        <header className="topbar">
          <div className="biz">🏪 {user.businessName}</div>
          <div className="top-actions">
            <button className="btn ghost small" onClick={() => setLang(lang === "bn" ? "en" : "bn")}>
              {lang === "bn" ? "EN" : "বাংলা"}
            </button>
            <span className="user-chip">
              <i>{user.name.slice(0, 2).toUpperCase()}</i> {user.name}
            </span>
            <button className="btn outline small" onClick={logout}>
              {t("logout")}
            </button>
          </div>
        </header>
        <main className="page">{children}</main>
      </div>
    </div>
  );
}
