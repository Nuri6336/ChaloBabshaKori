"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Logo } from "@/components/Logo";
import { ErrorBox, Field } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export default function RegisterPage() {
  const { t } = useI18n();
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ businessName: "", ownerName: "", email: "", phone: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register({ ...form, phone: form.phone || undefined });
      router.replace("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <Link href="/">
          <Logo />
        </Link>
        <h2>{t("registerTitle")}</h2>
        <ErrorBox message={error} />
        <Field label={t("businessName")} wide>
          <input required maxLength={150} value={form.businessName} onChange={set("businessName")} />
        </Field>
        <Field label={t("ownerName")} wide>
          <input required maxLength={120} value={form.ownerName} onChange={set("ownerName")} />
        </Field>
        <Field label={t("phone")} wide>
          <input type="tel" maxLength={30} value={form.phone} onChange={set("phone")} />
        </Field>
        <Field label={t("email")} wide>
          <input type="email" required autoComplete="email" value={form.email} onChange={set("email")} />
        </Field>
        <Field label={t("passwordMin")} wide>
          <input
            type="password"
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            value={form.password}
            onChange={set("password")}
          />
        </Field>
        <button className="btn primary large block" disabled={busy}>
          {t("createFreeAccount")}
        </button>
        <p className="muted center">
          {t("haveAccount")} <Link href="/login">{t("login")}</Link>
        </p>
      </form>
    </main>
  );
}
