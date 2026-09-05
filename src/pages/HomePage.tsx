import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeDashboard } from '@/components/customer/HomeDashboard';
import { QuoteWidget } from '@/components/customer/QuoteWidget';
import { useAsync } from '@/hooks/useAsync';
import { api } from '@/lib/api';

const promises = ['No surprise invoices', 'Sailings every fortnight', 'Door to door, Australia wide'];

const steps = [
  {
    n: 1,
    title: 'Book it online',
    body: 'Choose your boxes, enter rough sizes and weights, add who is sending and who receives. Four minutes, and you pay the estimate.',
    tint: 'bg-brand-tint',
    dot: 'bg-brand',
    ink: 'text-brand-deep',
  },
  {
    n: 2,
    title: 'We weigh and check',
    body: 'Every box goes on a certified scale and gets its own barcode. If the real size differs from yours, we send you the new price with photos — and wait for your yes.',
    tint: 'bg-alert-tint',
    dot: 'bg-alert',
    ink: 'text-alert-ink',
  },
  {
    n: 3,
    title: 'It sails, then it arrives',
    body: 'Your boxes are loaded into a numbered container on a named ship. Follow every stage from your phone, right up to the knock on the door.',
    tint: 'bg-warn-tint',
    dot: 'bg-warn',
    ink: 'text-warn-ink',
  },
];


export function HomePage() {
  const { hash } = useLocation();

  // A router has no browser anchor behaviour of its own, so #quote and #prices
  // have to be scrolled to by hand.
  useEffect(() => {
    if (!hash) return;
    document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash]);

  return (
    <>
      <HomeDashboard />

      <section
        id="quote"
        className="grid gap-10 px-5 py-12 sm:px-6 md:px-14 md:py-20 lg:grid-cols-[minmax(0,1fr)_500px] lg:gap-20"
      >
        <div className="flex flex-col gap-7 pt-2">
          <span className="inline-flex w-fit items-center gap-[9px] rounded-full bg-brand-tint px-4 py-[9px]">
            <span className="h-[7px] w-[7px] rounded-full bg-ok" />
            <span className="text-[13px] font-bold text-brand-deep">
              Sri Lanka to Australia · sea &amp; air
            </span>
          </span>

          <h1 className="font-display text-[clamp(32px,7vw,68px)] font-extrabold leading-[1.02] tracking-[-0.035em] text-balance">
            Send your boxes home for less.
          </h1>

          <p className="max-w-[34ch] text-[17px] leading-[1.6] text-ink-2 sm:text-[19px]">
            See what it costs before you commit — no account needed for a price. Drop your boxes at our
            Colombo depot, and we weigh every one and tell you the real price before we charge you a
            cent.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/book"
              className="flex h-[58px] items-center justify-center rounded-full bg-brand px-8 text-[17px] font-bold text-ink-invert"
            >
              Send a shipment
            </Link>
            <Link
              to="/track"
              className="flex h-[58px] items-center justify-center gap-2 rounded-full border-2 border-rule bg-panel px-7 text-[17px] font-bold text-ink-2"
            >
              Track a box
              <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path
                  d="M3 9h12m-5-5 5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>

          <ul className="mt-1 flex list-none flex-wrap gap-3 p-0">
            {promises.map((promise) => (
              <li
                key={promise}
                className="inline-flex items-center gap-[10px] rounded-full border border-rule bg-panel px-[18px] py-3"
              >
                <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path
                    d="m3.6 9.3 3.3 3.4 7.5-7.6"
                    stroke="var(--ok)"
                    strokeWidth="2.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-sm font-semibold">{promise}</span>
              </li>
            ))}
          </ul>
        </div>

        <QuoteWidget />
      </section>

      <section id="how" className="px-5 py-14 sm:px-6 md:px-14 md:py-20">
        <h2 className="mb-11 max-w-[20ch] font-display text-[clamp(30px,4vw,42px)] font-bold leading-[1.06] tracking-[-0.03em]">
          Three steps, and we do the hard part
        </h2>

        <div className="grid gap-[18px] sm:gap-[26px] md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.n} className={`flex flex-col gap-4 rounded-[24px] p-7 sm:gap-5 sm:p-[34px] ${step.tint}`}>
              <span
                className={`flex h-[52px] w-[52px] items-center justify-center rounded-full ${step.dot} font-display text-[21px] font-extrabold text-ink-invert`}
              >
                {step.n}
              </span>
              <h3
                className={`font-display text-[22px] font-bold leading-[1.12] tracking-[-0.02em] sm:text-[25px] ${step.ink}`}
              >
                {step.title}
              </h3>
              <p className={`text-base leading-[1.6] ${step.ink}`}>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="prices" className="px-5 pb-14 sm:px-6 md:px-14 md:pb-20">
        <PriceTable />
      </section>

    </>
  );
}

