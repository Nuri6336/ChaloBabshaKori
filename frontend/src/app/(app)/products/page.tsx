"use client";

import { useMemo, useState, type FormEvent } from "react";
import { ErrorBox, Empty, Field, Modal } from "@/components/ui";
import { api } from "@/lib/api";
import { money, num } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import type { Product } from "@/lib/types";

interface Form {
  name: string;
  sku: string;
  barcode: string;
  category: string;
  unit: string;
  purchasePrice: string;
  sellingPrice: string;
  stockQty: string;
  lowStockThreshold: string;
}

const EMPTY: Form = {
  name: "",
  sku: "",
  barcode: "",
  category: "",
  unit: "",
  purchasePrice: "0",
  sellingPrice: "0",
  stockQty: "0",
  lowStockThreshold: "5",
};

export default function ProductsPage() {
  const { t, lang } = useI18n();
  const { data, error, loading, reload } = useApi<Product[]>("/api/products");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<{ id: number | null; form: Form } | null>(null);
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter(
      (p) => !q || [p.name, p.sku, p.barcode, p.category].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [data, query]);

  function openEdit(p: Product) {
    setEditing({
      id: p.id,
      form: {
        name: p.name,
        sku: p.sku ?? "",
        barcode: p.barcode ?? "",
        category: p.category ?? "",
        unit: p.unit ?? "",
        purchasePrice: String(p.purchasePrice),
        sellingPrice: String(p.sellingPrice),
        stockQty: String(p.stockQty),
        lowStockThreshold: String(p.lowStockThreshold),
      },
    });
  }

  async function remove(p: Product) {
    if (!window.confirm(`${t("confirmDelete")} "${p.name}"?`)) return;
    try {
      await api(`/api/products/${p.id}`, { method: "DELETE" });
      await reload();
    } catch (e) {
      setActionError((e as Error).message);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>{t("navProducts")}</h1>
        <div className="head-actions">
          <input className="search" placeholder={t("search")} value={query} onChange={(e) => setQuery(e.target.value)} />
          <button className="btn primary" onClick={() => setEditing({ id: null, form: EMPTY })}>
            + {t("addProduct")}
          </button>
        </div>
      </div>
      <ErrorBox message={error ?? actionError} />
      <div className="card table-card">
        {loading && !data ? (
          <Empty text="…" />
        ) : rows.length === 0 ? (
          <Empty text={t("noProducts")} />
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t("name")}</th>
                <th>{t("sku")}</th>
                <th>{t("category")}</th>
                <th className="r">{t("buyPrice")}</th>
                <th className="r">{t("sellPrice")}</th>
                <th className="r">{t("stock")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.sku ?? "—"}</td>
                  <td>{p.category ?? "—"}</td>
                  <td className="r">{money(p.purchasePrice, lang)}</td>
                  <td className="r">{money(p.sellingPrice, lang)}</td>
                  <td className="r">
                    <span className={`pill ${p.stockQty <= p.lowStockThreshold ? "red" : "green"}`}>
                      {num(p.stockQty, lang)} {p.unit ?? ""}
                    </span>
                  </td>
                  <td className="actions">
                    <button className="link" onClick={() => setAdjusting(p)}>
                      {t("adjustStock")}
                    </button>
                    <button className="link" onClick={() => openEdit(p)}>
                      {t("edit")}
                    </button>
                    <button className="link danger" onClick={() => remove(p)}>
                      {t("delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <ProductModal
          state={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await reload();
          }}
        />
      )}
      {adjusting && (
        <AdjustModal
          product={adjusting}
          onClose={() => setAdjusting(null)}
          onSaved={async () => {
            setAdjusting(null);
            await reload();
          }}
        />
      )}
    </>
  );
}

function ProductModal({
  state,
  onClose,
  onSaved,
}: {
  state: { id: number | null; form: Form };
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { t } = useI18n();
  const [form, setForm] = useState(state.form);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body = {
      name: form.name,
      sku: form.sku,
      barcode: form.barcode,
      category: form.category,
      unit: form.unit,
      purchasePrice: Number(form.purchasePrice),
      sellingPrice: Number(form.sellingPrice),
      stockQty: Number(form.stockQty),
      lowStockThreshold: Number(form.lowStockThreshold),
    };
    try {
      await api(state.id ? `/api/products/${state.id}` : "/api/products", { method: state.id ? "PUT" : "POST", body });
      await onSaved();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <Modal title={state.id ? t("editProduct") : t("addProduct")} onClose={onClose}>
      <form onSubmit={submit} className="form-grid">
        <ErrorBox message={error} />
        <Field label={t("name")} wide>
          <input required maxLength={160} value={form.name} onChange={set("name")} autoFocus />
        </Field>
        <Field label={t("sku")}>
          <input maxLength={60} value={form.sku} onChange={set("sku")} />
        </Field>
        <Field label={t("barcode")}>
          <input maxLength={60} value={form.barcode} onChange={set("barcode")} />
        </Field>
        <Field label={t("category")}>
          <input maxLength={80} value={form.category} onChange={set("category")} />
        </Field>
        <Field label={t("unit")}>
          <input
            maxLength={30}
            value={form.unit}
            onChange={set("unit")}
            placeholder={t("unitHint")}
            pattern="\D*"
            title={t("unitHint")}
          />
        </Field>
        <Field label={t("buyPrice")}>
          <input type="number" min="0" step="0.01" required value={form.purchasePrice} onChange={set("purchasePrice")} />
        </Field>
        <Field label={t("sellPrice")}>
          <input type="number" min="0" step="0.01" required value={form.sellingPrice} onChange={set("sellingPrice")} />
        </Field>
        <Field label={state.id ? t("stock") : t("openingStock")}>
          <input type="number" min="0" step="1" required value={form.stockQty} onChange={set("stockQty")} />
        </Field>
        <Field label={t("lowStockLevel")}>
          <input type="number" min="0" step="1" required value={form.lowStockThreshold} onChange={set("lowStockThreshold")} />
        </Field>
        <div className="form-actions wide">
          <button type="button" className="btn outline" onClick={onClose}>
            {t("cancel")}
          </button>
          <button className="btn primary" disabled={busy}>
            {t("save")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AdjustModal({ product, onClose, onSaved }: { product: Product; onClose: () => void; onSaved: () => Promise<void> }) {
  const { t, lang } = useI18n();
  const [delta, setDelta] = useState("0");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await api(`/api/products/${product.id}/adjust-stock`, { body: { delta: Number(delta), reason } });
      await onSaved();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <Modal title={`${t("adjustStock")}: ${product.name}`} onClose={onClose}>
      <form onSubmit={submit} className="form-grid">
        <ErrorBox message={error} />
        <p className="wide muted">
          {t("stock")}: {num(product.stockQty, lang)}
        </p>
        <Field label={t("adjustBy")}>
          <input type="number" step="1" required value={delta} onChange={(e) => setDelta(e.target.value)} autoFocus />
        </Field>
        <Field label={t("reason")}>
          <input maxLength={255} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        <div className="form-actions wide">
          <button type="button" className="btn outline" onClick={onClose}>
            {t("cancel")}
          </button>
          <button className="btn primary">{t("save")}</button>
        </div>
      </form>
    </Modal>
  );
}
