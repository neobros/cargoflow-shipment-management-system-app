import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  api,
  ApiError,
  cmToMm,
  kgToGrams,
  mmToCm,
  type PackagingPreset,
  type Quote,
  type Reference,
  type ServiceMode,
} from '@/lib/api';

/**
 * The landing page price calculator.
 *
 * Every figure it shows comes from the server's pricing engine — nothing is
 * multiplied in the browser. A price a customer sees and a price stored on
 * their booking have to come from the same arithmetic, and there is only one
 * copy of that arithmetic.
 */

const DEBOUNCE_MS = 350;

type Draft = {
  lane: string;
  service: ServiceMode;
  packaging: PackagingPreset | null;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  weightKg: string;
};

const numeric = (value: string): number => {
  const n = Number.parseFloat(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const isComplete = (draft: Draft): boolean =>
  numeric(draft.lengthCm) > 0 &&
  numeric(draft.widthCm) > 0 &&
  numeric(draft.heightCm) > 0 &&
  numeric(draft.weightKg) > 0;

export function QuoteWidget() {
  const [reference, setReference] = useState<Reference | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pricing, setPricing] = useState(false);

  // Only the newest request is allowed to write to state; a slow earlier one
  // must not overwrite a fresher price.
  const requestSeq = useRef(0);

  useEffect(() => {
    let cancelled = false;

    api
      .reference()
      .then((ref) => {
        if (cancelled) return;
        const large = ref.packaging.find((p) => p.kind === 'large_box') ?? ref.packaging[2] ?? ref.packaging[0];
        setReference(ref);
        setDraft({
          lane: ref.lanes[0]?.code ?? 'LKCMB-AUMEL',
          service: 'sea_lcl',
          packaging: large ?? null,
          lengthCm: large ? String(mmToCm(large.lengthMm)) : '',
          widthCm: large ? String(mmToCm(large.widthMm)) : '',
          heightCm: large ? String(mmToCm(large.heightMm)) : '',
          weightKg: large ? String(large.weightGrams / 1000) : '',
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(
          e instanceof ApiError && e.code === 'network_unreachable'
            ? 'We cannot reach our pricing service right now. Start the API and this will fill itself in.'
            : 'Something went wrong loading prices.',
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const price = useCallback(
    async (current: Draft) => {
      if (!isComplete(current)) {
        setQuote(null);
        return;
      }

      const seq = ++requestSeq.current;
      setPricing(true);

      try {
        const { quote: result } = await api.estimate({
          lane: current.lane,
          service: current.service,
          declaredValue: 0,
          coverRequested: false,
          pieces: [
            {
              packaging: current.packaging?.kind ?? 'custom_carton',
              lengthMm: cmToMm(numeric(current.lengthCm)),
              widthMm: cmToMm(numeric(current.widthCm)),
              heightMm: cmToMm(numeric(current.heightCm)),
              weightGrams: kgToGrams(numeric(current.weightKg)),
            },
          ],
        });
        if (seq !== requestSeq.current) return;
        setQuote(result);
        setError(null);
      } catch (e: unknown) {
        if (seq !== requestSeq.current) return;
        setQuote(null);
        setError(e instanceof ApiError ? e.message : 'We could not work that price out.');
      } finally {
        if (seq === requestSeq.current) setPricing(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!draft) return;
    const timer = setTimeout(() => void price(draft), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft, price]);

  const update = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const choosePackaging = (preset: PackagingPreset) =>
    update({
      packaging: preset,
      lengthCm: String(mmToCm(preset.lengthMm)),
      widthCm: String(mmToCm(preset.widthMm)),
      heightCm: String(mmToCm(preset.heightMm)),
      weightKg: String(preset.weightGrams / 1000),
    });

  const lane = useMemo(
    () => reference?.lanes.find((l) => l.code === draft?.lane) ?? reference?.lanes[0],
    [reference, draft?.lane],
  );

  const freightLine = quote?.lines.find((l) => l.code === 'freight');
  const handlingLine = quote?.lines.find((l) => l.code === 'handling');
  const clearanceLine = quote?.lines.find((l) => l.code === 'customs_clearance');

  return (
    <div className="overflow-hidden rounded-[24px] border border-rule bg-panel shadow-[0_2px_4px_rgba(11,31,29,.04),0_18px_44px_rgba(11,31,29,.09)]">
      <div className="flex items-center justify-between gap-3 bg-panel-2 px-5 py-[22px] sm:px-[26px]">
        <span className="font-display text-[17px] font-bold tracking-[-0.01em]">What will it cost?</span>
        <span
          className="rounded-full bg-panel px-[13px] py-[7px] text-xs font-bold text-ink-3"
          aria-live="polite"
        >
          {pricing ? 'Working it out…' : '20 seconds'}
        </span>
      </div>

      <div className="flex flex-col gap-5 p-5 sm:p-[26px]">
        {/* Route */}
        <label className="flex flex-col gap-[9px]">
          <span className="text-[13px] font-bold text-ink-2">Where is it going?</span>
          <select
            value={draft?.lane ?? ''}
            onChange={(e) => update({ lane: e.target.value })}
            disabled={!reference}
            className="h-[60px] rounded-[14px] bg-panel-2 px-[18px] text-base font-semibold text-ink"
          >
            {(reference?.lanes ?? []).map((l) => (
              <option key={l.code} value={l.code}>
                {l.from} → {l.to}
              </option>
            ))}
            {!reference ? <option>Loading…</option> : null}
          </select>
        </label>

        {/* Service */}
        <fieldset className="flex flex-col gap-[9px] border-0 p-0">
          <legend className="mb-[9px] text-[13px] font-bold text-ink-2">How fast?</legend>
          <div className="grid grid-cols-2 gap-[10px]">
            {(['sea_lcl', 'air_express'] as ServiceMode[]).map((mode) => {
              const selected = draft?.service === mode;
              const svc = lane?.services.find((s) => s.service === mode);
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => update({ service: mode })}
                  aria-pressed={selected}
                  className={`flex flex-col gap-[5px] rounded-[14px] border-2 px-[17px] py-[15px] text-left ${
                    selected ? 'border-brand bg-brand-tint' : 'border-rule bg-panel'
                  }`}
                >
                  <span className={`text-[15px] font-bold ${selected ? 'text-brand-deep' : 'text-ink-2'}`}>
                    {mode === 'sea_lcl' ? 'By sea' : 'By air'}
                  </span>
                  <span className={`text-[13px] font-medium ${selected ? 'text-brand' : 'text-ink-4'}`}>
                    {svc ? `${svc.transit.min}–${svc.transit.max} days` : '—'}
                    {mode === 'sea_lcl' ? ' · cheapest' : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Packaging */}
        <label className="flex flex-col gap-[9px]">
          <span className="text-[13px] font-bold text-ink-2">What are you sending?</span>
          <select
            value={draft?.packaging?.kind ?? ''}
            onChange={(e) => {
              const preset = reference?.packaging.find((p) => p.kind === e.target.value);
              if (preset) choosePackaging(preset);
            }}
            disabled={!reference}
            className="h-[60px] rounded-[14px] bg-panel-2 px-[18px] text-base font-semibold text-ink"
          >
            {(reference?.packaging ?? []).map((p) => (
              <option key={p.kind} value={p.kind}>
                {p.name} — {mmToCm(p.lengthMm)}×{mmToCm(p.widthMm)}×{mmToCm(p.heightMm)} cm
              </option>
            ))}
            {!reference ? <option>Loading…</option> : null}
          </select>
        </label>

        {/* Measurements */}
        <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-4">
          {(
            [
              ['Length', 'lengthCm'],
              ['Width', 'widthCm'],
              ['Height', 'heightCm'],
              ['Weight', 'weightKg'],
            ] as const
          ).map(([label, key]) => {
            const isWeight = key === 'weightKg';
            return (
              <label key={key} className="flex flex-col gap-2">
                <span
                  className={`text-center text-xs font-bold ${isWeight ? 'text-brand' : 'text-ink-3'}`}
                >
                  {label}
                </span>
                <input
                  inputMode="decimal"
                  value={draft?.[key] ?? ''}
                  onChange={(e) => update({ [key]: e.target.value } as Partial<Draft>)}
                  aria-label={isWeight ? 'Weight in kilograms' : `${label} in centimetres`}
                  className={`tnum h-[56px] rounded-[14px] text-center text-[19px] font-bold ${
                    isWeight ? 'border-2 border-brand bg-brand-tint text-brand-deep' : 'bg-panel-2 text-ink'
                  }`}
                />
              </label>
            );
          })}
        </div>
        <p className="-mt-2 text-center text-xs text-ink-4">Centimetres and kilograms. Rough is fine.</p>

        {/* Price */}
        <div className="flex flex-col gap-[13px] rounded-[18px] bg-panel-2 p-5">
          {error ? (
            <p className="text-[14px] leading-[1.55] text-alert-ink">{error}</p>
          ) : quote ? (
            <>
              <Row
                label={`Shipping · ${quote.chargeable.display} ${quote.chargeable.unit}${
                  quote.chargeable.minimumApplied ? ' (our minimum)' : ''
                }`}
                value={freightLine?.amount ?? '—'}
              />
              <Row label="Handling" value={handlingLine?.amount ?? '—'} />
              <Row label="Customs clearance" value={clearanceLine?.amount ?? '—'} />
              <div className="flex items-end justify-between border-t border-rule pt-[13px]">
                <div className="flex flex-col gap-[3px]">
                  <span className="text-sm font-bold">Your price</span>
                  <span className="text-xs font-medium text-ink-4">excluding GST</span>
                </div>
                <span className="tnum font-display text-[clamp(28px,8vw,38px)] font-extrabold leading-none tracking-[-0.03em] text-brand">
                  {quote.totalDisplay}
                </span>
              </div>
            </>
          ) : (
            <p className="text-[14px] leading-[1.55] text-ink-3">
              Fill in the four numbers above and the price appears here.
            </p>
          )}
        </div>

        <Link
          to="/track"
          className="flex h-[60px] items-center justify-center gap-3 rounded-[16px] bg-brand text-[17px] font-bold text-ink-invert"
        >
          Track a shipment
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path
              d="M3 9h12m-5-5 5 5-5 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        <div className="flex gap-3 rounded-[14px] bg-alert-tint p-4">
          <svg
            width="19"
            height="19"
            viewBox="0 0 20 20"
            fill="none"
            className="mt-[1px] shrink-0"
            aria-hidden="true"
          >
            <circle cx="10" cy="10" r="7.6" stroke="var(--alert)" strokeWidth="1.7" />
            <path d="M10 6v4.6M10 13.4v.6" stroke="var(--alert)" strokeWidth="1.9" strokeLinecap="round" />
          </svg>
          <p className="m-0 text-[13px] font-medium leading-[1.55] text-alert-ink">
            This is an estimate from your own measurements. We weigh every box at the depot — if the price
            changes, we ask you first.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-ink-3">{label}</span>
      <span className="tnum text-sm font-semibold text-ink-2">{value}</span>
    </div>
  );
}
