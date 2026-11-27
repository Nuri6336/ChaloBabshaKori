export function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M8 22h8l6 24h26l6-18H20" stroke="#0b3a8f" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M26 30l4 8M34 30l2 8M42 30l0 8" stroke="#0b3a8f" strokeWidth="3" strokeLinecap="round" />
      <circle cx="26" cy="54" r="3.5" fill="#0b3a8f" />
      <circle cx="44" cy="54" r="3.5" fill="#0b3a8f" />
      <path d="M22 24L36 12l6 6 14-12" stroke="#16a34a" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M48 6h8v8" stroke="#16a34a" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ light = false, tagline = true }: { light?: boolean; tagline?: boolean }) {
  return (
    <span className="logo">
      <LogoMark />
      <span className="logo-text">
        <span className="logo-name" style={{ color: light ? "#fff" : "#0b3a8f" }}>
          ChaloBabsha<span style={{ color: "#16a34a" }}>Kori</span>
          <span style={{ color: "#16a34a" }}>.com</span>
        </span>
        {tagline && <span className="logo-tag" style={{ color: light ? "#dbe6ff" : "#1f2a44" }}>চলো ব্যবসা করি</span>}
      </span>
    </span>
  );
}