/**
 * The published rates, read from the same rate card the engine prices on.
 *
 * It used to be a hardcoded array, which is exactly why it still advertised
 * cargo cover after the charge was removed: nothing tied the figures on this
 * page to the ones a customer is actually billed.
 */
function PriceTable() {
  const { data } = useAsync(() => api.reference(), []);

  if (!data) {
    return (
      <>
        <h2 className="mb-8 font-display text-[clamp(30px,4vw,42px)] font-bold leading-[1.06] tracking-[-0.03em]">
          What you pay
        </h2>
        <p className="text-[15px] text-ink-3">Loading today's rates…</p>
      </>
    );
  }

  const lane = data.lanes[0];
  const sea = lane?.services.find((service) => service.service === 'sea_lcl');
  const air = lane?.services.find((service) => service.service === 'air_express');

  const rows: [string, string, string, string][] = [
    [
      'Shipping',
      `Each ${sea?.unit ?? 'm³'} by sea, each ${air?.unit ?? 'kg'} by air`,
      sea?.ratePerUnit ?? '—',
      air?.ratePerUnit ?? '—',
    ],
    ['Handling & wrapping', 'Each box', data.surcharges.handlingPerPiece, data.surcharges.handlingPerPiece],
    ['Customs clearance', 'Each shipment', data.surcharges.customsClearance, data.surcharges.customsClearance],
    [
      'Oversize box',
      'Over 1.2 m or 45 kg',
      data.surcharges.oversizePiece,
      data.surcharges.oversizePiece,
    ],
  ];

  const columns =
    'grid grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 px-5 sm:grid-cols-[2.2fr_1.6fr_1fr_1fr] sm:px-6 md:px-[30px]';

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-[clamp(30px,4vw,42px)] font-bold leading-[1.06] tracking-[-0.03em]">
          What you pay
        </h2>
        <span className="text-[15px] font-medium text-ink-3">
          {lane ? `${lane.from} → ${lane.to}` : ''} · rate card v{data.rateCardVersion}
        </span>
      </div>

      <div className="overflow-hidden rounded-[22px] border border-rule">
        <div className={`${columns} bg-panel-2 py-[18px]`}>
          <span className="text-[13px] font-bold text-ink-3">Charge</span>
          <span className="hidden text-[13px] font-bold text-ink-3 sm:block">Worked out from</span>
          <span className="text-right text-[13px] font-bold text-ink-3">By sea</span>
          <span className="text-right text-[13px] font-bold text-ink-3">By air</span>
        </div>

        {rows.map(([charge, basis, bySea, byAir]) => (
          <div key={charge} className={`${columns} items-center border-t border-rule-2 py-5 sm:py-[22px]`}>
            <span className="text-[15px] font-semibold sm:text-[17px]">{charge}</span>
            <span className="hidden text-[15px] text-ink-3 sm:block">{basis}</span>
            <span className="tnum text-right text-[15px] font-bold sm:text-[17px]">{bySea}</span>
            <span className="tnum text-right text-[15px] font-bold sm:text-[17px]">{byAir}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[15px] leading-[1.6] text-ink-4">
        Australian dollars, before {data.taxPercent}% GST. Smallest we charge for is{' '}
        {sea?.minimum ?? '0.10 m³'}.{' '}
        <Link to="/book" className="font-semibold">
          Send a shipment →
        </Link>
      </p>
    </>
  );
}
