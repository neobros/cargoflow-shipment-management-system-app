import { useCallback, useEffect, useRef, useState } from 'react';
import { LoginForm } from '@/components/admin/LoginForm';
import { LabelSheet } from '@/components/depot/LabelSheet';
import { VerifyBench } from '@/components/depot/VerifyBench';
import { WalkInPanel } from '@/components/depot/WalkInPanel';
import { LogoTile } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { depot, type Label, type PieceLookup, type QueueEntry } from '@/lib/depot';
import { ApiError } from '@/lib/http';

/**
 * The receiving station.
 *
 * Deliberately austere: square corners, hairline rules, no shadows to lose in
 * glare, controls big enough to hit wearing gloves. Everything starts at the
 * scan box, because on the floor the scanner is the only input device — it
 * types an ID and presses Enter, so that box keeps focus after every action.
 */
export function DepotPage() {
  const { user, checking } = useAuth();
  const [scan, setScan] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [piece, setPiece] = useState<PieceLookup | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const scanBox = useRef<HTMLInputElement>(null);

  const refreshQueue = useCallback(() => {
    depot
      .queue()
      .then(({ entries }) => setQueue(entries))
      .catch(() => setQueue([]));
  }, []);

  useEffect(() => {
    if (user) refreshQueue();
  }, [user, refreshQueue]);

  /**
   * One box, one scan. A tracking ID opens the bench; anything else is treated
   * as a booking reference and received — which is what an operator holding a
   * delivery docket actually wants to happen.
   */
  const submitScan = async (raw: string) => {
    const value = raw.trim().toUpperCase();
    if (!value) return;

    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      if (/^CF-\d+-\d+$/.test(value)) {
        const { piece: found } = await depot.piece(value);
        setPiece(found);
      } else {
        const result = await depot.receive(value);
        const fresh = result.received.length;
        const already = result.alreadyReceived.length;
        setNotice(
          fresh > 0
            ? `${result.reference}: received ${fresh} ${fresh === 1 ? 'box' : 'boxes'} — ${result.received
                .map((p) => p.trackingId)
                .join(', ')}${already ? `. ${already} already had labels.` : ''}`
            : `${result.reference}: all ${already} ${
                already === 1 ? 'box was' : 'boxes were'
              } already received.`,
        );
        setPiece(null);
        refreshQueue();
      }
      setScan('');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'That scan did not work');
      setPiece(null);
    } finally {
      setBusy(false);
      scanBox.current?.focus();
    }
  };

  const printLabel = async (trackingId: string) => {
    try {
      const { label } = await depot.label(trackingId);
      setLabels((current) =>
        current.some((l) => l.trackingId === label.trackingId) ? current : [...current, label],
      );
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not build that label');
    }
  };

  if (checking) {
    return (
      <Shell>
        <p className="p-6 text-[15px] text-ink-3">Checking your session…</p>
      </Shell>
    );
  }

  // Staff only. This screen used to render for anyone, which was a hole — the
  // API refused every call but the page still looked operable.
  if (!user) {
    return (
      <Shell>
        <div className="mx-auto w-full max-w-[420px] p-5 sm:p-10">
          <h1 className="text-2xl font-bold uppercase tracking-[0.04em]">Depot sign in</h1>
          <p className="mt-2 text-[15px] leading-[1.6] text-ink-2">
            The same account as the operations panel. In development, sign in as{' '}
            <span className="tnum font-semibold">operator@cargoflow.test</span> with the password{' '}
            <span className="tnum font-semibold">cargoflow</span>.
          </p>
          <LoginForm redirectTo="/depot" defaultEmail="operator@cargoflow.test" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell station={user.depotId ?? 'WS-03'} who={user.name}>
      <div className="flex flex-col gap-3 border-b border-rule bg-panel px-4 py-4 sm:flex-row sm:items-center sm:gap-[14px] sm:px-[26px]">
        <form
          className="flex h-[52px] min-w-0 flex-grow items-center gap-3 border border-ink bg-white px-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submitScan(scan);
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 22 22"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <path d="M3 7V4h3M19 7V4h-3M3 15v3h3M19 15v3h-3" stroke="var(--ink)" strokeWidth="1.6" />
            <path d="M6.5 8v6M9 8v6M11.5 8v6M14 8v6M16 8v6" stroke="var(--brand)" strokeWidth="1.4" />
          </svg>
          <input
            ref={scanBox}
            autoFocus
            value={scan}
            onChange={(event) => setScan(event.target.value)}
            placeholder="Scan a tracking ID, or type a booking reference"
            aria-label="Scan a tracking ID or booking reference"
            className="tnum h-full min-w-0 flex-grow bg-transparent text-[15px] uppercase outline-none placeholder:normal-case placeholder:text-ink-4 sm:text-base"
          />
          {busy && <span className="shrink-0 text-xs text-ink-4">…</span>}
        </form>
        <button
          type="button"
          onClick={() => setWalkInOpen((open) => !open)}
          className="h-[52px] shrink-0 bg-deep px-[22px] text-xs font-bold uppercase tracking-[0.14em] text-ink-invert"
        >
          {walkInOpen ? 'Close intake' : 'Walk-in express intake'}
        </button>
      </div>

      <div className="flex flex-col gap-4 p-4 sm:p-[26px]">
        {error && (
          <p className="border-l-4 border-alert bg-alert-tint px-4 py-3 text-[15px] font-medium text-alert-ink">
            {error}
          </p>
        )}
        {notice && (
          <p className="border-l-4 border-ok bg-ok-tint px-4 py-3 text-[15px] font-medium text-ok-ink">
            {notice}
          </p>
        )}

        {walkInOpen && (
          <WalkInPanel
            onDone={(message) => {
              setNotice(message);
              setWalkInOpen(false);
              refreshQueue();
            }}
            onPrint={printLabel}
          />
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
            onClose={() => setPiece(null)}
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

        <Queue entries={queue} onReceive={(reference) => void submitScan(reference)} />
      </div>
    </Shell>
  );
}

function Shell({
  children,
  station = 'WS-03',
  who,
}: {
  children: React.ReactNode;
  station?: string;
  who?: string;
}) {
  return (
    <div data-surface="depot" className="min-h-screen bg-bg text-ink">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-deep px-4 py-3 sm:h-14 sm:flex-nowrap sm:px-[26px] sm:py-0">
        <div className="flex min-w-0 items-center gap-3">
          <LogoTile size={32} mark={24} />
          <span className="truncate text-sm font-bold uppercase tracking-[0.14em] text-ink-invert">
            Receiving station
          </span>
          <span className="tnum hidden shrink-0 bg-[#2b271c] px-[9px] py-1 text-[11px] font-medium text-ink-4 sm:inline">
            {station} · Peliyagoda
          </span>
        </div>
        <div className="flex items-center gap-[9px]">
          <span className="h-[7px] w-[7px] bg-ok" />
          <span className="text-xs text-ink-4">{who ? `${who} · on shift` : 'Not signed in'}</span>
        </div>
      </header>
      {children}
    </div>
  );
}

/** What is on the floor, and what each shipment is waiting for. */
function Queue({
  entries,
  onReceive,
}: {
  entries: QueueEntry[];
  onReceive: (reference: string) => void;
}) {
  if (entries.length === 0) {
    return (
      <div className="border border-rule bg-panel p-8 text-center">
        <p className="text-[15px] text-ink-3">Nothing on the floor. Scan a docket to receive.</p>
      </div>
    );
  }

  const columns =
    'grid min-w-[780px] grid-cols-[130px_minmax(0,1fr)_150px_repeat(4,74px)_112px] gap-3 px-5';

  return (
    <div className="border border-rule bg-panel">
      <div className="flex items-center justify-between border-b border-rule px-4 py-3 sm:px-5">
        <span className="text-sm font-bold uppercase tracking-[0.1em]">On the floor</span>
        <span className="tnum text-xs text-ink-4">
          {entries.length} {entries.length === 1 ? 'shipment' : 'shipments'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className={`${columns} border-b border-rule bg-panel-2 py-2`}>
          {['Booking', 'Customer', 'Route', 'Pcs', 'To get', 'To weigh', 'Held', ''].map(
            (head, index) => (
              <span
                key={head || index}
                className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-4"
              >
                {head}
              </span>
            ),
          )}
        </div>
        {entries.map((entry) => (
          <div
            key={entry.bookingRef}
            className={`${columns} items-center border-b border-rule-2 py-3 last:border-b-0`}
          >
            <span className="tnum text-[13px] font-bold">{entry.bookingRef}</span>
            <span className="truncate text-[14px]">{entry.customerName}</span>
            <span className="text-[13px] text-ink-3">{entry.route}</span>
            <span className="tnum text-center text-[13px]">{entry.pieceCount}</span>
            <Count value={entry.awaitingReceipt} tone="warn" />
            <Count value={entry.awaitingMeasure} tone="brand" />
            <Count value={entry.held} tone="alert" />
            {entry.awaitingReceipt > 0 ? (
              <button
                type="button"
                onClick={() => onReceive(entry.bookingRef)}
                className="h-9 bg-ink px-3 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-invert"
              >
                Receive
              </button>
            ) : (
              <span className="text-[11px] text-ink-4">
                {entry.readyToLabel > 0 ? `${entry.readyToLabel} to label` : '—'}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
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
