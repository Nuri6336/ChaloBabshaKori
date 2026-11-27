export function money(n: number | null | undefined, lang: "bn" | "en"): string {
  const fmt = new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-BD", { maximumFractionDigits: 2 });
  return `৳ ${fmt.format(n ?? 0)}`;
}

export function num(n: number | null | undefined, lang: "bn" | "en"): string {
  return new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-BD").format(n ?? 0);
}

export function dateLabel(iso: string, lang: "bn" | "en", opts?: Intl.DateTimeFormatOptions): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return new Intl.DateTimeFormat(
    lang === "bn" ? "bn-BD" : "en-GB",
    opts ?? { day: "numeric", month: "short", year: "numeric" },
  ).format(d);
}

export function isoDate(d: Date): string {
  const p = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function monthStart(d = new Date()): string {
  return isoDate(new Date(d.getFullYear(), d.getMonth(), 1));
}

export function today(): string {
  return isoDate(new Date());
}
