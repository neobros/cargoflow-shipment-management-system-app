import { AdjustmentActions } from '@/components/admin/AdjustmentActions';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { admin, can } from '@/lib/admin';

const stateChip: Record<string, string> = {
  awaiting_approval: 'bg-warn-tint text-warn-ink',
  approved: 'bg-ok-tint text-ok-ink',
  auto_approved: 'bg-ok-tint text-ok-ink',
  waived: 'bg-brand-tint text-brand',
  declined: 'bg-alert-tint text-alert-ink',
  settled: 'bg-panel-2 text-ink-2',
};

const stateLabel: Record<string, string> = {
  awaiting_approval: 'Waiting on customer',
  approved: 'Approved',
  auto_approved: 'Auto-approved',
  waived: 'Waived',
  declined: 'Declined',
  settled: 'Settled',
};

export function BillingPage() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useAsync(() => admin.adjustments(), []);

  const mayApprove = can(user, 'adjustments:approve');
  const mayWaive = can(user, 'adjustments:waive');
  const mayRemind = can(user, 'adjustments:remind');

  const adjustments = data?.adjustments ?? [];

  return (
    <>
      <header className="flex h-[68px] items-center justify-between border-b border-rule bg-panel px-5 sm:px-8">
        <span className="text-[19px] font-bold tracking-[-0.015em]">Invoices &amp; adjustments</span>
        <span className="text-[13px] font-medium text-ink-4">{user?.roleLabel}</span>
      </header>

      <div className="flex flex-col gap-5 px-5 pb-9 pt-[26px] sm:px-8">
        <p className="max-w-[76ch] text-[15px] leading-[1.6] text-ink-3">
          Invoices raise themselves when a booking is fully loaded. This page is only for the ones that need
          a decision.
        </p>

        {!mayApprove && (
          <div className="rounded-[12px] border border-warn bg-warn-tint px-5 py-4 text-[14px] leading-[1.6] text-warn-ink">
            Your role can see adjustments and send reminders, but cannot approve or waive them. That split is
            deliberate: the person who measures a box is never the person who decides what it costs.
          </div>
        )}

        {loading && <p className="text-[15px] text-ink-3">Loading…</p>}
        {error && (
          <div className="rounded-[12px] bg-alert-tint px-5 py-4 text-[14px] text-alert-ink">
            {error.message}
          </div>
        )}

        {data && (
          <div className="overflow-x-auto rounded-[14px] border border-rule bg-panel">
            <div className="grid min-w-[900px] grid-cols-[160px_140px_100px_100px_110px_150px_minmax(0,1fr)] gap-3 border-b border-rule bg-panel-2 px-5 py-3">
              {['Adjustment', 'Booking', 'Booked', 'Now', 'Change', 'State', 'Actions'].map((head) => (
                <span key={head} className="text-[11px] font-bold text-ink-3">
                  {head}
                </span>
              ))}
            </div>

            {adjustments.length === 0 ? (
              <div className="px-5 py-12 text-center text-[15px] text-ink-3">
                No adjustments yet. They appear here the moment the depot measures a box differently from the
                booking.
              </div>
            ) : (
              adjustments.map((adjustment) => (
                <div
                  key={adjustment.reference}
                  className="grid min-w-[900px] grid-cols-[160px_140px_100px_100px_110px_150px_minmax(0,1fr)] items-center gap-3 border-b border-rule-2 px-5 py-4 last:border-b-0"
                >
                  <span className="tnum text-[13px] font-medium">{adjustment.reference}</span>
                  <span className="tnum text-[13px]">{adjustment.bookingRef}</span>
                  <span className="tnum text-right text-[13px] text-ink-3">{adjustment.bookedTotal}</span>
                  <span className="tnum text-right text-[13px] font-semibold">
                    {adjustment.verifiedTotal}
                  </span>
                  <span className="tnum text-right text-[13px] font-bold text-alert-ink">
                    +{adjustment.difference}
                    <span className="ml-1 font-medium text-ink-4">{adjustment.differencePercent}%</span>
                  </span>
                  <span
                    className={`inline-flex w-fit items-center rounded-[7px] px-[10px] py-[5px] text-[11px] font-bold ${
                      stateChip[adjustment.state] ?? 'bg-panel-2 text-ink-2'
                    }`}
                  >
                    {stateLabel[adjustment.state] ?? adjustment.state}
                  </span>

                  {adjustment.state === 'awaiting_approval' ? (
                    <AdjustmentActions
                      reference={adjustment.reference}
                      waiting={adjustment.waiting}
                      canApprove={mayApprove}
                      canWaive={mayWaive}
                      canRemind={mayRemind}
                      onSettled={reload}
                    />
                  ) : (
                    <span className="text-[13px] text-ink-4">Raised by {adjustment.raisedBy} · settled</span>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        <div className="rounded-[14px] border border-rule bg-panel p-6">
          <h2 className="mb-4 text-base font-bold tracking-[-0.01em]">What runs by itself</h2>
          <ul className="flex list-none flex-col gap-3 p-0 text-[14px] leading-[1.6] text-ink-2">
            <li>
              A change <strong>within tolerance</strong> — 2% or A$10, whichever is greater — is absorbed
              silently and the booked price stands.
            </li>
            <li>
              A change <strong>above tolerance</strong> holds invoicing, notifies by email and SMS, and
              waits. Silence for 14 days auto-approves, and the customer is told that up front.
            </li>
            <li>
              A change <strong>downward</strong> raises a credit note and refunds without asking. Nobody
              approves being charged less.
            </li>
            <li>
              Approving on a customer&apos;s behalf is allowed but never invisible — it records who did it
              and why, and the customer is told.
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
