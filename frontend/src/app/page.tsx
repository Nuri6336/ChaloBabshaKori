"use client";

import Link from "next/link";
import { useState } from "react";
import { LineChart } from "@/components/LineChart";
import { Logo, LogoMark } from "@/components/Logo";
import { Modal } from "@/components/ui";
import { dateLabel, money, num } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { TrendPoint } from "@/lib/types";

// Static demo numbers for the dashboard preview on the landing page.
const DEMO_VALUES = [
  20, 32, 45, 36, 50, 62, 88, 80, 66, 58, 72, 80, 78, 77, 75, 82, 96, 112, 100, 90, 84, 82, 86, 95, 100, 104, 110, 108, 115, 120,
];
const DEMO_POINTS: TrendPoint[] = DEMO_VALUES.map((v, i) => ({
  date: `2025-11-${String(i + 1).padStart(2, "0")}`,
  total: v * 1000,
  count: 0,
}));

export default function LandingPage() {
  const { t, lang, setLang } = useI18n();
  const [videoOpen, setVideoOpen] = useState(false);

  const features = [
    { icon: "🚀", label: t("why1") },
    { icon: "📊", label: t("why2") },
    { icon: "📦", label: t("why3") },
    { icon: "👥", label: t("why4") },
    { icon: "🛡️", label: t("why5") },
    { icon: "🎧", label: t("why6") },
  ];

  return (
    <div className="landing">
      <header className="l-header">
        <Link href="/" aria-label="ChaloBabshaKori.com">
          <Logo />
        </Link>
        <nav className="l-nav">
          <a href="#home" className="active">
            🏠 {t("navHome")}
          </a>
          <a href="#features">{t("navFeatures")}</a>
          <a href="#plans">{t("navPackages")}</a>
          <a href="#support">{t("navSupport")}</a>
          <a href="#about">{t("navAbout")}</a>
        </nav>
        <div className="l-actions">
          <button className="btn ghost small" onClick={() => setLang(lang === "bn" ? "en" : "bn")}>
            {lang === "bn" ? "EN" : "বাংলা"}
          </button>
          <Link href="/login" className="btn outline">
            👤 {t("login")}
          </Link>
          <Link href="/register" className="btn primary">
            {t("startFree")} →
          </Link>
        </div>
      </header>

      <section className="hero" id="home">
        <div className="hero-copy">
          <h1>
            {t("heroTitle1")}
            <br />
            <span>{t("heroTitle2")}</span>
          </h1>
          <p>{t("heroText")}</p>
          <ul className="checks">
            <li>{t("heroCheck1")}</li>
            <li>{t("heroCheck2")}</li>
            <li>{t("heroCheck3")}</li>
          </ul>
          <div className="hero-cta">
            <Link href="/register" className="btn primary large">
              🚀 {t("startNow")} →
            </Link>
            <button type="button" className="btn outline large" onClick={() => setVideoOpen(true)}>
              ▶ {t("watchVideo")}
            </button>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="shelves">
            {Array.from({ length: 24 }).map((_, i) => (
              <span key={i} style={{ background: SHELF_COLORS[i % SHELF_COLORS.length] }} />
            ))}
          </div>
          <div className="laptop">
            <div className="laptop-screen">
              <div className="mini-side" />
              <div className="mini-main">
                <div className="mini-cards">
                  <i /> <i /> <i /> <i />
                </div>
                <div className="mini-bars">
                  {[30, 45, 38, 60, 52, 75, 68, 90].map((h, i) => (
                    <b key={i} style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="laptop-base" />
          </div>
          <div className="hero-badge">
            {t("heroBadge1")}
            <br />
            {t("heroBadge2")}
          </div>
        </div>
      </section>

      <section className="preview" id="preview">
        <div className="demo-app">
          <aside className="demo-side">
            <div className="demo-brand">
              <LogoMark size={30} />
              <b>ChaloBabshaKori</b>
            </div>
            <ul>
              {[t("navDashboard"), t("navProducts"), t("navSales"), t("navPurchases"), t("navAccounts"), t("navReports"), t("navSettings")].map(
                (label, i) => (
                  <li key={label} className={i === 0 ? "on" : ""}>
                    {label}
                  </li>
                ),
              )}
            </ul>
            <div className="demo-help">
              {t("needHelp")}
              <br />
              📞 {lang === "bn" ? "০৯৬৭৮-১২৩৪৫৬" : "09678-123456"}
            </div>
          </aside>
          <div className="demo-main">
            <div className="demo-top">
              <span>
                🏪 {t("myBusiness")}: {lang === "bn" ? "নূর ট্রেডার্স" : "Noor Traders"}
              </span>
              <span className="muted">📅 {dateLabel("2025-11-01", lang)} – {dateLabel("2025-11-30", lang)}</span>
            </div>
            <div className="demo-kpis">
              <div className="kpi blue">
                <small>{t("kpiSales")}</small>
                <b>{money(286000, lang)}</b>
                <em>▲ {num(12, lang)}% {t("vsLastMonth")}</em>
              </div>
              <div className="kpi green">
                <small>{t("kpiStock")}</small>
                <b>{money(126000, lang)}</b>
                <em>▲ {num(5, lang)}%</em>
              </div>
              <div className="kpi orange">
                <small>{t("kpiExpense")}</small>
                <b>{money(85000, lang)}</b>
                <em>▲ {num(8, lang)}%</em>
              </div>
              <div className="kpi red">
                <small>{t("kpiReceivable")}</small>
                <b>{money(46000, lang)}</b>
                <em>▲ {num(10, lang)}%</em>
              </div>
            </div>
            <div className="demo-grid">
              <div className="card">
                <div className="card-title">📈 {t("salesSummary")}</div>
                <LineChart points={DEMO_POINTS} height={230} />
              </div>
              <div className="card">
                <div className="card-title">🔔 {t("stockAlert")}</div>
                <ul className="alert-list">
                  <li>
                    <span>📱 {lang === "bn" ? "স্মার্টফোন কভার" : "Smartphone cover"}</span>
                    <span className="pill red">
                      {t("lowStock")} ({num(5, lang)}
                      {lang === "bn" ? "টি" : ""})
                    </span>
                  </li>
                  <li>
                    <span>🔌 {lang === "bn" ? "USB চার্জার" : "USB charger"}</span>
                    <span className="pill red">
                      {t("lowStock")} ({num(4, lang)}
                      {lang === "bn" ? "টি" : ""})
                    </span>
                  </li>
                  <li>
                    <span>🔋 {lang === "bn" ? "পাওয়ার ব্যাংক" : "Power bank"}</span>
                    <span className="pill orange">
                      {t("runningOut")} ({num(12, lang)}
                      {lang === "bn" ? "টি" : ""})
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="why" id="features">
        <h2>
          <span className="rule" /> {t("whyTitle")} <span className="rule" />
        </h2>
        <div className="why-grid">
          {features.map((f) => (
            <div className="why-card" key={f.label}>
              <div className="why-icon">{f.icon}</div>
              <p>{f.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="trio" id="plans">
        <div className="card testimonial">
          <div className="quote">“</div>
          <p>{t("testimonial")}</p>
          <div className="who">
            <div className="avatar">র</div>
            <div>
              <b>{t("testimonialName")}</b>
              <small>{t("testimonialRole")}</small>
            </div>
          </div>
        </div>

        <div className="cta-card">
          <div>
            <h3>{t("ctaTitle")}</h3>
            <p>{t("ctaText")}</p>
            <Link href="/register" className="btn green">
              → {t("createFreeAccount")} →
            </Link>
          </div>
          <div className="cta-chart">↗</div>
        </div>

        <div className="card plans">
          <div className="card-title">
            {t("ourPlans")} <Link href="/register">{t("seeAll")} →</Link>
          </div>
          <div className="plan-cols">
            <div>
              <b>{t("planFree")}</b>
              <small>{t("planFreeFor")}</small>
              <Link href="/register" className="btn outline small">
                {t("planFreeBtn")}
              </Link>
            </div>
            <div>
              <b>{t("planPremium")}</b>
              <small>{t("planPremiumFor")}</small>
              <Link href="/register" className="btn outline small">
                {t("planPremiumBtn")}
              </Link>
            </div>
            <div>
              <b>{t("planBusiness")}</b>
              <small>{t("planBusinessFor")}</small>
              <a href="#support" className="btn outline small">
                {t("planBusinessBtn")}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="about" id="about">
        <div>
          <h3>{t("navAbout")}</h3>
          <p>{t("aboutText")}</p>
        </div>
        <div id="support">
          <h3>{t("navSupport")}</h3>
          <p>
            📞 {lang === "bn" ? "০৯৬৭৮-১২৩৪৫৬" : "09678-123456"}
            <br />
            ✉️ support@chalobabshakori.com
          </p>
        </div>
      </section>

      <footer className="l-footer">
        <Logo light />
        <nav>
          <a href="#">{t("privacy")}</a>
          <a href="#">{t("terms")}</a>
          <a href="#support">{t("contact")}</a>
        </nav>
        <div className="social" aria-hidden="true">
          <span>f</span>
          <span>▶</span>
          <span>in</span>
        </div>
        <div className="footer-slogan">{t("footerSlogan")}</div>
      </footer>

      {videoOpen && (
        <Modal title={t("demoTitle")} onClose={() => setVideoOpen(false)} wide>
          <video className="demo-video" controls autoPlay playsInline preload="metadata" poster="/videos/poster.png">
            <source src="/videos/demo.webm" type="video/webm" />
            {t("videoUnsupported")}
          </video>
        </Modal>
      )}
    </div>
  );
}

const SHELF_COLORS = ["#e8453c", "#f2b134", "#2d7fd1", "#35a853", "#f2762e", "#8a5cd0", "#e24a8d", "#1fa8a8"];
