import { Link } from 'react-router-dom';
import { useAsync } from '@/hooks/useAsync';
import { admin } from '@/lib/admin';

/** Header and rows share one definition, so they cannot drift apart. */
const BOOKING_COLUMNS =
  'grid min-w-[1080px] grid-cols-[150px_minmax(200px,1fr)_170px_70px_150px_110px_110px] gap-3 px-5';

const BOOKING_HEADS = [
  { label: 'Reference', align: 'left' },
  { label: 'Customer', align: 'left' },
  { label: 'Lane', align: 'left' },
  { label: 'Pcs', align: 'center' },
  { label: 'Status', align: 'left' },
  { label: 'Booked', align: 'right' },
  { label: 'Now', align: 'right' },
] as const;

const statusChip: Record<string, string> = {
  booked: 'bg-panel-2 text-ink-2',
  received: 'bg-panel-2 text-ink-2',
  verified: 'bg-ok-tint text-ok-ink',
  rerate_held: 'bg-alert-tint text-alert-ink',
  labelled: 'bg-ok-tint text-ok-ink',
  loaded: 'bg-accent-tint text-accent',
  in_transit: 'bg-warn-tint text-warn-ink',
  delivered: 'bg-ok-tint text-ok-ink',
  held: 'bg-alert-tint text-alert-ink',
};

const statusLabel: Record<string, string> = {
  booked: 'Booked',
  received: 'At the depot',
  verified: 'Checked',
  rerate_held: 'Needs approval',
  labelled: 'Labelled',
  loaded: 'In a container',
  in_transit: 'On the water',
  delivered: 'Delivered',
  held: 'On hold',
};

export function BookingsPage() {
  const { data, error, loading } = useAsync(() => admin.bookings(), []);
  const bookings = data?.bookings ?? [];

  return (
    <>
      <header className="flex h-[68px] items-center justify-between border-b border-rule bg-panel px-5 sm:px-8">
        <span className="text-[19px] font-bold tracking-[-0.015em]">Bookings</span>
        <span className="tnum text-[13px] font-medium text-ink-4">{bookings.length} shown</span>
      </header>

      <div className="flex flex-col gap-5 px-5 pb-9 pt-[26px] sm:px-8">
        {loading && <p className="text-[15px] text-ink-3">Loading…</p>}
        {error && (
          <div className="rounded-[12px] bg-alert-tint px-5 py-4 text-[14px] text-alert-ink">
            {error.message}
          </div>
        )}

        {data && (
          <div className="overflow-x-auto rounded-[14px] border border-rule bg-panel">
            <div className={`${BOOKING_COLUMNS} border-b border-rule bg-panel-2 py-3`}>
              {BOOKING_HEADS.map(({ label, align }) => (
                <span
                  key={label}
                  className={`text-[11px] font-bold text-ink-3 ${
                    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : ''
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>

            {bookings.length === 0 ? (
              <div className="px-5 py-12 text-center text-[15px] text-ink-3">
                No bookings yet. One appears here as soon as a customer completes the booking wizard.
              </div>
            ) : (
              bookings.map((booking) => (
                <div
                  key={booking.reference}
                  className={`${BOOKING_COLUMNS} items-center border-b border-rule-2 py-4 last:border-b-0`}
                >
                  <Link to={`/track?id=${booking.reference}`} className="tnum text-[13px] font-semibold">
                    {booking.reference}
                  </Link>
                  <span className="text-[14px] font-medium">{booking.customerName}</span>
                  <span className="tnum text-[13px] text-ink-3">{booking.lane}</span>
                  <span className="tnum text-center text-[13px]">{booking.pieceCount}</span>
                  <span
                    className={`inline-flex w-fit items-center rounded-[7px] px-[10px] py-[5px] text-[11px] font-bold ${
                      statusChip[booking.status] ?? 'bg-panel-2 text-ink-2'
                    }`}
                  >
                    {statusLabel[booking.status] ?? booking.status}
                  </span>
                  <span className="tnum text-right text-[13px] text-ink-3">{booking.bookedTotal}</span>
                  <span className="tnum text-right text-[13px] font-semibold">{booking.currentTotal}</span>
                </div>
              ))
            )}
          </div>
        )}

        <p className="text-[13px] text-ink-4">
          A reference opens the customer-facing tracking page for that shipment — the same view they see.
        </p>
      </div>
    </>
  );
}
