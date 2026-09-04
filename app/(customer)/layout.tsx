import Link from 'next/link';
import { Wordmark } from '@/components/Logo';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-surface="customer" className="min-h-screen bg-bg text-ink">
      <header className="flex h-[84px] items-center justify-between border-b border-rule-2 px-6 md:px-14">
        <div className="flex items-center gap-12">
          <Link href="/" aria-label="CargoFlow home">
            <Wordmark />
          </Link>
          <nav className="hidden gap-8 md:flex">
            <Link href="/track" className="text-[15px] font-medium text-ink-2">
              Track a box
            </Link>
            <Link href="/#how" className="text-[15px] font-medium text-ink-2">
              How it works
            </Link>
            <Link href="/#prices" className="text-[15px] font-medium text-ink-2">
              Prices
            </Link>
          </nav>
        </div>

        <Link
          href="/#quote"
          className="inline-flex h-12 items-center rounded-full bg-brand px-6 text-[15px] font-bold text-ink-invert"
        >
          Get a price
        </Link>
      </header>

      <main>{children}</main>

      <footer className="bg-panel-2 px-6 py-14 md:px-14">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="flex max-w-[400px] flex-col gap-[18px]">
            <Wordmark />
            <p className="text-[15px] leading-[1.65] text-ink-3">
              Depot · 118 Negombo Road, Peliyagoda 11600, Sri Lanka
              <br />
              Delivery hub · Unit 7, 41 Fitzgerald Road, Laverton North VIC 3026, Australia
            </p>
          </div>

          <div className="flex gap-16">
            <div className="flex flex-col gap-[14px]">
              <span className="text-sm font-bold">Ship</span>
              <Link href="/#quote" className="text-[15px] text-ink-3">
                Get a price
              </Link>
              <Link href="/track" className="text-[15px] text-ink-3">
                Track a box
              </Link>
              <Link href="/#prices" className="text-[15px] text-ink-3">
                What it costs
              </Link>
            </div>

            {/* Staff surfaces, linked so the other two designs are findable. */}
            <div className="flex flex-col gap-[14px]">
              <span className="text-sm font-bold">For staff</span>
              <Link href="/admin" className="text-[15px] text-ink-3">
                Admin panel
              </Link>
              <Link href="/depot" className="text-[15px] text-ink-3">
                Depot floor
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-10 border-t border-rule pt-6 text-[13px] text-ink-4">
          In development. Sample data throughout — company details, vessel names and identifiers are
          placeholders.
        </p>
      </footer>
    </div>
  );
}
