import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAsync } from '@/hooks/useAsync';
import { trackShipment, type Tracking } from '@/lib/tracking';

const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : null;

export function TrackPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get('id')?.trim() ?? '';
  const [draft, setDraft] = useState(query);

  useEffect(() => setDraft(query), [query]);

  const { data, error, loading } = useAsync<Tracking | null>(
    () => (query ? trackShipment(query) : Promise.resolve(null)),
    [query],
  );

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = draft.trim();
    setParams(next ? { id: next } : {});
  };

  return (
    <div className="mx-auto max-w-[900px] px-5 py-10 sm:px-6 md:px-14 md:py-16">
      <h1 className="font-display text-[clamp(34px,5vw,46px)] font-extrabold leading-[1.04] tracking-[-0.035em]">
        Track a box
      </h1>
      <p className="mt-3 max-w-[52ch] text-[17px] leading-[1.6] text-ink-2">
        Type the number from your label or your confirmation email. No account needed.
      </p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-3 sm:flex-row">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="CF-8817-001 or BK-26-8817"
          aria-label="Tracking number or booking reference"
          className="tnum h-16 flex-grow rounded-[16px] bg-panel-2 px-[22px] text-[17px] text-ink"
        />
        <button
          type="submit"
          className="h-16 rounded-[16px] bg-brand px-8 text-[17px] font-bold text-ink-invert"
        >
          Track it
        </button>
      </form>

      {!query && (
        <p className="mt-6 text-[15px] text-ink-4">
          Try <span className="tnum font-semibold text-ink-2">BK-26-8817</span> to see a real shipment.
        </p>
      )}

      {query && loading && <p className="mt-8 text-[16px] text-ink-3">Looking that up…</p>}

      {error && (
        <div className="mt-8 rounded-[20px] bg-alert-tint p-6">
          <p className="text-[16px] leading-[1.6] text-alert-ink">
            {error.code === 'network_unreachable'
              ? 'We cannot reach our tracking service right now. Please try again in a moment.'
              : error.message}
          </p>
        </div>
      )}

      {data && <Result data={data} />}
    </div>
  );
}

