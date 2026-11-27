"use client";

import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export default function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const { user, logout } = useAuth();

  return (
    <>
      <div className="page-head">
        <h1>{t("navSettings")}</h1>
      </div>
      <div className="card form-card">
        <dl className="kv">
          <div>
            <dt>{t("businessName")}</dt>
            <dd>{user?.businessName}</dd>
          </div>
          <div>
            <dt>{t("ownerName")}</dt>
            <dd>{user?.name}</dd>
          </div>
          <div>
            <dt>{t("email")}</dt>
            <dd>{user?.email}</dd>
          </div>
          <div>
            <dt>{t("role")}</dt>
            <dd>{user?.role}</dd>
          </div>
        </dl>
        <div className="form-grid">
          <label className="field">
            <span>{t("language")}</span>
            <select value={lang} onChange={(e) => setLang(e.target.value as "bn" | "en")}>
              <option value="bn">বাংলা</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>
        <div className="form-actions">
          <button className="btn outline" onClick={logout}>
            {t("logout")}
          </button>
        </div>
      </div>
    </>
  );
}
