"use client";

import { useState, type FormEvent } from "react";
import { Empty, ErrorBox, Field, Modal } from "@/components/ui";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import type { Party } from "@/lib/types";

/** Customers (balance = dues to receive) and suppliers (balance = dues to pay). */
export function PartyPage({ kind }: { kind: "customers" | "suppliers" }) {
  const { t, lang } = useI18n();
  const { data, error, loading, reload } = useApi<Party[]>(`/api/${kind}`);
  const [editing, setEditing] = useState<{ id: number | null; name: string; phone: string; address: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const isCustomer = kind === "customers";

  async function remove(p: Party) {
    if (!window.confirm(`${t("confirmDelete")} "${p.name}"?`)) return;
    try {
      await api(`/api/${kind}/${p.id}`, { method: "DELETE" });
      setActionError(null);
      await reload();
    } catch (e) {
      setActionError((e as Error).message);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>{isCustomer ? t("navCustomers") : t("navSuppliers")}</h1>
        <button className="btn primary" onClick={() => setEditing({ id: null, name: "", phone: "", address: "" })}>
          + {isCustomer ? t("addCustomer") : t("addSupplier")}
        </button>
      </div>
      <ErrorBox message={error ?? actionError} />
      <div className="card table-card">
        {loading && !data ? (
          <Empty text="…" />
        ) : !data || data.length === 0 ? (
          <Empty text={t("noRecords")} />
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t("name")}</th>
                <th>{t("phone")}</th>
                <th>{t("address")}</th>
                <th className="r">{isCustomer ? t("dueReceivable") : t("duePayable")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.phone ?? "—"}</td>
                  <td>{p.address ?? "—"}</td>
                  <td className="r">
                    <span className={`pill ${p.balance > 0 ? "orange" : "green"}`}>{money(p.balance, lang)}</span>
                  </td>
                  <td className="actions">
                    <button
                      className="link"
                      onClick={() => setEditing({ id: p.id, name: p.name, phone: p.phone ?? "", address: p.address ?? "" })}
                    >
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
        <PartyModal
          kind={kind}
          state={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await reload();
          }}
        />
      )}
    </>
  );
}

function PartyModal({
  kind,
  state,
  onClose,
  onSaved,
}: {
  kind: "customers" | "suppliers";
  state: { id: number | null; name: string; phone: string; address: string };
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { t } = useI18n();
  const [form, setForm] = useState({ name: state.name, phone: state.phone, address: state.address });
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await api(state.id ? `/api/${kind}/${state.id}` : `/api/${kind}`, {
        method: state.id ? "PUT" : "POST",
        body: form,
      });
      await onSaved();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <Modal title={kind === "customers" ? t("navCustomers") : t("navSuppliers")} onClose={onClose}>
      <form onSubmit={submit} className="form-grid">
        <ErrorBox message={error} />
        <Field label={t("name")} wide>
          <input required maxLength={160} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
        </Field>
        <Field label={t("phone")}>
          <input type="tel" maxLength={30} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field label={t("address")}>
          <input maxLength={255} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
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
