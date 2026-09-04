import { LogoMark } from '@/components/Logo';

/**
 * The depot surface, deliberately austere: square corners, hairline rules, no
 * shadows to lose in glare, and measurement fields big enough to hit wearing
 * gloves. This is the shell — the verification bench and container board land
 * with the warehouse module.
 */
export function DepotPage() {
  return (
    <div data-surface="depot" className="min-h-screen bg-bg text-ink">
      <header className="flex h-14 items-center justify-between bg-deep px-[26px]">
        <div className="flex items-center gap-3">
          <LogoMark stroke="var(--brand)" />
          <span className="text-sm font-bold uppercase tracking-[0.14em] text-ink-invert">
            Receiving station
          </span>
          <span className="tnum bg-[#2b271c] px-[9px] py-1 text-[11px] font-medium text-ink-4">
            WS-03 · Peliyagoda
          </span>
        </div>
        <div className="flex items-center gap-[9px]">
          <span className="h-[7px] w-[7px] bg-ok" />
          <span className="text-xs text-ink-4">Bench scale · dimensioner online</span>
        </div>
      </header>

      <div className="flex items-center gap-[14px] border-b border-rule bg-panel px-[26px] py-4">
        <div className="flex h-[52px] flex-grow items-center gap-3 border border-ink bg-white px-4">
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <path d="M3 7V4h3M19 7V4h-3M3 15v3h3M19 15v3h-3" stroke="var(--ink)" strokeWidth="1.6" />
            <path d="M6.5 8v6M9 8v6M11.5 8v6M14 8v6M16 8v6" stroke="var(--brand)" strokeWidth="1.4" />
          </svg>
          <span className="tnum text-base text-ink-4">
            Scan a docket, a tracking ID, or type a booking reference
          </span>
        </div>
        <button className="h-[52px] bg-deep px-[22px] text-xs font-bold uppercase tracking-[0.14em] text-ink-invert">
          Walk-in express intake
        </button>
      </div>

      <div className="p-[26px]">
        <div className="border border-rule bg-panel p-8">
          <h1 className="mb-3 text-2xl font-bold uppercase tracking-[0.04em]">Depot floor — shell</h1>
          <p className="max-w-[70ch] text-[15px] leading-[1.6] text-ink-2">
            Receive, verify, re-rate, label and load. The pricing side of this screen is already built and
            tested on the backend — <span className="tnum font-semibold">/v1/quotes/compare</span> takes a
            booked shipment and a measured one and returns the difference plus what the business is allowed
            to do about it.
          </p>
          <p className="mt-4 max-w-[70ch] text-[15px] leading-[1.6] text-ink-3">
            What lands next: tracking ID allocation on physical receipt, the verification bench wired to that
            endpoint, barcode labels, and the container loading board.
          </p>
        </div>
      </div>
    </div>
  );
}
