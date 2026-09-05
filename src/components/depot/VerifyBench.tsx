import { useEffect, useState } from 'react';
import { cmToMm, kgToGrams } from '@/lib/api';
import { depot, type PieceLookup, type VerifyResult } from '@/lib/depot';
import { ApiError } from '@/lib/http';

/**
 * Requirements 2.1 and 2.2 on one screen.
 *
 * The operator records what the scale and dimensioner say. They are never asked
 * to judge whether the difference matters — the engine decides that, and the
 * answer comes back in the same response as the measurement. Putting the money
 * consequence in front of the person holding the box is the whole point: they
 * can set it aside immediately rather than discovering three days later that
 * billing has been arguing about it.
 */
const FIELDS = [
  ['lengthCm', 'Length'],
  ['widthCm', 'Width'],
  ['heightCm', 'Height'],
  ['weightKg', 'Weight'],
] as const;

type Field = (typeof FIELDS)[number][0];

const OUTCOME_TONE: Record<VerifyResult['rerate']['outcome'], string> = {
  unchanged: 'border-ok bg-ok-tint text-ok-ink',
  absorbed: 'border-ok bg-ok-tint text-ok-ink',
  refund: 'border-brand bg-brand-tint text-brand-deep',
  approval_required: 'border-alert bg-alert-tint text-alert-ink',
  hard_stop: 'border-alert bg-alert-tint text-alert-ink',
};

export function VerifyBench({
  piece,
  onVerified,
  onPrint,
  onClose,
}: {
  piece: PieceLookup;
  onVerified: (result: VerifyResult) => void;
  onPrint: (trackingId: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Record<Field, string>>({
    lengthCm: '',
    widthCm: '',
    heightCm: '',
    weightKg: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);

  // A new box on the bench is a clean slate. Carrying the previous box's
  // numbers over is how the wrong measurement gets committed.
  useEffect(() => {
    setDraft({ lengthCm: '', widthCm: '', heightCm: '', weightKg: '' });
    setResult(null);
    setError(null);
  }, [piece.trackingId]);

  const complete = FIELDS.every(([key]) => Number(draft[key]) > 0);

  const commit = async () => {
    setBusy(true);
    setError(null);
    try {
      const verified = await depot.verify(piece.trackingId, {
        lengthMm: cmToMm(Number(draft.lengthCm)),
        widthMm: cmToMm(Number(draft.widthCm)),
        heightMm: cmToMm(Number(draft.heightCm)),
        weightGrams: kgToGrams(Number(draft.weightKg)),
      });
      setResult(verified);
      onVerified(verified);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not record that measurement');
    } finally {
      setBusy(false);
    }
  };

  const copyDeclared = () =>
    setDraft({
      lengthCm: String(piece.declared.lengthCm),
      widthCm: String(piece.declared.widthCm),
      heightCm: String(piece.declared.heightCm),
      weightKg: String(piece.declared.weightKg),
    });

  return (
    <section className="overflow-hidden rounded-[14px] border border-rule bg-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-5 py-4">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="tnum text-[19px] font-bold">{piece.trackingId}</span>
          <span className="text-[13px] text-ink-3">
            {piece.bookingRef} · box {piece.sequence} · {piece.packaging.replace(/_/g, ' ')}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[13px] font-semibold text-ink-3"
        >
          Close
        </button>
      </div>

      <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[13px] font-semibold text-ink-3">
              What the scale says
            </span>
            <button
              type="button"
              onClick={copyDeclared}
              className="text-[12px] font-bold text-brand underline"
            >
              Same as declared
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-[10px] sm:grid-cols-4">
            {FIELDS.map(([key, label]) => {
              const isWeight = key === 'weightKg';
              return (
                <label key={key} className="flex flex-col gap-2">
                  <span
                    className={`text-center text-[12px] font-semibold ${
                      isWeight ? 'text-brand' : 'text-ink-3'
                    }`}
                  >
                    {label} {isWeight ? '(kg)' : '(cm)'}
                  </span>
                  <input
                    inputMode="decimal"
                    value={draft[key]}
                    onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
                    aria-label={`Measured ${label.toLowerCase()}`}
                    className={`tnum h-[62px] rounded-[12px] border-2 text-center text-[22px] font-bold ${
                      isWeight ? 'border-brand bg-brand-tint text-brand-deep' : 'border-rule bg-panel-2'
                    }`}
                  />
                  <span className="tnum text-center text-[11px] text-ink-4">
                    said {piece.declared[key]}
                  </span>
                </label>
              );
            })}
          </div>

          <button
            type="button"
            disabled={!complete || busy || piece.loaded}
            onClick={commit}
            className="mt-5 h-14 w-full rounded-[12px] bg-brand text-[15px] font-bold text-ink-invert disabled:opacity-40"
          >
            {busy ? 'Recording…' : piece.loaded ? 'Already loaded' : 'Record and price'}
          </button>

          {error && (
            <p className="mt-3 rounded-[12px] bg-alert-tint px-5 py-4 text-[14px] leading-[1.55] text-alert-ink">
              {error}
            </p>
          )}
        </div>

        <div className="rounded-[12px] border border-rule bg-panel-2 p-5">
          <span className="text-[13px] font-semibold text-ink-3">
            What the customer booked
          </span>
          <p className="tnum mt-3 text-[15px] font-semibold">
            {piece.declared.lengthCm} × {piece.declared.widthCm} × {piece.declared.heightCm} cm
          </p>
          <p className="tnum text-[15px]">
            {piece.declared.weightKg} kg · {piece.declared.volume} m³
          </p>
          <p className="mt-3 border-t border-rule pt-3 text-[13px] text-ink-3">
            {piece.customerName} → {piece.consignee}
            <br />
            {piece.route}
          </p>
          {piece.verified && (
            <p className="tnum mt-3 border-t border-rule pt-3 text-[13px] text-ink-2">
              Already measured: {piece.verified.lengthCm} × {piece.verified.widthCm} ×{' '}
              {piece.verified.heightCm} cm, {piece.verified.weightKg} kg
            </p>
          )}
        </div>
      </div>

      {result && (
        <div className={`border-t px-5 py-5 ${OUTCOME_TONE[result.rerate.outcome]}`}>
          <p className="text-[15px] font-bold">{result.rerate.message}</p>

          {result.rerate.outcome !== 'unchanged' && (
            <div className="tnum mt-3 flex flex-wrap gap-x-8 gap-y-2 text-[14px]">
              <span>
                booked <strong className="font-bold">{result.rerate.bookedTotal}</strong>
              </span>
              <span>
                now <strong className="font-bold">{result.rerate.verifiedTotal}</strong>
              </span>
              <span>
                difference{' '}
                <strong className="font-bold">
                  {result.rerate.difference} ({result.rerate.differencePercent}%)
                </strong>
              </span>
              <span className="opacity-75">tolerance {result.rerate.tolerance}</span>
            </div>
          )}

          {result.rerate.adjustmentReference && (
            <p className="tnum mt-2 text-[13px]">
              {result.rerate.adjustmentReference} raised
              {result.rerate.customerNotified ? ' · customer notified by email and SMS' : ''}
            </p>
          )}

          {result.provisional && (
            <p className="mt-2 text-[13px] opacity-80">
              Other boxes on this booking are still to be weighed, so this figure can move again.
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onPrint(result.trackingId)}
              className="h-11 rounded-[10px] bg-brand px-5 text-[13px] font-bold text-ink-invert"
            >
              Print label
            </button>
            {result.status === 'rerate_held' && (
              <span className="flex h-11 items-center text-[13px] font-medium">
                Set this box aside — it cannot be loaded until billing settles the change.
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