function Result({ data }: { data: Tracking }) {
  const { booking, pieces, timeline, adjustment, totals, matchedTrackingId } = data;

  return (
    <div className="mt-10 flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <h2 className="font-display text-[clamp(24px,6vw,32px)] font-bold leading-[1.1] tracking-[-0.03em]">
              {booking.route.from} → {booking.route.to}
            </h2>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-[9px] ${
                adjustment ? 'bg-alert-tint' : 'bg-ok-tint'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${adjustment ? 'bg-alert' : 'bg-ok'}`} />
              <span className={`text-[13px] font-bold ${adjustment ? 'text-alert-ink' : 'text-ok-ink'}`}>
                {adjustment ? 'Needs your OK' : booking.statusLabel}
              </span>
            </span>
          </div>
          <p className="text-[15px] text-ink-3">
            {booking.pieceCount} boxes · booked {day(booking.bookedAt)} ·{' '}
            <span className="tnum font-medium">{booking.reference}</span>
          </p>
        </div>
      </div>

      {adjustment && (
        <div className="overflow-hidden rounded-[24px] border border-alert bg-panel">
          <div className="flex items-center gap-4 bg-alert-tint px-5 py-5 sm:px-7 sm:py-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-alert">
              <svg width="24" height="24" viewBox="0 0 26 26" fill="none" aria-hidden="true">
                <path d="M13 4 23 21.5H3L13 4Z" stroke="#fff" strokeWidth="1.9" strokeLinejoin="round" />
                <path d="M13 10.5v5M13 18.3v.7" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" />
              </svg>
            </span>
            <div className="flex flex-col gap-1">
              <span className="font-display text-[22px] font-bold leading-tight tracking-[-0.025em] text-alert-ink">
                {adjustment.changedPieceIndexes.length} box
                {adjustment.changedPieceIndexes.length === 1 ? '' : 'es'} measured bigger
              </span>
              <span className="text-[14px] font-medium text-alert-ink">
                Weighed at our depot on {day(adjustment.raisedAt)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-6 p-5 sm:p-7">
            <p className="max-w-[60ch] text-[16px] leading-[1.6] text-ink-2">
              They took up more room than the sizes you gave us, so the price has gone up.{' '}
              <strong className="font-bold text-ink">Nothing has been charged.</strong>
            </p>

            <div className="flex flex-wrap items-center gap-5">
              <div className="flex flex-grow flex-col gap-2 rounded-[18px] bg-panel-2 px-5 py-5 sm:px-6">
                <span className="text-[13px] font-semibold text-ink-4">You booked</span>
                <span className="font-display text-[30px] font-bold leading-none tracking-[-0.03em] text-ink-4 line-through">
                  A${adjustment.bookedTotal}
                </span>
              </div>
              <div className="flex flex-grow flex-col gap-2 rounded-[18px] bg-alert-tint px-6 py-5">
                <span className="text-[13px] font-semibold text-alert-ink">Now</span>
                <span className="font-display text-[30px] font-extrabold leading-none tracking-[-0.03em] text-alert-ink">
                  A${adjustment.verifiedTotal}
                </span>
                <span className="tnum text-[13px] font-medium text-alert-ink">
                  {adjustment.differenceDisplay} more · {adjustment.differencePercent}%
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <button className="h-14 rounded-full bg-alert px-6 text-[15px] font-bold text-ink-invert sm:px-8 sm:text-[16px]">
                Yes, that&apos;s fine — A${adjustment.verifiedTotal}
              </button>
              <button className="h-14 rounded-full bg-panel-2 px-6 text-[15px] font-bold text-ink-2">
                Something&apos;s not right
              </button>
            </div>
            {adjustment.autoApproveAt && (
              <p className="text-[14px] text-ink-4">
                If we don&apos;t hear from you by {day(adjustment.autoApproveAt)} the new price applies.
                We&apos;ll remind you first.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="rounded-[24px] border border-rule bg-panel p-7">
        <h3 className="mb-5 font-display text-[20px] font-bold tracking-[-0.02em]">
          Your {pieces.length} boxes
        </h3>
        <div className="flex flex-col gap-3">
          {pieces.map((piece) => (
            <div
              key={piece.trackingId ?? piece.sequence}
              className={`flex flex-col gap-2 rounded-[16px] px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:px-5 ${
                piece.changed
                  ? 'border border-alert-tint bg-alert-tint'
                  : matchedTrackingId === piece.trackingId
                    ? 'border-2 border-brand bg-brand-tint'
                    : 'bg-panel-2'
              }`}
            >
              <div className="flex items-center justify-between gap-3 sm:contents">
                <span className="tnum text-[14px] font-semibold sm:w-[130px]">{piece.trackingId}</span>
                <span
                  className={`shrink-0 rounded-full px-3 py-[6px] text-[12px] font-bold sm:order-last ${
                    piece.changed ? 'bg-panel text-alert-ink' : 'bg-ok-tint text-ok-ink'
                  }`}
                >
                  {piece.statusLabel}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 sm:contents">
                <span className="text-[15px] font-medium capitalize sm:flex-grow">
                  {piece.packaging.replace(/_/g, ' ')}
                </span>
                <span className="tnum text-[13px] text-ink-4">you said {piece.declared.volume}</span>
                <span
                  className={`tnum text-[13px] font-semibold ${piece.changed ? 'text-alert-ink' : 'text-ink-2'}`}
                >
                  we got {piece.verified?.volume ?? '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="tnum mt-4 text-[14px] text-ink-3">
          {totals.declaredVolume} m³ declared
          {totals.verifiedVolume ? ` → ${totals.verifiedVolume} m³ measured` : ''} · {totals.weightKg} kg
        </p>
      </div>

      <div className="rounded-[24px] border border-rule bg-panel p-7">
        <h3 className="mb-6 font-display text-[20px] font-bold tracking-[-0.02em]">Where your boxes are</h3>
        {timeline.map((stage, index) => {
          const last = index === timeline.length - 1;
          return (
            <div key={stage.code} className="flex gap-5">
              <div className="flex w-[34px] flex-col items-center">
                <span
                  className={`flex h-[34px] w-[34px] items-center justify-center rounded-full ${
                    stage.state === 'done'
                      ? 'bg-ok'
                      : stage.state === 'current'
                        ? 'bg-alert'
                        : 'border-2 border-rule'
                  }`}
                >
                  {stage.state === 'done' && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path
                        d="m3.4 8.3 3 3L12.6 5"
                        stroke="#fff"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  {stage.state === 'current' && (
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M10 5v6M10 13.6v.6" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
                    </svg>
                  )}
                </span>
                {!last && (
                  <span className={`w-[2.5px] flex-grow ${stage.state === 'done' ? 'bg-ok' : 'bg-rule'}`} />
                )}
              </div>
              <div className={`flex flex-grow justify-between gap-5 ${last ? '' : 'pb-6'}`}>
                <div>
                  <div
                    className={`text-[17px] font-bold leading-tight ${
                      stage.state === 'pending' ? 'text-ink-4' : ''
                    }`}
                  >
                    {stage.title}
                  </div>
                  <div
                    className={`mt-[6px] text-[15px] leading-[1.5] ${
                      stage.state === 'current' ? 'text-alert-ink' : 'text-ink-3'
                    }`}
                  >
                    {stage.detail}
                  </div>
                </div>
                <span className="tnum shrink-0 text-[14px] font-medium text-ink-4">{day(stage.at) ?? ''}</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[15px] text-ink-4">
        Not the shipment you expected?{' '}
        <Link to="/track" className="font-semibold">
          Search again
        </Link>
        .
      </p>
    </div>
  );
}
