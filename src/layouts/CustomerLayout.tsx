import { Link, Outlet } from 'react-router-dom';
import { Wordmark } from '@/components/Logo';

const LINKS = [
  { label: 'Track a box', to: '/track', hash: false },
  { label: 'How it works', to: '/#how', hash: true },
  { label: 'Prices', to: '/#prices', hash: true },
];

export function CustomerLayout() {
  return (
    <div data-surface="customer" className="min-h-screen bg-bg text-ink">
      <header className="border-b border-rule-2">
        <div className="flex h-[68px] items-center justify-between gap-4 px-5 sm:px-6 md:h-[84px] md:px-14">
          <div className="flex min-w-0 items-center gap-12">
            <Link to="/" aria-label="CargoFlow home" className="min-w-0">
              <Wordmark />
            </Link>
            <nav className="hidden gap-8 md:flex">
              {LINKS.map(({ label, to, hash }) =>
                hash ? (
                  <a key={label} href={to} className="text-[15px] font-medium text-ink-2">
                    {label}
                  </a>
                ) : (
                  <Link key={label} to={to} className="text-[15px] font-medium text-ink-2">
                    {label}
                  </Link>
                ),
              )}
            </nav>
          </div>

          <a
            href="/#quote"
            className="inline-flex h-11 shrink-0 items-center whitespace-nowrap rounded-full bg-brand px-5 text-[14px] font-bold text-ink-invert md:h-12 md:px-6 md:text-[15px]"
          >
            Get a price
          </a>
        </div>

        {/* Below md the links move to their own row rather than disappearing. */}
        <nav className="flex gap-6 overflow-x-auto border-t border-rule-2 px-5 py-3 sm:px-6 md:hidden">
          {LINKS.map(({ label, to, hash }) =>
            hash ? (
              <a
                key={label}
                href={to}
                className="whitespace-nowrap text-[14px] font-medium text-ink-2"
              >
                {label}
              </a>
            ) : (
              <Link
                key={label}
                to={to}
                className="whitespace-nowrap text-[14px] font-medium text-ink-2"
              >
                {label}
              </Link>
            ),
          )}
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="bg-panel-2 px-5 py-12 sm:px-6 md:px-14 md:py-14">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="flex max-w-[400px] flex-col gap-[18px]">
            <Wordmark />
            <p className="text-[15px] leading-[1.65] text-ink-3">
              Depot · 118 Negombo Road, Peliyagoda 11600, Sri Lanka
              <br />
              Delivery hub · Unit 7, 41 Fitzgerald Road, Laverton North VIC 3026, Australia
            </p>
          </div>

          <div className="flex flex-wrap gap-10 sm:gap-16">
            <div className="flex flex-col gap-[14px]">
              <span className="text-sm font-bold">Ship</span>
              <a href="/#quote" className="text-[15px] text-ink-3">
                Get a price
              </a>
              <Link to="/track" className="text-[15px] text-ink-3">
                Track a box
              </Link>
              <a href="/#prices" className="text-[15px] text-ink-3">
                What it costs
              </a>
            </div>

            {/* Staff surfaces, linked so the other two designs are findable. */}
            <div className="flex flex-col gap-[14px]">
              <span className="text-sm font-bold">For staff</span>
              <Link to="/admin" className="text-[15px] text-ink-3">
                Admin panel
              </Link>
              <Link to="/depot" className="text-[15px] text-ink-3">
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
