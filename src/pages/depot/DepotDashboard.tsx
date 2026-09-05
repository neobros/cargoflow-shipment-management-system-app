import { Link } from 'react-router-dom';
import { useAsync } from '@/hooks/useAsync';
import { depot, type DepotOverview, type QueueEntry } from '@/lib/depot';

const when = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

const EVENT_LABEL: Record<string, string> = {
  booked: 'Booked',
  received: 'Received',
  measured: 'Measured',
  rerated: 'Re-rated',
  approved: 'Approved',
  labelled: 'Labelled',
  loaded: 'Loaded',
  sealed: 'Sealed',
  delivered: 'Delivered',
  held: 'Held',
};

/**
 * The warehouse dashboard — the first screen of a shift.
 *
 * It answers one question before anything else: what is waiting, and in which
 * stage. The four counts are the four things a box can be waiting for, and each
 * is a link to the work rather than a number to admire.
 */
export function DepotDashboard() {
  const { data, error, loading } = useAsync(() => depot.overview(), []);
  const queue = useAsync(() => depot.queue(), []);

  return (
    <div className="flex flex-col gap-[22px] px-5 pb-9 pt-[26px] sm:px-8">
      {loading && <p className="text-[15px] text-ink-3">Loading the floor…</p>}
      {error && (
        <p className="rounded-[12px] bg-alert-tint px-5 py-4 text-[14px] text-alert-ink">
          {error.message}
        </p>
      )}

      {data && (
        <>
          <Counts counts={data.counts} />

          <div className="grid gap-[22px] xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="flex flex-col gap-[22px]">
              <Held pieces={data.heldPieces} />
              <Floor entries={queue.data?.entries ?? []} />
            </div>

            <div className="flex flex-col gap-[22px]">
              <Containers containers={data.openContainers} />
              <Activity events={data.recentEvents} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Counts({ counts }: { counts: DepotOverview['counts'] }) {
  const tiles = [
    {
      label: 'To receive',
      value: counts.awaitingReceipt,
      note: 'booked, not yet here',
      urgent: false,
    },
    {
      label: 'To weigh',
      value: counts.awaitingMeasure,
      note: 'here, not yet measured',
      urgent: false,
    },
    {
      label: 'Held',
      value: counts.held,
      note: 'over tolerance, awaiting billing',
      urgent: counts.held > 0,
    },
    {
      label: 'Ready to load',
      value: counts.readyToLabel,
      note: 'checked and labelled',
      urgent: false,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map((tile) => (
        <Link
          key={tile.label}
          to="/admin/depot/receiving"
          className={`flex flex-col gap-3 rounded-[14px] border bg-panel p-5 ${
            tile.urgent ? 'border-alert' : 'border-rule'
          }`}
        >
          <span
            className={`text-[13px] font-semibold ${tile.urgent ? 'text-alert-ink' : 'text-ink-3'}`}
          >
            {tile.label}
          </span>
          <span
            className={`tnum text-[32px] font-bold leading-none ${tile.urgent ? 'text-alert-ink' : ''}`}
          >
            {tile.value}
          </span>
          <span className={`text-xs font-medium ${tile.urgent ? 'text-alert' : 'text-ink-4'}`}>
            {tile.note}
          </span>
        </Link>
      ))}
    </div>
  );
}

function Held({ pieces }: { pieces: DepotOverview['heldPieces'] }) {
  if (pieces.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-[14px] border border-alert bg-panel">
      <div className="border-b border-rule bg-alert-tint px-5 py-4">
        <span className="text-base font-bold text-alert-ink">
          Do not load — {pieces.length} {pieces.length === 1 ? 'box' : 'boxes'} held
        </span>
        <p className="mt-1 text-[13px] leading-[1.55] text-alert-ink">
          Measured over tolerance. Billing has to settle the price before these can go in a
          container.
        </p>
      </div>

      <div className="overflow-x-auto">
        {pieces.map((piece) => (
          <div
            key={piece.trackingId}
            className="grid min-w-[600px] grid-cols-[140px_130px_minmax(0,1fr)_170px] items-center gap-3 border-b border-rule-2 px-5 py-[15px] last:border-b-0"
          >
            <span className="tnum text-[13px] font-semibold">{piece.trackingId}</span>
            <span className="tnum text-[13px] text-ink-3">{piece.bookingRef}</span>
            <span className="truncate text-sm text-ink-2">{piece.consignee}</span>
            <span className="tnum text-right text-[13px]">
              {piece.declaredVolume} → {piece.verifiedVolume} m³
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Containers({ containers }: { containers: DepotOverview['openContainers'] }) {
  return (
    <section className="overflow-hidden rounded-[14px] border border-rule bg-panel">
      <div className="border-b border-rule px-5 py-4">
        <span className="text-base font-bold tracking-[-0.01em]">Open containers</span>
      </div>

      {containers.length === 0 ? (
        <p className="px-5 py-10 text-center text-[14px] text-ink-3">
          None open. A supervisor opens the next one.
        </p>
      ) : (
        containers.map((container) => (
          <div key={container.containerNumber} className="border-b border-rule-2 px-5 py-4 last:border-b-0">
            <div className="flex items-baseline justify-between gap-3">
              <span className="tnum text-[13px] font-semibold">{container.containerNumber}</span>
              <span
                className={`tnum text-xs font-medium ${
                  container.hoursToCutOff < 24 ? 'text-alert-ink' : 'text-ink-4'
                }`}
              >
                {container.hoursToCutOff < 0
                  ? 'cut-off passed'
                  : `cut-off in ${container.hoursToCutOff}h`}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-3">
              {container.destination} · {container.vessel} {container.voyage}
            </p>
            <div className="mt-[10px] h-[6px] overflow-hidden rounded-full bg-panel-2">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${Math.min(container.fillPercent, 100)}%` }}
              />
            </div>
            <p className="tnum mt-[6px] text-[11px] text-ink-4">
              {container.fillPercent}% · {container.pieceCount} boxes
            </p>
          </div>
        ))
      )}
    </section>
  );
}

function Floor({ entries }: { entries: QueueEntry[] }) {
  const columns = 'grid min-w-[700px] grid-cols-[130px_minmax(0,1fr)_140px_repeat(3,70px)] gap-3 px-5';

  return (
    <section className="overflow-hidden rounded-[14px] border border-rule bg-panel">
      <div className="flex items-center justify-between border-b border-rule px-5 py-4">
        <span className="text-base font-bold tracking-[-0.01em]">Shipments on the floor</span>
        <Link to="/admin/depot/receiving" className="text-[13px] font-bold text-brand">
          Open the bench →
        </Link>
      </div>

      {entries.length === 0 ? (
        <p className="px-5 py-12 text-center text-[15px] text-ink-3">
          Nothing on the floor. Scan a docket above to receive a shipment.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <div className={`${columns} border-b border-rule bg-panel-2 py-3`}>
            {['Booking', 'Customer', 'Route', 'Pcs', 'Weigh', 'Held'].map((head) => (
              <span key={head} className="text-[11px] font-bold text-ink-3">
                {head}
              </span>
            ))}
          </div>

          {entries.map((entry) => (
            <div key={entry.bookingRef} className={`${columns} items-center border-b border-rule-2 py-[15px] last:border-b-0`}>
              <span className="tnum text-[13px] font-semibold">{entry.bookingRef}</span>
              <span className="truncate text-sm text-ink-2">{entry.customerName}</span>
              <span className="text-[13px] text-ink-3">{entry.route}</span>
              <span className="tnum text-center text-[13px]">{entry.pieceCount}</span>
              <span className="tnum text-center text-[13px] text-ink-3">
                {entry.awaitingMeasure || '—'}
              </span>
              <span
                className={`tnum text-center text-[13px] ${
                  entry.held > 0 ? 'font-bold text-alert-ink' : 'text-ink-4'
                }`}
              >
                {entry.held || '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Activity({ events }: { events: DepotOverview['recentEvents'] }) {
  return (
    <section className="overflow-hidden rounded-[14px] border border-rule bg-panel">
      <div className="border-b border-rule px-5 py-4">
        <span className="text-base font-bold tracking-[-0.01em]">Last on this floor</span>
      </div>

      {events.length === 0 ? (
        <p className="px-5 py-10 text-center text-[14px] text-ink-3">Nothing yet today.</p>
      ) : (
        events.map((event, index) => (
          <div
            key={`${event.pieceId}-${event.at}-${index}`}
            className="border-b border-rule-2 px-5 py-4 last:border-b-0"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="tnum text-[13px] font-semibold">{event.pieceId}</span>
              <span className="rounded-[7px] bg-panel-2 px-[10px] py-[3px] text-[11px] font-bold text-ink-3">
                {EVENT_LABEL[event.code] ?? event.code}
              </span>
            </div>
            <p className="mt-[6px] text-xs leading-[1.5] text-ink-3">{event.detail}</p>
            <p className="tnum mt-[6px] text-[11px] text-ink-4">
              {event.actor} · {when(event.at)}
            </p>
          </div>
        ))
      )}
    </section>
  );
}
