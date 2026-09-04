import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { QuoteWidget } from '@/components/customer/QuoteWidget';

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

const prices: [string, string, string, string][] = [
  ['Shipping', 'Each cubic metre / kilo', '385.00', '9.80'],
  ['Handling & wrapping', 'Each box', '12.00', '12.00'],
  ['Customs clearance', 'Each shipment', '45.00', '45.00'],
  ['Cover, if you want it', 'What you say it is worth', '1.5%', '1.5%'],
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
      <section
        id="quote"
        className="grid gap-16 px-6 py-16 md:px-14 md:py-20 lg:grid-cols-[minmax(0,1fr)_500px] lg:gap-20"
      >
        <div className="flex flex-col gap-7 pt-2">
          <span className="inline-flex w-fit items-center gap-[9px] rounded-full bg-brand-tint px-4 py-[9px]">
            <span className="h-[7px] w-[7px] rounded-full bg-ok" />
            <span className="text-[13px] font-bold text-brand-deep">
              Sri Lanka to Australia · sea &amp; air
            </span>
          </span>

          <h1 className="font-display text-[clamp(44px,7vw,68px)] font-extrabold leading-[1.02] tracking-[-0.035em] text-balance">
            Send your boxes home for less.
          </h1>

          <p className="max-w-[30ch] text-[19px] leading-[1.6] text-ink-2">
            Get a price in twenty seconds. Drop your boxes at our Colombo depot. We weigh every one and tell
            you the real price before we charge you a cent.
          </p>

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

      <section id="how" className="px-6 py-20 md:px-14">
        <h2 className="mb-11 max-w-[20ch] font-display text-[clamp(30px,4vw,42px)] font-bold leading-[1.06] tracking-[-0.03em]">
          Three steps, and we do the hard part
        </h2>

        <div className="grid gap-[26px] md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.n} className={`flex flex-col gap-5 rounded-[24px] p-[34px] ${step.tint}`}>
              <span
                className={`flex h-[52px] w-[52px] items-center justify-center rounded-full ${step.dot} font-display text-[21px] font-extrabold text-ink-invert`}
              >
                {step.n}
              </span>
              <h3
                className={`font-display text-[25px] font-bold leading-[1.12] tracking-[-0.02em] ${step.ink}`}
              >
                {step.title}
              </h3>
              <p className={`text-base leading-[1.6] ${step.ink}`}>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-6 mb-20 grid items-center gap-10 rounded-[28px] bg-deep p-10 md:mx-14 md:p-14 lg:grid-cols-[minmax(0,1fr)_560px]">
        <div className="flex flex-col gap-[14px]">
          <h2 className="font-display text-[clamp(28px,3.5vw,36px)] font-bold leading-[1.08] tracking-[-0.03em] text-white">
            Already sent something?
          </h2>
          <p className="text-[17px] leading-[1.55] text-[#9cc5c0]">
            Track one box or a whole booking. No account, no password — just the number on your label.
          </p>
        </div>
        <form action="/track" className="flex gap-3">
          <input
            name="id"
            placeholder="CF-8817-001"
            aria-label="Tracking number"
            className="tnum h-16 flex-grow rounded-[16px] bg-panel px-[22px] text-[17px] text-ink"
          />
          <button
            type="submit"
            className="h-16 rounded-[16px] bg-alert px-8 text-[17px] font-bold text-ink-invert"
          >
            Track it
          </button>
        </form>
      </section>

      <section id="prices" className="px-6 pb-20 md:px-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-[clamp(30px,4vw,42px)] font-bold leading-[1.06] tracking-[-0.03em]">
            What you pay
          </h2>
          <span className="text-[15px] font-medium text-ink-3">Colombo → Melbourne · from 01 Sep 2026</span>
        </div>

        <div className="overflow-hidden rounded-[22px] border border-rule">
          <div className="grid grid-cols-[2.2fr_1.6fr_1fr_1fr] bg-panel-2 px-6 py-[18px] md:px-[30px]">
            <span className="text-[13px] font-bold text-ink-3">Charge</span>
            <span className="hidden text-[13px] font-bold text-ink-3 sm:block">Worked out from</span>
            <span className="text-right text-[13px] font-bold text-ink-3">By sea</span>
            <span className="text-right text-[13px] font-bold text-ink-3">By air</span>
          </div>
          {prices.map(([charge, basis, sea, air]) => (
            <div
              key={charge}
              className="grid grid-cols-[2.2fr_1.6fr_1fr_1fr] items-center border-t border-rule-2 px-6 py-[22px] md:px-[30px]"
            >
              <span className="text-[17px] font-semibold">{charge}</span>
              <span className="hidden text-[15px] text-ink-3 sm:block">{basis}</span>
              <span className="tnum text-right text-[17px] font-bold">{sea}</span>
              <span className="tnum text-right text-[17px] font-bold">{air}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[15px] text-ink-4">
          Australian dollars, before 10% GST. Smallest we charge for is 0.10 m³.{' '}
          <Link to="/track" className="font-semibold">
            Track a shipment →
          </Link>
        </p>
      </section>
    </>
  );
}
