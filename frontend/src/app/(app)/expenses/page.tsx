"use client";

import { useState, type FormEvent } from "react";
import { RangePicker, defaultRange } from "@/components/RangePicker";
import { Empty, ErrorBox, Field, Modal } from "@/components/ui";
import { api, qs } from "@/lib/api";
import { dateLabel, money, today } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import type { Expense } from "@/lib/types";

interface Form {
  id: number | null;
  title: string;
  category: string;
  amount: string;
  expenseDate: string;
  note: string;
}

const blank = (): Form => ({ id: null, title: "", category: "", amount: "", expenseDate: today(), note: "" });

export default function ExpensesPage() {
  const { t, lang } = useI18n();
  const [range, setRange] = useState(defaultRange());
  const { data, error, loading, reload } = useApi<Expense[]>(`/api/expenses${qs(range)}`);
  const [editing, setEditing] = useState<Form | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const total = (data ?? []).reduce((s, e) => s + e.amount, 0);

  async function remove(e: Expense) {
    if (!window.confirm(`${t("confirmDelete")} "${e.title}"?`)) return;
    try {
      await api(`/api/expenses/${e.id}`, { method: "DELETE" });
      await reload();
    } catch (err) {
      setActionError((err as Error).message);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>{t("navExpenses")}</h1>
        <div className="head-actions">
          <RangePicker value={range} onChange={setRange} />
          <button className="btn primary" onClick={() => setEditing(blank())}>
            + {t("addExpense")}
          </button>
        </div>
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
                <th>{t("date")}</th>
                <th>{t("title")}</th>
                <th>{t("category")}</th>
                <th className="r">{t("amount")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((e) => (
                <tr key={e.id}>
                  <td>{dateLabel(e.expenseDate, lang)}</td>
                  <td>{e.title}</td>
                  <td>{e.category ?? "—"}</td>
                  <td className="r">{money(e.amount, lang)}</td>
                  <td className="actions">
                    <button
                      className="link"
                      onClick={() =>
                        setEditing({
                          id: e.id,
                          title: e.title,
                          category: e.category ?? "",
                          amount: String(e.amount),
                          expenseDate: e.expenseDate,
                          note: e.note ?? "",
                        })
                      }
                    >
                      {t("edit")}
                    </button>
                    <button className="link danger" onClick={() => remove(e)}>
                      {t("delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>{t("total")}</td>
                <td className="r">{money(total, lang)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
      {editing && (
        <ExpenseModal
          initial={editing}
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

function ExpenseModal({ initial, onClose, onSaved }: { initial: Form; onClose: () => void; onSaved: () => Promise<void> }) {
  const { t } = useI18n();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await api(form.id ? `/api/expenses/${form.id}` : "/api/expenses", {
        method: form.id ? "PUT" : "POST",
        body: {
          title: form.title,
          category: form.category,
          amount: Number(form.amount),
          expenseDate: form.expenseDate,
          note: form.note,
        },
      });
      await onSaved();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <Modal title={t("addExpense")} onClose={onClose}>
      <form onSubmit={submit} className="form-grid">
        <ErrorBox message={error} />
        <Field label={t("title")} wide>
          <input required maxLength={160} value={form.title} onChange={set("title")} autoFocus />
        </Field>
        <Field label={t("category")}>
          <input maxLength={80} value={form.category} onChange={set("category")} />
        </Field>
        <Field label={t("amount")}>
          <input type="number" min="0.01" step="0.01" required value={form.amount} onChange={set("amount")} />
        </Field>
        <Field label={t("date")}>
          <input type="date" required value={form.expenseDate} onChange={set("expenseDate")} />
        </Field>
        <Field label={t("note")}>
          <input maxLength={255} value={form.note} onChange={set("note")} />
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
