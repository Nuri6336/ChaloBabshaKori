"use client";

import { useState } from "react";
import { LineChart } from "@/components/LineChart";
import { RangePicker, defaultRange } from "@/components/RangePicker";
import { Empty, ErrorBox } from "@/components/ui";
import { qs } from "@/lib/api";
import { dateLabel, money, num } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import type { CategoryTotal, StockReport, Summary, TrendPoint } from "@/lib/types";

export default function ReportsPage() {
  const { t, lang } = useI18n();
  const [range, setRange] = useState(defaultRange());
  const q = qs(range);
  const summary = useApi<Summary>(`/api/reports/summary${q}`);
  const daily = useApi<TrendPoint[]>(`/api/reports/daily-sales${q}`);
  const cats = useApi<CategoryTotal[]>(`/api/reports/expenses-by-category${q}`);
  const stock = useApi<StockReport>("/api/reports/stock");
  const s = summary.data;

  return (
    <>
      <div className="page-head no-print">
        <h1>{t("navReports")}</h1>
        <div className="head-actions">
          <RangePicker value={range} onChange={setRange} />
          <button className="btn outline" onClick={() => window.print()}>
            🖨 {t("print")}
          </button>
        </div>
      </div>
      <ErrorBox message={summary.error ?? daily.error ?? cats.error ?? stock.error} />

      <div className="grid-2">
        <div className="card">
          <div className="card-title">{t("profitLoss")}</div>
          {s && (
            <dl className="sum wide-sum">
              <div>
                <dt>{t("kpiSales")}</dt>
                <dd>{money(s.totalSales, lang)}</dd>
              </div>
              <div>
                <dt>{t("cogs")}</dt>
                <dd>− {money(s.costOfGoodsSold, lang)}</dd>
              </div>
              <div className="grand">
                <dt>{t("grossProfit")}</dt>
                <dd>{money(s.grossProfit, lang)}</dd>
              </div>
              <div>
                <dt>{t("kpiExpense")}</dt>
                <dd>− {money(s.totalExpenses, lang)}</dd>
              </div>
              <div className="grand">
                <dt>{t("netProfit")}</dt>
                <dd className={s.netProfit < 0 ? "neg" : "pos"}>{money(s.netProfit, lang)}</dd>
              </div>
              <div>
                <dt>{t("kpiPurchases")}</dt>
                <dd>{money(s.totalPurchases, lang)}</dd>
              </div>
            </dl>
          )}
        </div>
        <div className="card">
          <div className="card-title">{t("expensesByCategory")}</div>
          {!cats.data || cats.data.length === 0 ? (
            <Empty text={t("noRecords")} />
          ) : (
            <ul className="alert-list">
              {cats.data.map((c) => (
                <li key={c.category}>
                  <span>{c.category}</span>
                  <b>{money(c.total, lang)}</b>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-title">📈 {t("dailySales")}</div>
        {daily.data && <LineChart points={daily.data} />}
        {daily.data && daily.data.some((d) => d.count > 0) && (
          <table className="compact">
            <thead>
              <tr>
                <th>{t("date")}</th>
                <th className="r">{t("invoices")}</th>
                <th className="r">{t("total")}</th>
              </tr>
            </thead>
            <tbody>
              {daily.data
                .filter((d) => d.count > 0)
                .map((d) => (
                  <tr key={d.date}>
                    <td>{dateLabel(d.date, lang)}</td>
                    <td className="r">{num(d.count, lang)}</td>
                    <td className="r">{money(d.total, lang)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card table-card">
        <div className="card-title pad">
          {t("stockSummary")} — {money(stock.data?.totalValue, lang)} / {num(stock.data?.totalUnits, lang)} {t("units")}
        </div>
        {!stock.data || stock.data.rows.length === 0 ? (
          <Empty text={t("noProducts")} />
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t("name")}</th>
                <th>{t("sku")}</th>
                <th className="r">{t("stock")}</th>
                <th className="r">{t("buyPrice")}</th>
                <th className="r">{t("stockValue")}</th>
              </tr>
            </thead>
            <tbody>
              {stock.data.rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.sku ?? "—"}</td>
                  <td className="r">{num(r.stockQty, lang)}</td>
                  <td className="r">{money(r.purchasePrice, lang)}</td>
                  <td className="r">{money(r.value, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
