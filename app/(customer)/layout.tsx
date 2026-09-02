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

        <div className="flex items-center gap-6">
          <Link href="/sign-in" className="hidden text-[15px] font-semibold text-ink sm:block">
            Sign in
          </Link>
          <Link
            href="/book"
            className="inline-flex h-12 items-center rounded-full bg-brand px-6 text-[15px] font-bold text-ink-invert"
          >
            Get a price
          </Link>
        </div>
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
              <Link href="/book" className="text-[15px] text-ink-3">
                Get a price
              </Link>
              <Link href="/prohibited" className="text-[15px] text-ink-3">
                What you can send
              </Link>
              <Link href="/packing" className="text-[15px] text-ink-3">
                How to pack
              </Link>
            </div>
            <div className="flex flex-col gap-[14px]">
              <span className="text-sm font-bold">Help</span>
              <Link href="/track" className="text-[15px] text-ink-3">
                Track a box
              </Link>
              <Link href="/schedule" className="text-[15px] text-ink-3">
                Sailing dates
              </Link>
              <Link href="/contact" className="text-[15px] text-ink-3">
                Talk to us
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
