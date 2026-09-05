import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { admin, can, type RateCardSummary } from '@/lib/admin';
import { ApiError } from '@/lib/http';

const day = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

const STATE_CHIP: Record<RateCardSummary['state'], string> = {
  live: 'bg-ok-tint text-ok-ink',
  scheduled: 'bg-warn-tint text-warn-ink',
  expired: 'bg-panel-2 text-ink-3',
};

const STATE_LABEL: Record<RateCardSummary['state'], string> = {
  live: 'Live',
  scheduled: 'Scheduled',
  expired: 'Expired',
};

/**
 * Rate cards.
 *
 * They are published, never edited. A booking keeps the version it was quoted
 * on for the life of the shipment, so editing a live card would silently
 * rewrite what every unsettled shipment on the floor is worth. That is why
 * this screen has no save button on an existing card — only a way to supersede
 * it from a future date.
 */
export function RateCardsPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState<RateCardSummary[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { cards: all } = await admin.rateCards();
      setCards(all);
      setSelected((current) => current ?? all.find((c) => c.state === 'live')?.version ?? all[0]?.version ?? null);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not load rate cards');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const card = cards.find((c) => c.version === selected);
  const mayPublish = user && can(user, 'rates:publish');

  return (
    <>
      <header className="flex h-[68px] items-center justify-between border-b border-rule bg-panel px-5 sm:px-8">
        <span className="text-[19px] font-bold tracking-[-0.015em]">Rate cards</span>
        <span className="tnum text-[13px] font-medium text-ink-4">{cards.length} versions</span>
      </header>

      <div className="flex flex-col gap-5 px-5 pb-9 pt-[26px] sm:px-8">
        {error && (
          <p className="rounded-[12px] bg-alert-tint px-5 py-4 text-[14px] text-alert-ink">{error}</p>
        )}
        {notice && (
          <p className="rounded-[12px] bg-ok-tint px-5 py-4 text-[14px] text-ok-ink">{notice}</p>
        )}

        {mayPublish && card && (
          <PublishForm
            basedOn={card}
            busy={publishing}
            setBusy={setPublishing}
            onPublished={(message) => {
              setNotice(message);
              setSelected(null);
              void refresh();
            }}
            onError={setError}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((option) => (
            <button
              key={option.version}
              type="button"
              onClick={() => setSelected(option.version)}
              className={`flex flex-col gap-3 rounded-[14px] border-2 p-5 text-left ${
                option.version === selected ? 'border-brand bg-brand-tint' : 'border-rule bg-panel'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="tnum text-[15px] font-bold">Version {option.version}</span>
                <span className={`rounded-[7px] px-[10px] py-[5px] text-[11px] font-bold ${STATE_CHIP[option.state]}`}>
                  {STATE_LABEL[option.state]}
                </span>
              </div>
              <span className="tnum text-[13px] text-ink-3">
                {day(option.effectiveFrom)} → {option.effectiveTo ? day(option.effectiveTo) : 'open'}
              </span>
              <span className="tnum text-[12px] text-ink-4">
                {option.laneCount} lane rates ·{' '}
                {option.bookingsQuoted === 0
                  ? 'nothing quoted on it'
                  : `${option.bookingsQuoted} booking${option.bookingsQuoted === 1 ? '' : 's'} quoted`}
              </span>
            </button>
          ))}
        </div>

        {card && <CardDetail card={card} />}
      </div>
    </>
  );
}

function CardDetail({ card }: { card: RateCardSummary }) {
  const columns = 'grid min-w-[720px] grid-cols-[minmax(180px,1fr)_120px_110px_110px_130px] gap-3 px-5';

  return (
    <>
      <section className="overflow-hidden rounded-[14px] border border-rule bg-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-5 py-4">
          <span className="text-base font-bold tracking-[-0.01em]">Version {card.version} lanes</span>
          <span className="tnum text-[13px] text-ink-4">
            {day(card.effectiveFrom)} → {card.effectiveTo ? day(card.effectiveTo) : 'open'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <div className={`${columns} border-b border-rule bg-panel-2 py-3`}>
            {[
              { label: 'Route', align: '' },
              { label: 'Service', align: '' },
              { label: 'Rate', align: 'text-right' },
              { label: 'Per', align: '' },
              { label: 'Minimum', align: 'text-right' },
            ].map(({ label, align }) => (
              <span key={label} className={`text-[11px] font-bold text-ink-3 ${align}`}>
                {label}
              </span>
            ))}
          </div>

          {card.lanes.map((lane) => (
            <div
              key={`${lane.lane}-${lane.service}`}
              className={`${columns} items-center border-b border-rule-2 py-3 last:border-b-0`}
            >
              <span className="text-sm font-semibold">{lane.route}</span>
              <span className="text-[13px] text-ink-3">{lane.service}</span>
              <span className="tnum text-right text-[13px] font-bold">{lane.rate}</span>
              <span className="text-[13px] text-ink-3">{lane.unit}</span>
              <span className="tnum text-right text-[13px] text-ink-3">{lane.minimum}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[14px] border border-rule bg-panel p-5">
          <span className="text-base font-bold tracking-[-0.01em]">Surcharges and tax</span>
          <dl className="mt-4 flex flex-col gap-3">
            {card.surcharges.map((surcharge) => (
              <div key={surcharge.label} className="flex items-baseline justify-between gap-4">
                <dt className="text-[14px] text-ink-2">{surcharge.label}</dt>
                <dd className="tnum text-[14px] font-semibold">{surcharge.amount}</dd>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-4 border-t border-rule pt-3">
              <dt className="text-[14px] text-ink-2">GST</dt>
              <dd className="tnum text-[14px] font-semibold">{card.taxPercent}%</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-[14px] border border-rule bg-panel p-5">
          <span className="text-base font-bold tracking-[-0.01em]">Re-rate tolerance</span>
          <p className="mt-2 text-[13px] leading-[1.6] text-ink-3">
            How far a measured shipment may differ before the customer is asked.
          </p>
          <dl className="mt-4 flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-[14px] text-ink-2">Absorbed below</dt>
              <dd className="tnum text-[14px] font-semibold">
                {card.tolerance.percent}% or {card.tolerance.minimum}, whichever is greater
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-[14px] text-ink-2">Hard stop above</dt>
              <dd className="tnum text-[14px] font-semibold">{card.tolerance.hardStopPercent}%</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-[14px] text-ink-2">Auto-approves after</dt>
              <dd className="tnum text-[14px] font-semibold">{card.tolerance.autoApproveDays} days</dd>
            </div>
          </dl>
        </section>
      </div>
    </>
  );
}

/** yyyy-mm-dd, `days` from now. */
const inDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

function PublishForm({
  basedOn,
  busy,
  setBusy,
  onPublished,
  onError,
}: {
  basedOn: RateCardSummary;
  busy: boolean;
  setBusy: (busy: boolean) => void;
  onPublished: (message: string) => void;
  onError: (message: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [effectiveFrom, setEffectiveFrom] = useState(inDays(30));
  const [rates, setRates] = useState<Record<string, string>>({});

  // Every unchanged rate is carried forward, so the form only needs the ones
  // that move. A card with eighteen lanes typed out afresh is a card with a
  // typo in it.
  const key = (lane: string, service: string) => `${lane}::${service}`;
  const changed = basedOn.lanes.filter((lane) => {
    const typed = rates[key(lane.lane, lane.service)];
    return typed !== undefined && typed !== '' && typed !== lane.rate;
  });

  const publish = async () => {
    setBusy(true);
    onError(null);
    try {
      const { card } = await admin.publishRateCard({
        basedOn: basedOn.version,
        effectiveFrom: new Date(`${effectiveFrom}T00:00:00.000Z`).toISOString(),
        lanes: changed.map((lane) => ({
          lane: lane.lane,
          service: lane.service === 'Sea LCL' ? 'sea_lcl' : 'air_express',
          rate: Math.round(Number(rates[key(lane.lane, lane.service)]) * 100),
        })),
      });
      setRates({});
      setOpen(false);
      onPublished(
        `Version ${card.version} published, taking effect ${day(card.effectiveFrom)}. ` +
          `Version ${basedOn.version} runs until then, and every booking already quoted on it keeps that price.`,
      );
    } catch (caught) {
      onError(caught instanceof ApiError ? caught.message : 'Could not publish that card');
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 w-fit items-center rounded-[10px] bg-brand px-5 text-[14px] font-bold text-ink-invert"
      >
        Publish a new version
      </button>
    );
  }

  return (
    <section className="rounded-[14px] border border-rule bg-panel">
      <div className="flex items-center justify-between border-b border-rule px-5 py-4">
        <span className="text-base font-bold tracking-[-0.01em]">
          New version, based on v{basedOn.version}
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[13px] font-semibold text-ink-3"
        >
          Cancel
        </button>
      </div>

      <div className="flex flex-col gap-4 p-5">
        <label className="flex w-fit flex-col gap-2">
          <span className="text-[13px] font-semibold text-ink-3">Takes effect on</span>
          <input
            type="date"
            value={effectiveFrom}
            onChange={(event) => setEffectiveFrom(event.target.value)}
            className="tnum h-12 rounded-[10px] border border-rule bg-panel-2 px-4 text-[15px]"
          />
          <span className="text-[12px] text-ink-4">
            Must be in the future. Backdating would change what quoted shipments are worth.
          </span>
        </label>

        <div>
          <span className="text-[13px] font-semibold text-ink-3">
            Change only the rates that move
          </span>
          <div className="mt-3 flex flex-col gap-2">
            {basedOn.lanes.map((lane) => (
              <div
                key={`${lane.lane}-${lane.service}`}
                className="flex flex-wrap items-center gap-3 rounded-[12px] border border-rule bg-panel-2 px-4 py-3"
              >
                <span className="min-w-[190px] flex-grow text-sm font-semibold">
                  {lane.route} · {lane.service}
                </span>
                <span className="tnum text-[13px] text-ink-4">now {lane.rate}</span>
                <input
                  inputMode="decimal"
                  placeholder={lane.rate}
                  value={rates[key(lane.lane, lane.service)] ?? ''}
                  onChange={(event) =>
                    setRates({ ...rates, [key(lane.lane, lane.service)]: event.target.value })
                  }
                  aria-label={`New ${lane.service} rate for ${lane.route}`}
                  className="tnum h-11 w-[120px] rounded-[10px] border border-rule bg-panel px-3 text-right text-[15px] font-bold"
                />
                <span className="text-[13px] text-ink-4">per {lane.unit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-rule px-5 py-4 sm:flex-row sm:items-center">
        <button
          type="button"
          disabled={busy || changed.length === 0}
          onClick={publish}
          className="h-12 shrink-0 rounded-[10px] bg-brand px-6 text-[14px] font-bold text-ink-invert disabled:opacity-40"
        >
          {busy ? 'Publishing…' : `Publish version ${basedOn.version + 1}`}
        </button>
        <p className="text-[13px] leading-[1.5] text-ink-3">
          {changed.length === 0
            ? 'Change at least one rate. Everything you leave alone is carried forward unchanged.'
            : `${changed.length} rate${changed.length === 1 ? '' : 's'} changing. The rest carry forward from v${basedOn.version}.`}
        </p>
      </div>
    </section>
  );
}
