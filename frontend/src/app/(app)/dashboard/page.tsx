"use client";

import Link from "next/link";
import { useState } from "react";
import { LineChart } from "@/components/LineChart";
import { RangePicker, defaultRange } from "@/components/RangePicker";
import { ErrorBox } from "@/components/ui";
import { qs } from "@/lib/api";
import { money, num } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import type { Dashboard } from "@/lib/types";

export default function DashboardPage() {
  const { t, lang } = useI18n();
  const [range, setRange] = useState(defaultRange());
  const { data, error, loading } = useApi<Dashboard>(`/api/dashboard${qs(range)}`);
  const s = data?.summary;
  const pct = s?.salesChangePct;

  return (
    <>
      <div className="page-head">
        <h1>{t("navDashboard")}</h1>
        <RangePicker value={range} onChange={setRange} />
      </div>
      <ErrorBox message={error} />
      {loading && !data && <div className="empty">…</div>}
      {data && s && (
        <>
          <div className="kpis">
            <div className="kpi blue">
              <small>{t("kpiSales")}</small>
              <b>{money(s.totalSales, lang)}</b>
              {pct !== null && pct !== undefined && (
                <em className={pct < 0 ? "down" : ""}>
                  {pct < 0 ? "▼" : "▲"} {num(Math.abs(pct), lang)}% {t("vsPrevious")}
                </em>
              )}
            </div>
            <div className="kpi green">
              <small>{t("kpiStock")}</small>
              <b>{money(data.stockValue, lang)}</b>
              <em>
                {num(data.totalUnits, lang)} {t("units")}
              </em>
            </div>
            <div className="kpi orange">
              <small>{t("kpiExpense")}</small>
              <b>{money(s.totalExpenses, lang)}</b>
            </div>
            <div className="kpi red">
              <small>{t("kpiReceivable")}</small>
              <b>{money(data.receivable, lang)}</b>
              <em>
                {t("payable")}: {money(data.payable, lang)}
              </em>
            </div>
          </div>

          <div className="kpis small-kpis">
            <div className="mini">
              <small>{t("grossProfit")}</small>
              <b>{money(s.grossProfit, lang)}</b>
            </div>
            <div className="mini">
              <small>{t("netProfit")}</small>
              <b className={s.netProfit < 0 ? "neg" : "pos"}>{money(s.netProfit, lang)}</b>
            </div>
            <div className="mini">
              <small>{t("kpiPurchases")}</small>
              <b>{money(s.totalPurchases, lang)}</b>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-title">📈 {t("salesSummary")}</div>
              <LineChart points={data.salesTrend} />
            </div>
            <div className="card">
              <div className="card-title">
                🔔 {t("stockAlert")} <Link href="/products">{t("seeAll")} →</Link>
              </div>
              {data.lowStock.length === 0 ? (
                <div className="empty">{t("noLowStock")}</div>
              ) : (
                <ul className="alert-list">
                  {data.lowStock.map((p) => (
                    <li key={p.id}>
                      <span>{p.name}</span>
                      <span className={`pill ${p.stockQty === 0 ? "red" : p.stockQty <= p.lowStockThreshold / 2 ? "red" : "orange"}`}>
                        {p.stockQty === 0 ? t("outOfStock") : t("lowStock")} ({num(p.stockQty, lang)})
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="quick">
            <Link href="/sales/new" className="btn primary">
              + {t("newSale")}
            </Link>
            <Link href="/purchases/new" className="btn outline">
              + {t("newPurchase")}
            </Link>
            <Link href="/products" className="btn outline">
              + {t("addProduct")}
            </Link>
            <Link href="/expenses" className="btn outline">
              + {t("addExpense")}
            </Link>
          </div>
        </>
      )}
    </>
  );
}
