/**
 * The CargoFlow mark.
 *
 * A full-colour PNG (navy #013084, cyan #02D9DA) rather than the inline SVG it
 * replaced, so it cannot be recoloured per surface. On light grounds it sits on
 * its own; on dark chrome it needs a light plate behind it, or the navy
 * disappears into the background.
 */

const SRC = '/logo.png';

export function LogoMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src={SRC}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/**
 * The mark on a light plate, for dark headers and sidebars where navy on
 * near-black would vanish.
 */
export function LogoTile({ size = 36, mark = 26 }: { size?: number; mark?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-[10px] bg-white"
      style={{ width: size, height: size }}
    >
      <LogoMark size={mark} />
    </span>
  );
}

export function Wordmark({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-[10px]">
      <LogoMark size={38} />
      <div className="flex flex-col gap-[3px]">
        <span className="font-display text-[21px] font-bold leading-none tracking-[-0.02em]">CargoFlow</span>
        {subtitle ? <span className="text-[11px] font-semibold leading-none text-ink-4">{subtitle}</span> : null}
      </div>
    </div>
  );
}
