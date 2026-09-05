import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LabelSheet } from '@/components/depot/LabelSheet';
import { VerifyBench } from '@/components/depot/VerifyBench';
import { depot, type Label, type PieceLookup, type QueueEntry } from '@/lib/depot';
import { ApiError } from '@/lib/http';

/**
 * Requirement 3.1: package receiving and verification.
 *
 * The box under the operator's hands is in the URL — `?piece=CF-0001-001` — so
 * the scanner in the layout above can send them here, a supervisor can be given
 * a link to a specific box, and a reload does not lose the bench.
 */
export function ReceivingPage() {
  const [params, setParams] = useSearchParams();
  const trackingId = params.get('piece');

  const [piece, setPiece] = useState<PieceLookup | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refreshQueue = useCallback(() => {
    depot
      .queue()
      .then(({ entries }) => setQueue(entries))
      .catch(() => setQueue([]));
  }, []);

  useEffect(refreshQueue, [refreshQueue]);

  useEffect(() => {
    if (!trackingId) {
      setPiece(null);
      return;
    }
    let alive = true;
    depot
      .piece(trackingId)
      .then(({ piece: found }) => alive && setPiece(found))
      .catch((caught) => {
        if (!alive) return;
        setPiece(null);
        setError(caught instanceof ApiError ? caught.message : 'Could not find that box');
      });
    return () => {
      alive = false;
    };
  }, [trackingId]);

  const openPiece = (id: string) => setParams({ piece: id });
  const closePiece = () => setParams({});

  const printLabel = async (id: string) => {
    try {
      const { label } = await depot.label(id);
      setLabels((current) =>
        current.some((l) => l.trackingId === label.trackingId) ? current : [...current, label],
      );
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not build that label');
    }
  };

  const receive = async (reference: string) => {
    setError(null);
    try {
      const result = await depot.receive(reference);
      const fresh = result.received.length;
      setNotice(
        fresh > 0
          ? `${result.reference}: ${fresh} ${fresh === 1 ? 'box' : 'boxes'} received — ${result.received
              .map((p) => p.trackingId)
              .join(', ')}`
          : `${result.reference}: everything was already received.`,
      );
      refreshQueue();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not receive that shipment');
    }
  };

  const columns =
    'grid min-w-[820px] grid-cols-[130px_minmax(0,1fr)_140px_repeat(4,70px)_110px] gap-3 px-5';

  return (
    <div className="flex flex-col gap-[22px] px-5 pb-9 pt-[26px] sm:px-8">
      {error && (
        <p className="rounded-[12px] bg-alert-tint px-5 py-4 text-[14px] leading-[1.55] text-alert-ink">
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded-[12px] bg-ok-tint px-5 py-4 text-[14px] leading-[1.55] text-ok-ink">
          {notice}
        </p>
      )}

      {piece && (
        <VerifyBench
          piece={piece}
          onVerified={(result) => {
            setNotice(`${result.trackingId}: ${result.rerate.message}`);
            refreshQueue();
            void depot.piece(result.trackingId).then(({ piece: fresh }) => setPiece(fresh));
          }}
          onPrint={printLabel}
          onClose={closePiece}
        />
      )}

      {labels.length > 0 && (
        <LabelSheet
          labels={labels}
          onClear={() => setLabels([])}
          onPrinted={async () => {
            await depot.markPrinted(labels.map((l) => l.trackingId)).catch(() => undefined);
            refreshQueue();
          }}
        />
      )}

      <section className="overflow-hidden rounded-[14px] border border-rule bg-panel">
        <div className="flex items-center justify-between border-b border-rule px-5 py-4">
          <span className="text-base font-bold tracking-[-0.01em]">On the floor</span>
          <span className="tnum text-xs text-ink-4">
            {queue.length} {queue.length === 1 ? 'shipment' : 'shipments'}
          </span>
        </div>

        {queue.length === 0 ? (
          <p className="px-5 py-12 text-center text-[15px] text-ink-3">
            Nothing on the floor. Scan a docket above to receive a shipment.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <div className={`${columns} border-b border-rule bg-panel-2 py-2`}>
              {['Booking', 'Customer', 'Route', 'Pcs', 'To get', 'To weigh', 'Held', ''].map(
                (head, index) => (
                  <span
                    key={head || index}
                    className="text-[11px] font-bold text-ink-3"
                  >
                    {head}
                  </span>
                ),
              )}
            </div>

            {queue.map((entry) => (
              <div
                key={entry.bookingRef}
                className={`${columns} items-center border-b border-rule-2 py-3 last:border-b-0`}
              >
                <span className="tnum text-[13px] font-bold">{entry.bookingRef}</span>
                <span className="truncate text-[14px]">{entry.customerName}</span>
                <span className="text-[12px] text-ink-3">{entry.route}</span>
                <span className="tnum text-center text-[13px]">{entry.pieceCount}</span>
                <Count value={entry.awaitingReceipt} tone="warn" />
                <Count value={entry.awaitingMeasure} tone="brand" />
                <Count value={entry.held} tone="alert" />
                {entry.awaitingReceipt > 0 ? (
                  <button
                    type="button"
                    onClick={() => void receive(entry.bookingRef)}
                    className="h-9 rounded-[8px] bg-brand px-4 text-xs font-bold text-ink-invert"
                  >
                    Receive
                  </button>
                ) : entry.awaitingMeasure > 0 ? (
                  <span className="text-[11px] text-ink-4">scan a box</span>
                ) : (
                  <span className="text-[11px] text-ink-4">
                    {entry.readyToLabel > 0 ? `${entry.readyToLabel} to label` : '—'}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {!piece && (
        <p className="text-[13px] leading-[1.6] text-ink-4">
          Scan a tracking ID in the bar above to open the measuring bench for that box. Scan or type
          a booking reference to receive a whole shipment and issue its tracking IDs.
        </p>
      )}

      {queue.some((entry) => entry.awaitingMeasure > 0) && !piece && (
        <QuickPick queue={queue} onPick={openPiece} />
      )}
    </div>
  );
}

/**
 * A keyboard is not always to hand. When boxes are waiting to be weighed, offer
 * their IDs as buttons so the bench can be opened without typing.
 */
function QuickPick({ queue, onPick }: { queue: QueueEntry[]; onPick: (id: string) => void }) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    const waiting = queue.filter((entry) => entry.awaitingMeasure > 0).slice(0, 4);
    Promise.all(
      waiting.map((entry) =>
        Array.from({ length: entry.pieceCount }, (_, i) =>
          `CF-${entry.bookingRef.replace(/[^0-9]/g, '').slice(-4)}-${String(i + 1).padStart(3, '0')}`,
        ),
      ),
    ).then(async (guesses) => {
      const found: string[] = [];
      for (const id of guesses.flat().slice(0, 12)) {
        try {
          const { piece } = await depot.piece(id);
          if (piece.receivedAt && !piece.verified) found.push(id);
        } catch {
          // Not every derived ID exists — a partial delivery leaves gaps.
        }
      }
      if (alive) setIds(found);
    });
    return () => {
      alive = false;
    };
  }, [queue]);

  if (ids.length === 0) return null;

  return (
    <section className="rounded-[14px] border border-rule bg-panel p-5">
      <span className="text-[13px] font-semibold text-ink-3">
        Waiting for the scale
      </span>
      <div className="mt-3 flex flex-wrap gap-2">
        {ids.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onPick(id)}
            className="tnum rounded-[10px] border border-rule bg-panel-2 px-4 py-3 text-[14px] font-bold"
          >
            {id}
          </button>
        ))}
      </div>
    </section>
  );
}

function Count({ value, tone }: { value: number; tone: 'warn' | 'brand' | 'alert' }) {
  if (value === 0) return <span className="tnum text-center text-[13px] text-ink-4">—</span>;

  const classes = {
    warn: 'bg-warn-tint text-warn-ink',
    brand: 'bg-brand-tint text-brand-deep',
    alert: 'bg-alert-tint text-alert-ink',
  }[tone];

  return (
    <span className={`tnum mx-auto px-2 py-1 text-center text-[13px] font-bold ${classes}`}>
      {value}
    </span>
  );
}
