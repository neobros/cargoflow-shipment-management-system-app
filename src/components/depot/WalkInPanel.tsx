import { useEffect, useState } from 'react';
import { api, cmToMm, kgToGrams, type Reference } from '@/lib/api';
import { depot } from '@/lib/depot';
import { ApiError } from '@/lib/http';

/**
 * Requirement 2.1: walk-in express intake.
 *
 * Someone is at the counter with boxes and a queue behind them. This asks for
 * the least that still produces a legal, deliverable shipment — both names, a
 * contact number each, the destination city, and the measurements, which are
 * available because the boxes are right here on the scale.
 *
 * Because they are measured at intake there is nothing to re-rate later: the
 * declared and verified figures are the same figures. The full delivery address
 * is completed afterwards against the booking reference.
 */
interface Box {
  id: number;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  weightKg: string;
}

let counter = 0;
const blankBox = (): Box => ({ id: ++counter, lengthCm: '', widthCm: '', heightCm: '', weightKg: '' });

export function WalkInPanel({
  onDone,
  onPrint,
}: {
  onDone: (message: string) => void;
  onPrint: (trackingId: string) => void;
}) {
  const [reference, setReference] = useState<Reference | null>(null);
  const [lane, setLane] = useState('LKCMB-AUMEL');
  const [senderName, setSenderName] = useState('');
  const [senderMobile, setSenderMobile] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverMobile, setReceiverMobile] = useState('');
  const [receiverCity, setReceiverCity] = useState('');
  const [boxes, setBoxes] = useState<Box[]>([blankBox()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .reference()
      .then((data) => alive && setReference(data))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const ready =
    senderName.trim().length > 1 &&
    senderMobile.trim().length > 6 &&
    receiverName.trim().length > 1 &&
    receiverMobile.trim().length > 6 &&
    receiverCity.trim().length > 1 &&
    boxes.every(
      (box) =>
        Number(box.lengthCm) > 0 &&
        Number(box.widthCm) > 0 &&
        Number(box.heightCm) > 0 &&
        Number(box.weightKg) > 0,
    );

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await depot.walkIn({
        lane,
        senderName,
        senderMobile,
        receiverName,
        receiverMobile,
        receiverCity,
        pieces: boxes.map((box) => ({
          packaging: 'custom_carton' as const,
          lengthMm: cmToMm(Number(box.lengthCm)),
          widthMm: cmToMm(Number(box.widthCm)),
          heightMm: cmToMm(Number(box.heightCm)),
          weightGrams: kgToGrams(Number(box.weightKg)),
        })),
      });

      result.pieces.forEach((piece) => onPrint(piece.trackingId));
      onDone(
        `${result.reference} taken in at the counter — ${result.total}, ${result.pieces.length} ${
          result.pieces.length === 1 ? 'box' : 'boxes'
        } labelled. Complete the delivery address before it can be loaded.`,
      );
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not take that in');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-[14px] border border-rule bg-panel">
      <div className="border-b border-rule px-5 py-4">
        <span className="text-base font-bold tracking-[-0.01em]">Walk-in express intake</span>
        <p className="mt-1 text-[13px] text-ink-3">
          Minimum details only. Boxes are measured now, so there is nothing to re-price later.
        </p>
      </div>

      <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-2">
        <fieldset className="flex flex-col gap-3 border-0 p-0">
          <legend className="mb-1 text-[13px] font-semibold text-ink-3">
            Sending
          </legend>
          <Input label="Name" value={senderName} onChange={setSenderName} />
          <Input label="Mobile" value={senderMobile} onChange={setSenderMobile} tabular />
        </fieldset>

        <fieldset className="flex flex-col gap-3 border-0 p-0">
          <legend className="mb-1 text-[13px] font-semibold text-ink-3">
            Receiving
          </legend>
          <Input label="Name" value={receiverName} onChange={setReceiverName} />
          <Input label="Mobile" value={receiverMobile} onChange={setReceiverMobile} tabular />
          <div className="grid grid-cols-2 gap-3">
            <Input label="City" value={receiverCity} onChange={setReceiverCity} />
            <label className="flex flex-col gap-1">
              <span className="text-[13px] font-semibold text-ink-3">
                Destination
              </span>
              <select
                value={lane}
                onChange={(event) => setLane(event.target.value)}
                className="h-12 rounded-[10px] border border-rule bg-panel-2 px-4 text-[15px]"
              >
                {(reference?.lanes ?? []).map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.to}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>
      </div>

      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
        <span className="text-[13px] font-semibold text-ink-3">
          Boxes, measured now
        </span>

        <div className="mt-3 flex flex-col gap-3">
          {boxes.map((box, index) => (
            <div key={box.id} className="flex flex-wrap items-end gap-3 rounded-[12px] border border-rule bg-panel-2 p-4">
              <span className="tnum w-10 shrink-0 text-[13px] font-bold">#{index + 1}</span>
              {(
                [
                  ['lengthCm', 'L cm'],
                  ['widthCm', 'W cm'],
                  ['heightCm', 'H cm'],
                  ['weightKg', 'kg'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex flex-1 flex-col gap-1" style={{ minWidth: 66 }}>
                  <span className="text-center text-[11px] font-semibold text-ink-3">
                    {label}
                  </span>
                  <input
                    inputMode="decimal"
                    value={box[key]}
                    onChange={(event) =>
                      setBoxes(
                        boxes.map((b) => (b.id === box.id ? { ...b, [key]: event.target.value } : b)),
                      )
                    }
                    aria-label={`Box ${index + 1} ${label}`}
                    className="tnum h-12 rounded-[10px] border border-rule bg-panel text-center text-[17px] font-bold"
                  />
                </label>
              ))}
              {boxes.length > 1 && (
                <button
                  type="button"
                  onClick={() => setBoxes(boxes.filter((b) => b.id !== box.id))}
                  className="h-12 px-3 text-[13px] font-bold text-alert-ink"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setBoxes([...boxes, blankBox()])}
          className="mt-3 h-11 rounded-[10px] border-2 border-dashed border-rule px-5 text-[13px] font-bold text-ink-2"
        >
          + Another box
        </button>

        {error && (
          <p className="mt-3 rounded-[12px] bg-alert-tint px-5 py-4 text-[14px] leading-[1.55] text-alert-ink">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={!ready || busy}
          onClick={submit}
          className="mt-5 h-14 w-full rounded-[12px] bg-brand text-[15px] font-bold text-ink-invert disabled:opacity-40"
        >
          {busy ? 'Taking in…' : 'Take in and print labels'}
        </button>
      </div>
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  tabular = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  tabular?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[13px] font-semibold text-ink-3">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-12 rounded-[10px] border border-rule bg-panel-2 px-4 text-[15px] ${tabular ? 'tnum' : ''}`}
      />
    </label>
  );
}
