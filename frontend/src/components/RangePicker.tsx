"use client";

import { isoDate, monthStart, today } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export interface Range {
  from: string;
  to: string;
}

export function defaultRange(): Range {
  return { from: monthStart(), to: today() };
}

export function RangePicker({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  const { t } = useI18n();
  const now = new Date();

  const presets: { label: string; range: Range }[] = [
    { label: t("thisMonth"), range: defaultRange() },
    {
      label: t("lastMonth"),
      range: {
        from: isoDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        to: isoDate(new Date(now.getFullYear(), now.getMonth(), 0)),
      },
    },
    { label: t("last30"), range: { from: isoDate(new Date(now.getTime() - 29 * 86400000)), to: today() } },
    { label: t("thisYear"), range: { from: isoDate(new Date(now.getFullYear(), 0, 1)), to: today() } },
  ];

  return (
    <div className="range">
      <select
        aria-label={t("period")}
        value=""
        onChange={(e) => {
          const p = presets[Number(e.target.value)];
          if (p) onChange(p.range);
        }}
      >
        <option value="">{t("period")}</option>
        {presets.map((p, i) => (
          <option key={p.label} value={i}>
            {p.label}
          </option>
        ))}
      </select>
      <input type="date" value={value.from} max={value.to} onChange={(e) => e.target.value && onChange({ ...value, from: e.target.value })} />
      <span>–</span>
      <input type="date" value={value.to} min={value.from} onChange={(e) => e.target.value && onChange({ ...value, to: e.target.value })} />
    </div>
  );
}
