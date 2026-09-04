import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PartyFields, type PartyDraft, blankParty, partyProblems } from '@/components/customer/PartyFields';
import { PieceEditor, type PieceDraft, blankPiece, toPieceInput } from '@/components/customer/PieceEditor';
import { api, type Quote, type Reference, type ServiceMode } from '@/lib/api';
import { ApiError } from '@/lib/http';
import { bookings, type CreatedBooking } from '@/lib/depot';

type Step = 1 | 2 | 3;

const STEPS: { n: Step; label: string; hint: string }[] = [
  { n: 1, label: 'Your boxes', hint: 'What you are sending' },
  { n: 2, label: 'Who and where', hint: 'Sender and receiver' },
  { n: 3, label: 'Price and send', hint: 'Check, then book' },
];

export function BookPage() {
  const [step, setStep] = useState<Step>(1);
  const [reference, setReference] = useState<Reference | null>(null);
  const [referenceError, setReferenceError] = useState<string | null>(null);

  const [lane, setLane] = useState('LKCMB-AUMEL');
  const [service, setService] = useState<ServiceMode>('sea_lcl');
  const [pieces, setPieces] = useState<PieceDraft[]>([blankPiece()]);
  const [coverRequested, setCover] = useState(false);
  const [declaredValue, setDeclaredValue] = useState('');
  const [pickupRequested, setPickup] = useState(false);

  const [sender, setSender] = useState<PartyDraft>(blankParty('LK'));
  const [receiver, setReceiver] = useState<PartyDraft>(blankParty('AU'));

  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [pricing, setPricing] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<{ booking: CreatedBooking; labels: string[] } | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .reference()
      .then((data) => alive && setReference(data))
      .catch((error) => alive && setReferenceError((error as Error).message));
    return () => {
      alive = false;
    };
  }, []);

  const readyPieces = useMemo(
    () => pieces.map(toPieceInput).filter((piece): piece is NonNullable<typeof piece> => piece !== null),
    [pieces],
  );
  const allPiecesComplete = readyPieces.length === pieces.length && pieces.length > 0;

  const senderProblems = partyProblems(sender);
  const receiverProblems = partyProblems(receiver);
  const partiesComplete = senderProblems.length === 0 && receiverProblems.length === 0;

  /**
   * The price is asked for whenever the shipment changes, and every response is
   * stamped with the request that produced it. A slow earlier reply arriving
   * after a fast later one must not overwrite the newer price — the customer
   * would be looking at a figure for a shipment they have already changed.
   */
  const sequence = useRef(0);
  useEffect(() => {
    if (!allPiecesComplete) {
      setQuote(null);
      return;
    }

    const mine = ++sequence.current;
    setPricing(true);
    const timer = setTimeout(() => {
      api
        .estimate({
          lane,
          service,
          pieces: readyPieces,
          declaredValue: coverRequested ? Math.round(Number(declaredValue || 0) * 100) : 0,
          coverRequested,
          pickupRequested,
        })
        .then(({ quote: fresh }) => {
          if (mine !== sequence.current) return;
          setQuote(fresh);
          setQuoteError(null);
        })
        .catch((error) => {
          if (mine !== sequence.current) return;
          setQuote(null);
          setQuoteError((error as Error).message);
        })
        .finally(() => {
          if (mine === sequence.current) setPricing(false);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [lane, service, readyPieces, coverRequested, declaredValue, pickupRequested, allPiecesComplete]);

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await bookings.create({
        lane,
        service,
        pieces: readyPieces,
        declaredValue: coverRequested ? Math.round(Number(declaredValue || 0) * 100) : 0,
        coverRequested,
        pickupRequested,
        sender,
        receiver,
      });
      setDone({ booking: result.booking, labels: result.labelsToExpect });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setSubmitError(
        error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (done) return <Confirmation booking={done.booking} labels={done.labels} />;

  const lanes = reference?.lanes ?? [];
  const canAdvance = step === 1 ? allPiecesComplete : step === 2 ? partiesComplete : false;

  return (
    <div className="mx-auto max-w-[1080px] px-5 py-10 sm:px-6 md:px-14 md:py-14">
      <h1 className="font-display text-[clamp(28px,5vw,42px)] font-extrabold leading-[1.05] tracking-[-0.03em]">
        Send a shipment
      </h1>
      <p className="mt-2 max-w-[52ch] text-[16px] leading-[1.6] text-ink-2">
        Three steps. You will see the price before you commit, and we re-check every box on our
        scales before charging you.
      </p>

      <ol className="mt-8 flex list-none flex-col gap-2 p-0 sm:flex-row sm:gap-3">
        {STEPS.map(({ n, label, hint }) => {
          const state = n === step ? 'current' : n < step ? 'done' : 'todo';
          return (
            <li key={n} className="flex-1">
              <button
                type="button"
                onClick={() => n < step && setStep(n)}
                disabled={n > step}
                className={`flex w-full items-center gap-3 rounded-[16px] border-2 px-4 py-3 text-left ${
                  state === 'current'
                    ? 'border-brand bg-brand-tint'
                    : state === 'done'
                      ? 'border-transparent bg-panel-2'
                      : 'border-transparent bg-panel-2 opacity-55'
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px] font-bold ${
                    state === 'todo' ? 'bg-panel text-ink-3' : 'bg-brand text-ink-invert'
                  }`}
                >
                  {state === 'done' ? '✓' : n}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-[15px] font-bold leading-tight">{label}</span>
                  <span className="text-[12px] leading-tight text-ink-3">{hint}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {referenceError && (
        <p className="mt-6 rounded-[14px] bg-alert-tint px-5 py-4 text-[15px] text-alert-ink">
          {referenceError} — the price list could not be loaded, so booking is unavailable right now.
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6">
          {step === 1 && (
            <StepOne
              reference={reference}
              lanes={lanes}
              lane={lane}
              setLane={setLane}
              service={service}
              setService={setService}
              pieces={pieces}
              setPieces={setPieces}
              coverRequested={coverRequested}
              setCover={setCover}
              declaredValue={declaredValue}
              setDeclaredValue={setDeclaredValue}
              pickupRequested={pickupRequested}
              setPickup={setPickup}
            />
          )}

          {step === 2 && (
            <>
              <PartyFields
                title="Who is sending"
                subtitle="The person dropping the boxes at our Colombo depot. We text this number when the price changes."
                value={sender}
                onChange={setSender}
                problems={senderProblems}
                askForId
              />
              <PartyFields
                title="Who is receiving"
                subtitle="The address in Australia. Customs needs a real street address — a PO box will not clear."
                value={receiver}
                onChange={setReceiver}
                problems={receiverProblems}
              />
            </>
          )}

          {step === 3 && (
            <Review
              quote={quote}
              lane={lanes.find((l) => l.code === lane)}
              service={service}
              sender={sender}
              receiver={receiver}
              pieces={pieces}
              onEditPieces={() => setStep(1)}
              onEditParties={() => setStep(2)}
            />
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as Step)}
                className="h-14 rounded-full bg-panel-2 px-7 text-[15px] font-bold text-ink-2"
              >
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                disabled={!canAdvance}
                onClick={() => setStep((s) => (s + 1) as Step)}
                className="h-14 rounded-full bg-brand px-8 text-[16px] font-bold text-ink-invert disabled:opacity-40"
              >
                {step === 1 ? 'Next — who and where' : 'Next — see the price'}
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting || !quote}
                onClick={submit}
                className="h-14 rounded-full bg-brand px-8 text-[16px] font-bold text-ink-invert disabled:opacity-40"
              >
                {submitting ? 'Booking…' : `Book it — ${quote?.totalDisplay ?? ''}`}
              </button>
            )}
          </div>

          {submitError && (
            <p className="rounded-[14px] bg-alert-tint px-5 py-4 text-[15px] text-alert-ink">
              {submitError}
            </p>
          )}
        </div>

        <PriceRail quote={quote} pricing={pricing} error={quoteError} complete={allPiecesComplete} />
      </div>
    </div>
  );
}

// ── Step 1: 1.1 item selection and customisation ───────────────────────────

function StepOne({
  reference,
  lanes,
  lane,
  setLane,
  service,
  setService,
  pieces,
  setPieces,
  coverRequested,
  setCover,
  declaredValue,
  setDeclaredValue,
  pickupRequested,
  setPickup,
}: {
  reference: Reference | null;
  lanes: Reference['lanes'];
  lane: string;
  setLane: (v: string) => void;
  service: ServiceMode;
  setService: (v: ServiceMode) => void;
  pieces: PieceDraft[];
  setPieces: (v: PieceDraft[]) => void;
  coverRequested: boolean;
  setCover: (v: boolean) => void;
  declaredValue: string;
  setDeclaredValue: (v: string) => void;
  pickupRequested: boolean;
  setPickup: (v: boolean) => void;
}) {
  const chosen = lanes.find((l) => l.code === lane);

  return (
    <>
      <section className="rounded-[22px] border border-rule bg-panel p-6">
        <h2 className="font-display text-[21px] font-bold tracking-[-0.02em]">Where is it going?</h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-[13px] font-bold text-ink-3">Destination</span>
            <select
              value={lane}
              onChange={(e) => setLane(e.target.value)}
              className="h-[52px] rounded-[14px] bg-panel-2 px-4 text-[16px] font-medium"
            >
              {lanes.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.from} → {l.to}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="flex flex-col gap-2 border-0 p-0">
            <legend className="mb-2 text-[13px] font-bold text-ink-3">How should it travel?</legend>
            <div className="grid grid-cols-2 gap-[10px]">
              {(['sea_lcl', 'air_express'] as ServiceMode[]).map((mode) => {
                const detail = chosen?.services.find((s) => s.service === mode);
                const active = service === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setService(mode)}
                    className={`flex flex-col gap-1 rounded-[14px] border-2 px-4 py-3 text-left ${
                      active ? 'border-brand bg-brand-tint' : 'border-rule bg-panel'
                    }`}
                  >
                    <span className="text-[15px] font-bold">
                      {mode === 'sea_lcl' ? 'By sea' : 'By air'}
                    </span>
                    <span className="tnum text-[12px] text-ink-3">
                      {detail ? `${detail.transit.min}–${detail.transit.max} days` : '—'}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
      </section>

      <PieceEditor pieces={pieces} onChange={setPieces} presets={reference?.packaging ?? []} />

      <section className="rounded-[22px] border border-rule bg-panel p-6">
        <h2 className="font-display text-[21px] font-bold tracking-[-0.02em]">Anything else?</h2>

        <label className="mt-5 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={coverRequested}
            onChange={(e) => setCover(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 accent-[var(--brand)]"
          />
          <span className="flex flex-col gap-1">
            <span className="text-[15px] font-semibold">Cover the contents</span>
            <span className="text-[14px] leading-[1.5] text-ink-3">
              {reference
                ? `${reference.cover.percent}% of what you say it is worth, minimum ${reference.cover.minimum}. Without it, our liability is the carrier's minimum.`
                : 'A percentage of the declared value.'}
            </span>
          </span>
        </label>

        {coverRequested && (
          <label className="mt-4 flex flex-col gap-2 pl-8">
            <span className="text-[13px] font-bold text-ink-3">What are the contents worth? (A$)</span>
            <input
              inputMode="decimal"
              value={declaredValue}
              onChange={(e) => setDeclaredValue(e.target.value)}
              placeholder="1800"
              className="tnum h-[52px] max-w-[220px] rounded-[14px] bg-panel-2 px-4 text-[17px] font-bold"
            />
          </label>
        )}

        <label className="mt-5 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={pickupRequested}
            onChange={(e) => setPickup(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 accent-[var(--brand)]"
          />
          <span className="flex flex-col gap-1">
            <span className="text-[15px] font-semibold">Collect from my address in Sri Lanka</span>
            <span className="text-[14px] leading-[1.5] text-ink-3">
              {reference
                ? `${reference.surcharges.originPickup} within the Colombo district. Otherwise drop the boxes at our Peliyagoda depot for free.`
                : 'Otherwise drop them at our depot.'}
            </span>
          </span>
        </label>
      </section>
    </>
  );
}

// ── Step 3: 1.3 check and submit ───────────────────────────────────────────

function Review({
  quote,
  lane,
  service,
  sender,
  receiver,
  pieces,
  onEditPieces,
  onEditParties,
}: {
  quote: Quote | null;
  lane: Reference['lanes'][number] | undefined;
  service: ServiceMode;
  sender: PartyDraft;
  receiver: PartyDraft;
  pieces: PieceDraft[];
  onEditPieces: () => void;
  onEditParties: () => void;
}) {
  return (
    <>
      <section className="rounded-[22px] border border-rule bg-panel p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-[21px] font-bold tracking-[-0.02em]">
            {pieces.length} {pieces.length === 1 ? 'box' : 'boxes'}
          </h2>
          <button type="button" onClick={onEditPieces} className="text-[14px] font-bold text-brand">
            Change
          </button>
        </div>
        <p className="mt-1 text-[14px] text-ink-3">
          {lane ? `${lane.from} → ${lane.to}` : ''} · {service === 'sea_lcl' ? 'by sea' : 'by air'}
        </p>
        <ul className="mt-4 flex list-none flex-col gap-2 p-0">
          {(quote?.pieces ?? []).map((piece) => (
            <li
              key={piece.index}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] bg-panel-2 px-4 py-3"
            >
              <span className="text-[15px] font-medium capitalize">
                {piece.packaging.replace(/_/g, ' ')}
              </span>
              <span className="tnum text-[14px] text-ink-3">
                {piece.dimensionsCm} cm · {piece.weightKg} kg · {piece.volume} m³
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-[22px] border border-rule bg-panel p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-[21px] font-bold tracking-[-0.02em]">Who and where</h2>
          <button type="button" onClick={onEditParties} className="text-[14px] font-bold text-brand">
            Change
          </button>
        </div>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {[
            { heading: 'From', party: sender },
            { heading: 'To', party: receiver },
          ].map(({ heading, party }) => (
            <div key={heading} className="flex flex-col gap-1">
              <span className="text-[12px] font-bold text-ink-4">{heading}</span>
              <span className="text-[15px] font-semibold">{party.name}</span>
              <span className="tnum text-[14px] text-ink-3">{party.mobile}</span>
              <span className="text-[14px] leading-[1.5] text-ink-3">
                {party.line1}
                {party.line2 ? `, ${party.line2}` : ''}
                <br />
                {party.city} {party.region} {party.postcode} · {party.country}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="rounded-[18px] bg-warn-tint px-5 py-4 text-[14px] leading-[1.6] text-warn-ink">
        <strong className="font-bold">This price is an estimate.</strong> We weigh and measure every
        box at our depot. If the real size differs from what you have entered, we send you the new
        price with the measurements and wait for your yes before charging anything.
      </div>
    </>
  );
}

// ── The price, always visible ──────────────────────────────────────────────

function PriceRail({
  quote,
  pricing,
  error,
  complete,
}: {
  quote: Quote | null;
  pricing: boolean;
  error: string | null;
  complete: boolean;
}) {
  return (
    <aside className="lg:sticky lg:top-6 lg:self-start">
      <div className="rounded-[22px] border-2 border-brand bg-panel p-6">
        <span className="text-[13px] font-bold text-ink-3">Your price</span>

        {!complete ? (
          <p className="mt-3 text-[15px] leading-[1.6] text-ink-3">
            Fill in the size and weight of each box and the price appears here.
          </p>
        ) : error ? (
          <p className="mt-3 text-[15px] leading-[1.6] text-alert-ink">{error}</p>
        ) : quote ? (
          <>
            <p className="tnum mt-2 font-display text-[clamp(30px,8vw,40px)] font-extrabold leading-none tracking-[-0.03em] text-brand">
              {quote.totalDisplay}
            </p>
            <p className="mt-2 text-[13px] text-ink-4">
              including GST · {quote.transit.min}–{quote.transit.max} days
            </p>

            <dl className="mt-5 flex flex-col gap-[10px] border-t border-rule pt-4">
              {quote.lines.map((line) => (
                <div key={line.code} className="flex items-baseline justify-between gap-3">
                  <dt className="text-[14px] text-ink-2">{line.label}</dt>
                  <dd className="tnum text-[14px] font-semibold">{line.amount}</dd>
                </div>
              ))}
            </dl>

            <p className="tnum mt-4 border-t border-rule pt-3 text-[13px] text-ink-4">
              {quote.chargeable.display} {quote.chargeable.unit} chargeable
              {quote.chargeable.minimumApplied ? ' (our minimum)' : ''} · {quote.weightKg} kg
            </p>
            {pricing && <p className="mt-2 text-[12px] text-ink-4">Updating…</p>}
          </>
        ) : (
          <p className="mt-3 text-[15px] text-ink-3">Working it out…</p>
        )}
      </div>

      <p className="mt-4 px-1 text-[13px] leading-[1.6] text-ink-4">
        Nothing is charged now. You pay once we have your boxes and the final measurements are
        agreed.
      </p>
    </aside>
  );
}

// ── Confirmation ───────────────────────────────────────────────────────────

function Confirmation({ booking, labels }: { booking: CreatedBooking; labels: string[] }) {
  return (
    <div className="mx-auto max-w-[720px] px-5 py-14 sm:px-6 md:py-20">
      <span className="inline-flex items-center gap-2 rounded-full bg-ok-tint px-4 py-2 text-[13px] font-bold text-ok-ink">
        <span className="h-2 w-2 rounded-full bg-ok" />
        Booked
      </span>

      <h1 className="mt-5 font-display text-[clamp(30px,6vw,44px)] font-extrabold leading-[1.05] tracking-[-0.03em]">
        That is all we need for now.
      </h1>

      <p className="tnum mt-5 rounded-[18px] bg-brand-tint px-6 py-5 text-[19px] font-bold text-brand-deep">
        {booking.reference}
      </p>
      <p className="mt-3 text-[16px] leading-[1.6] text-ink-2">
        We have texted and emailed this to you. {booking.pieceCount}{' '}
        {booking.pieceCount === 1 ? 'box' : 'boxes'}, estimated{' '}
        <span className="tnum font-bold">{booking.total}</span>, arriving in{' '}
        {booking.transit.min}–{booking.transit.max} days once it sails.
      </p>

      <section className="mt-8 rounded-[20px] border border-rule bg-panel p-6">
        <h2 className="font-display text-[19px] font-bold tracking-[-0.02em]">Bring your boxes to</h2>
        <p className="mt-2 text-[15px] leading-[1.6] text-ink-2">
          {booking.dropOff.depot}
          <br />
          {booking.dropOff.address}
          <br />
          <span className="text-ink-3">{booking.dropOff.cutOff}</span>
        </p>

        <h3 className="mt-6 text-[14px] font-bold text-ink-3">Write these on your boxes</h3>
        <ul className="mt-2 flex list-none flex-wrap gap-2 p-0">
          {labels.map((id) => (
            <li key={id} className="tnum rounded-[10px] bg-panel-2 px-3 py-2 text-[14px] font-semibold">
              {id}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] leading-[1.6] text-ink-4">
          These become live tracking numbers the moment we physically receive each box — we print
          the real barcode labels here. Writing them on now just helps us match them up.
        </p>
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          to={`/track?id=${booking.reference}`}
          className="flex h-14 items-center justify-center rounded-full bg-brand px-8 text-[16px] font-bold text-ink-invert"
        >
          Track this shipment
        </Link>
        <Link
          to="/book"
          onClick={() => window.location.reload()}
          className="flex h-14 items-center justify-center rounded-full bg-panel-2 px-7 text-[15px] font-bold text-ink-2"
        >
          Send another
        </Link>
      </div>
    </div>
  );
}
