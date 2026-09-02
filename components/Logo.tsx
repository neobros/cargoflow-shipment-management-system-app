export function LogoMark({ size = 20, stroke = 'currentColor' }: { size?: number; stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path
        d="M2.8 6.7 11 2.4l8.2 4.3v8.6L11 19.6l-8.2-4.3V6.7Z"
        stroke={stroke}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="m2.8 6.7 8.2 4.3 8.2-4.3M11 11v8.6" stroke={stroke} strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

export function Wordmark({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-[11px]">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand">
        <LogoMark stroke="var(--ink-invert)" />
      </span>
      <div className="flex flex-col gap-[3px]">
        <span className="font-display text-[21px] font-bold leading-none tracking-[-0.02em]">CargoFlow</span>
        {subtitle ? <span className="text-[11px] font-semibold leading-none text-ink-4">{subtitle}</span> : null}
      </div>
    </div>
  );
}
