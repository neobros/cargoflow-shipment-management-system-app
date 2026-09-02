import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Operations overview' };

/**
 * The admin home is a queue of things the system could not settle by itself,
 * not a metrics wall. It is the only screen an operator needs open all day.
 *
 * The exception rows below are still placeholders — the bookings, adjustments
 * and notifications modules land next, and this page reads from them then.
 */

const kpis = [
  { label: 'Booked today', value: '34', note: '26 online · 8 walk-in' },
  { label: 'Awaiting check', value: '62', note: 'pieces at the depot' },
  { label: 'Unapproved re-rates', value: '11', note: 'A$1,284.30 held back', urgent: true },
  { label: 'Next container', value: '86.3%', note: 'closes in 8 days' },
  { label: 'Invoiced this month', value: '42.7k', note: 'A$2,410 overdue' },
];

const exceptions = [
  ['Re-rate', 'alert', 'BK-26-8817', '+A$41.75 sent to N. Perera, no reply yet', '1d 5h', 'Call them'],
  ['Blocked', 'alert', 'BK-26-9042', 'Walk-in has no receiver address — cannot load or clear', '6h', 'Resend link'],
  ['Capacity', 'warn', 'CFLU 482 9317', '86.3% full with 3 unapproved bookings still to load', '8d', 'Open it'],
  ['Notify', 'warn', 'BK-26-8790', 'SMS bounced twice — number not reachable', '2d', 'Fix number'],
  ['Disputed', 'alert', 'BK-26-8756', 'Customer rejected the re-rate, wants a re-measure', '3h', 'Re-measure'],
] as const;

export default function AdminOverview() {
  return (
    <>
      <header className="flex h-[68px] items-center justify-between border-b border-rule bg-panel px-8">
        <span className="text-[19px] font-bold tracking-[-0.015em]">Operations overview</span>
        <span className="text-[13px] font-medium text-ink-4">02 Sep · 15:04</span>
      </header>

      <div className="flex flex-col gap-[22px] px-8 pb-9 pt-[26px]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className={`flex flex-col gap-3 rounded-[14px] border bg-panel p-5 ${
                kpi.urgent ? 'border-alert' : 'border-rule'
              }`}
            >
              <span className={`text-[13px] font-semibold ${kpi.urgent ? 'text-alert-ink' : 'text-ink-3'}`}>
                {kpi.label}
              </span>
              <span className={`tnum text-[32px] font-bold leading-none ${kpi.urgent ? 'text-alert-ink' : ''}`}>
                {kpi.value}
              </span>
              <span className={`text-xs font-medium ${kpi.urgent ? 'text-alert' : 'text-ink-4'}`}>
                {kpi.note}
              </span>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-[14px] border border-rule bg-panel">
          <div className="flex items-center justify-between border-b border-rule px-[22px] py-[18px]">
            <div className="flex items-center gap-[11px]">
              <span className="text-base font-bold tracking-[-0.01em]">Needs a person</span>
              <span className="inline-flex h-[21px] min-w-[22px] items-center justify-center rounded-full bg-alert-tint px-[7px] text-xs font-bold text-alert-ink">
                {exceptions.length}
              </span>
            </div>
            <span className="hidden text-[13px] text-ink-4 md:block">
              Anything the system could not settle by itself
            </span>
          </div>

          {exceptions.map(([type, tone, ref, what, waiting, action]) => (
            <div
              key={ref}
              className="grid grid-cols-[110px_150px_minmax(0,1fr)_70px_110px] items-center gap-[14px] border-b border-rule-2 px-[22px] py-[15px] last:border-b-0"
            >
              <span
                className={`inline-flex w-fit items-center gap-[7px] rounded-[7px] px-[10px] py-[5px] ${
                  tone === 'alert' ? 'bg-alert-tint' : 'bg-warn-tint'
                }`}
              >
                <span
                  className={`h-[5px] w-[5px] rounded-full ${tone === 'alert' ? 'bg-alert' : 'bg-warn'}`}
                />
                <span
                  className={`text-[11px] font-bold ${
                    tone === 'alert' ? 'text-alert-ink' : 'text-warn-ink'
                  }`}
                >
                  {type}
                </span>
              </span>
              <span className="tnum text-[13px] font-medium">{ref}</span>
              <span className="text-sm text-ink-2">{what}</span>
              <span className="tnum text-right text-[13px] font-medium">{waiting}</span>
              <span className="text-right text-[13px] font-bold text-brand">{action}</span>
            </div>
          ))}
        </div>

        <p className="text-[13px] text-ink-4">
          Figures are placeholders. This page reads from the bookings, adjustments and notifications modules
          once they land — the pricing engine and quote API are already live.
        </p>
      </div>
    </>
  );
}
