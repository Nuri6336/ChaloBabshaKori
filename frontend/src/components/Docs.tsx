"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { RangePicker, defaultRange } from "@/components/RangePicker";
import { Empty, ErrorBox, Field } from "@/components/ui";
import { ApiError, api, qs } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { dateLabel, money, num, today } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import type { Party, Product, Purchase, Sale } from "@/lib/types";

export type Kind = "sale" | "purchase";
type Doc = Sale | Purchase;

const base = (k: Kind) => (k === "sale" ? "/sales" : "/purchases");
const numberOf = (d: Doc) => ("invoiceNo" in d ? d.invoiceNo : d.billNo);
const dateOf = (d: Doc) => ("saleDate" in d ? d.saleDate : d.purchaseDate);
const partyOf = (d: Doc) => ("customerName" in d ? d.customerName : d.supplierName);

export function DocList({ kind }: { kind: Kind }) {
  const { t, lang } = useI18n();
  const [range, setRange] = useState(defaultRange());
  const { data, error, loading } = useApi<Doc[]>(`/api${base(kind)}${qs(range)}`);
  const total = (data ?? []).reduce((s, d) => s + d.total, 0);
  const due = (data ?? []).reduce((s, d) => s + d.due, 0);

  return (
    <>
      <div className="page-head">
        <h1>{kind === "sale" ? t("navSales") : t("navPurchases")}</h1>
        <div className="head-actions">
          <RangePicker value={range} onChange={setRange} />
          <Link href={`${base(kind)}/new`} className="btn primary">
            + {kind === "sale" ? t("newSale") : t("newPurchase")}
          </Link>
        </div>
      </div>
      <ErrorBox message={error} />
      <div className="card table-card">
        {loading && !data ? (
          <Empty text="…" />
        ) : !data || data.length === 0 ? (
          <Empty text={t("noRecords")} />
        ) : (
          <table>
            <thead>
              <tr>
                <th>{kind === "sale" ? t("invoiceNo") : t("billNo")}</th>
                <th>{t("date")}</th>
                <th>{kind === "sale" ? t("customer") : t("supplier")}</th>
                <th className="r">{t("total")}</th>
                <th className="r">{t("paid")}</th>
                <th className="r">{t("due")}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.id}>
                  <td>
                    <Link href={`${base(kind)}/${d.id}`}>{numberOf(d)}</Link>
                  </td>
                  <td>{dateLabel(dateOf(d), lang)}</td>
                  <td>{partyOf(d) ?? t("walkIn")}</td>
                  <td className="r">{money(d.total, lang)}</td>
                  <td className="r">{money(d.paid, lang)}</td>
                  <td className="r">
                    <span className={`pill ${d.due > 0 ? "orange" : "green"}`}>{money(d.due, lang)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>{t("total")}</td>
                <td className="r">{money(total, lang)}</td>
                <td />
                <td className="r">{money(due, lang)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </>
  );
}

interface FormLine {
  key: number;
  productId: string;
  qty: string;
  price: string;
}

export function DocForm({ kind }: { kind: Kind }) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const isSale = kind === "sale";
  const products = useApi<Product[]>("/api/products");
  const parties = useApi<Party[]>(isSale ? "/api/customers" : "/api/suppliers");

  const [partyId, setPartyId] = useState("");
  const [date, setDate] = useState(today());
  const [lines, setLines] = useState<FormLine[]>([{ key: 1, productId: "", qty: "1", price: "0" }]);
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");
  const [paid, setPaid] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const productById = useMemo(() => new Map((products.data ?? []).map((p) => [String(p.id), p])), [products.data]);
  const subtotal = lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.price) || 0), 0);
  const total = Math.max(0, subtotal - (isSale ? Number(discount) || 0 : 0) + (isSale ? Number(tax) || 0 : 0));
  const paidValue = paid === "" ? total : Number(paid);
  const due = total - paidValue;

  // Keep the "paid" field in step with the total until the user types their own amount.
  useEffect(() => {
    if (paid !== "" && Number(paid) > total) setPaid(String(total));
  }, [total, paid]);

  function updateLine(key: number, patch: Partial<FormLine>) {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function pickProduct(key: number, productId: string) {
    const p = productById.get(productId);
    updateLine(key, { productId, price: p ? String(isSale ? p.sellingPrice : p.purchasePrice) : "0" });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const items = lines.filter((l) => l.productId);
    if (items.length === 0) {
      setError(t("addAtLeastOneItem"));
      return;
    }
    if (isSale && !partyId && due > 0) {
      setError(t("dueNeedsCustomer"));
      return;
    }
    setBusy(true);
    try {
      const body = isSale
        ? {
            customerId: partyId ? Number(partyId) : null,
            saleDate: date,
            items: items.map((l) => ({ productId: Number(l.productId), qty: Number(l.qty), unitPrice: Number(l.price) })),
            discount: Number(discount) || 0,
            tax: Number(tax) || 0,
            paid: paidValue,
            note,
          }
        : {
            supplierId: partyId ? Number(partyId) : null,
            purchaseDate: date,
            items: items.map((l) => ({ productId: Number(l.productId), qty: Number(l.qty), unitCost: Number(l.price) })),
            paid: paidValue,
            note,
          };
      const created = await api<Doc>(`/api${base(kind)}`, { body });
      router.push(`${base(kind)}/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>{isSale ? t("newSale") : t("newPurchase")}</h1>
      </div>
      <form className="card form-card" onSubmit={submit}>
        <ErrorBox message={error} />
        <div className="form-grid">
          <Field label={isSale ? t("customer") : t("supplier")}>
            <select value={partyId} onChange={(e) => setPartyId(e.target.value)}>
              <option value="">{isSale ? t("walkIn") : t("noSupplier")}</option>
              {(parties.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("date")}>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>

        <table className="lines">
          <thead>
            <tr>
              <th>{t("product")}</th>
              <th className="r">{t("qty")}</th>
              <th className="r">{isSale ? t("sellPrice") : t("buyPrice")}</th>
              <th className="r">{t("amount")}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => {
              const p = productById.get(l.productId);
              return (
                <tr key={l.key}>
                  <td>
                    <select required={lines.length === 1} value={l.productId} onChange={(e) => pickProduct(l.key, e.target.value)}>
                      <option value="">{t("selectProduct")}</option>
                      {(products.data ?? []).map((pr) => (
                        <option key={pr.id} value={pr.id}>
                          {pr.name} ({num(pr.stockQty, lang)})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="r">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      max={isSale && p ? p.stockQty : undefined}
                      value={l.qty}
                      onChange={(e) => updateLine(l.key, { qty: e.target.value })}
                    />
                  </td>
                  <td className="r">
                    <input type="number" min="0" step="0.01" value={l.price} onChange={(e) => updateLine(l.key, { price: e.target.value })} />
                  </td>
                  <td className="r">{money((Number(l.qty) || 0) * (Number(l.price) || 0), lang)}</td>
                  <td>
                    {lines.length > 1 && (
                      <button type="button" className="icon-btn" onClick={() => setLines(lines.filter((x) => x.key !== l.key))} aria-label={t("delete")}>
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button
          type="button"
          className="btn outline small"
          onClick={() => setLines([...lines, { key: Math.max(...lines.map((l) => l.key)) + 1, productId: "", qty: "1", price: "0" }])}
        >
          + {t("addLine")}
        </button>

        <div className="totals-box">
          <div className="form-grid">
            {isSale && (
              <>
                <Field label={t("discount")}>
                  <input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                </Field>
                <Field label={t("tax")}>
                  <input type="number" min="0" step="0.01" value={tax} onChange={(e) => setTax(e.target.value)} />
                </Field>
              </>
            )}
            <Field label={t("paidNow")}>
              <input
                type="number"
                min="0"
                max={total}
                step="0.01"
                value={paid === "" ? String(total) : paid}
                onChange={(e) => setPaid(e.target.value)}
              />
            </Field>
            <Field label={t("note")}>
              <input maxLength={255} value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
          </div>
          <dl className="sum">
            <div>
              <dt>{t("subtotal")}</dt>
              <dd>{money(subtotal, lang)}</dd>
            </div>
            <div className="grand">
              <dt>{t("total")}</dt>
              <dd>{money(total, lang)}</dd>
            </div>
            <div>
              <dt>{t("due")}</dt>
              <dd>{money(Math.max(0, due), lang)}</dd>
            </div>
          </dl>
        </div>

        <div className="form-actions">
          <Link href={base(kind)} className="btn outline">
            {t("cancel")}
          </Link>
          <button className="btn primary" disabled={busy}>
            {t("save")}
          </button>
        </div>
      </form>
    </>
  );
}

export function DocView({ kind, id }: { kind: Kind; id: string }) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const { data, error, reload } = useApi<Doc>(`/api${base(kind)}/${id}`);
  const [amount, setAmount] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  async function pay(e: FormEvent) {
    e.preventDefault();
    try {
      await api(`/api${base(kind)}/${id}/payments`, { body: { amount: Number(amount), method: "CASH" } });
      setAmount("");
      setActionError(null);
      await reload();
    } catch (err) {
      setActionError((err as Error).message);
    }
  }

  async function remove() {
    if (!window.confirm(t("confirmDeleteDoc"))) return;
    try {
      await api(`/api${base(kind)}/${id}`, { method: "DELETE" });
      router.replace(base(kind));
    } catch (err) {
      setActionError((err as Error).message);
    }
  }

  if (error) return <ErrorBox message={error} />;
  if (!data) return <Empty text="…" />;

  return (
    <>
      <div className="page-head no-print">
        <h1>{numberOf(data)}</h1>
        <div className="head-actions">
          <Link href={base(kind)} className="btn outline">
            ← {kind === "sale" ? t("navSales") : t("navPurchases")}
          </Link>
          <button className="btn primary" onClick={() => window.print()}>
            🖨 {t("print")}
          </button>
          <button className="btn danger" onClick={remove}>
            {t("delete")}
          </button>
        </div>
      </div>
      <ErrorBox message={actionError} />

      <article className="card invoice">
        <header>
          <div>
            <h2>{user?.businessName}</h2>
            <small>{kind === "sale" ? t("invoice") : t("purchaseBill")}</small>
          </div>
          <dl>
            <div>
              <dt>{kind === "sale" ? t("invoiceNo") : t("billNo")}</dt>
              <dd>{numberOf(data)}</dd>
            </div>
            <div>
              <dt>{t("date")}</dt>
              <dd>{dateLabel(dateOf(data), lang)}</dd>
            </div>
            <div>
              <dt>{kind === "sale" ? t("customer") : t("supplier")}</dt>
              <dd>{partyOf(data) ?? (kind === "sale" ? t("walkIn") : "—")}</dd>
            </div>
          </dl>
        </header>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>{t("product")}</th>
              <th className="r">{t("qty")}</th>
              <th className="r">{t("price")}</th>
              <th className="r">{t("amount")}</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((l, i) => (
              <tr key={i}>
                <td>{num(i + 1, lang)}</td>
                <td>{l.productName}</td>
                <td className="r">{num(l.qty, lang)}</td>
                <td className="r">{money(l.unitPrice, lang)}</td>
                <td className="r">{money(l.lineTotal, lang)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="sum">
          {"subtotal" in data && (
            <>
              <div>
                <dt>{t("subtotal")}</dt>
                <dd>{money(data.subtotal, lang)}</dd>
              </div>
              {data.discount > 0 && (
                <div>
                  <dt>{t("discount")}</dt>
                  <dd>− {money(data.discount, lang)}</dd>
                </div>
              )}
              {data.tax > 0 && (
                <div>
                  <dt>{t("tax")}</dt>
                  <dd>{money(data.tax, lang)}</dd>
                </div>
              )}
            </>
          )}
          <div className="grand">
            <dt>{t("total")}</dt>
            <dd>{money(data.total, lang)}</dd>
          </div>
          <div>
            <dt>{t("paid")}</dt>
            <dd>{money(data.paid, lang)}</dd>
          </div>
          <div>
            <dt>{t("due")}</dt>
            <dd>{money(data.due, lang)}</dd>
          </div>
        </dl>
        {data.note && <p className="muted">{data.note}</p>}
        <footer className="thanks">{t("thankYou")}</footer>
      </article>

      <div className="card no-print">
        <div className="card-title">{t("payments")}</div>
        {data.payments.length === 0 ? (
          <Empty text={t("noPayments")} />
        ) : (
          <ul className="alert-list">
            {data.payments.map((p) => (
              <li key={p.id}>
                <span>{dateLabel(p.paidAt, lang)}</span>
                <b>{money(p.amount, lang)}</b>
              </li>
            ))}
          </ul>
        )}
        {data.due > 0 && (
          <form className="inline-form" onSubmit={pay}>
            <input
              type="number"
              min="0.01"
              max={data.due}
              step="0.01"
              required
              placeholder={t("amount")}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button type="button" className="btn outline small" onClick={() => setAmount(String(data.due))}>
              {t("fullDue")}
            </button>
            <button className="btn primary small">{t("recordPayment")}</button>
          </form>
        )}
      </div>
    </>
  );
}
