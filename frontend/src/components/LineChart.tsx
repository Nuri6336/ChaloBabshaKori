"use client";

import { useState } from "react";
import { dateLabel, money } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { TrendPoint } from "@/lib/types";

/** Dependency-free SVG area/line chart for a daily series. */
export function LineChart({ points, height = 240 }: { points: TrendPoint[]; height?: number }) {
  const { lang } = useI18n();
  const [hover, setHover] = useState<number | null>(null);
  const W = 760;
  const pad = { l: 56, r: 16, t: 16, b: 28 };
  const max = Math.max(1, ...points.map((p) => p.total));
  const niceMax = niceCeil(max);
  const innerW = W - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const x = (i: number) => pad.l + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => pad.t + innerH - (v / niceMax) * innerH;

  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.total).toFixed(1)}`).join(" ");
  const area = points.length ? `${line} L${x(points.length - 1)},${pad.t + innerH} L${x(0)},${pad.t + innerH} Z` : "";
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * niceMax);
  const labelEvery = Math.max(1, Math.ceil(points.length / 6));
  const hp = hover !== null ? points[hover] : null;

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${height}`} width="100%" role="img" aria-label="Sales trend">
        <defs>
          <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1d6bf3" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#1d6bf3" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((tv) => (
          <g key={tv}>
            <line x1={pad.l} x2={W - pad.r} y1={y(tv)} y2={y(tv)} stroke="#e5eaf3" />
            <text x={pad.l - 8} y={y(tv) + 4} textAnchor="end" fontSize="11" fill="#64708a">
              {compact(tv)}
            </text>
          </g>
        ))}
        {area && <path d={area} fill="url(#areaFill)" />}
        {line && <path d={line} fill="none" stroke="#1d6bf3" strokeWidth="2.5" strokeLinejoin="round" />}
        {points.map((p, i) => (
          <g key={p.date}>
            {i % labelEvery === 0 && (
              <text x={x(i)} y={height - 8} textAnchor="middle" fontSize="11" fill="#64708a">
                {dateLabel(p.date, lang, { day: "numeric", month: "short" })}
              </text>
            )}
            <rect
              x={x(i) - innerW / Math.max(points.length, 1) / 2}
              y={pad.t}
              width={innerW / Math.max(points.length, 1)}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          </g>
        ))}
        {hp && hover !== null && (
          <g pointerEvents="none">
            <circle cx={x(hover)} cy={y(hp.total)} r="5" fill="#fff" stroke="#1d6bf3" strokeWidth="2.5" />
            <g transform={`translate(${Math.min(Math.max(x(hover) - 60, pad.l), W - pad.r - 120)},${Math.max(y(hp.total) - 46, 2)})`}>
              <rect width="120" height="36" rx="8" fill="#fff" stroke="#d5deee" />
              <text x="60" y="15" textAnchor="middle" fontSize="11" fill="#64708a">
                {dateLabel(hp.date, lang)}
              </text>
              <text x="60" y="29" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0b1f4d">
                {money(hp.total, lang)}
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}

function niceCeil(v: number): number {
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

function compact(v: number): string {
  if (v >= 1_000_000) return `${v / 1_000_000}M`;
  if (v >= 1000) return `${v / 1000}K`;
  return String(v);
}
