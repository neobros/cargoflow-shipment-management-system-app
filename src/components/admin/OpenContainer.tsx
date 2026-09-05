import { useEffect, useState } from 'react';
import { api, type Reference } from '@/lib/api';
import { containers } from '@/lib/depot';
import { ApiError } from '@/lib/http';

const TYPES = ['20ft standard', '40ft standard', '40ft high cube'];

/** yyyy-mm-dd, `days` from now — the shape a date input wants. */
const inDays = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

/**
 * Open a container for loading.
 *
 * A sailing is three dates and a vessel, and getting them in the wrong order is
 * the mistake worth guarding: a cut-off after the ship leaves means accepting
 * boxes for a voyage that has gone. The server refuses that, and so does this
 * form, so nobody has to submit to find out.
 *
 * Defaults are a fortnight out, because that is the rhythm of the sailings on
 * these lanes — the operator adjusts rather than types four fields from blank.
 */
export function OpenContainer({ onOpened }: { onOpened: (message: string) => void }) {
  const [reference, setReference] = useState<Reference | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState(TYPES[1]!);
  const [vessel, setVessel] = useState('');
  const [voyage, setVoyage] = useState('');
  const [lane, setLane] = useState('LKCMB-AUMEL');
  const [cutOff, setCutOff] = useState(inDays(12));
  const [sails, setSails] = useState(inDays(14));
  const [eta, setEta] = useState(inDays(35));

  useEffect(() => {
    let alive = true;
    api
      .reference()
      .then((data) => {
        if (!alive) return;
        setReference(data);
        setLane((current) => data.lanes.find((l) => l.code === current)?.code ?? data.lanes[0]?.code ?? current);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  // Same two rules the server enforces, checked here so the form can say so
  // before anyone presses the button.
  const dateProblem =
    cutOff > sails
      ? 'The cut-off has to be on or before the sailing date.'
      : eta < sails
        ? 'Arrival has to be on or after the sailing date.'
        : null;

  const ready = vessel.trim().length > 1 && voyage.trim().length > 0 && !dateProblem;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const { container } = await containers.create({
        type,
        vessel: vessel.trim(),
        voyage: voyage.trim(),
        lane,
        // Dates arrive as yyyy-mm-dd; the API wants full timestamps.
        cutOffAt: new Date(`${cutOff}T00:00:00.000Z`).toISOString(),
        sailsAt: new Date(`${sails}T00:00:00.000Z`).toISOString(),
        etaAt: new Date(`${eta}T00:00:00.000Z`).toISOString(),
      });
      setVessel('');
      setVoyage('');
      setExpanded(false);
      onOpened(
        `${container.containerNumber} opened for ${container.destinationLabel} on ${container.vessel} ${container.voyage}. It can take boxes now.`,
      );
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not open that container');
    } finally {
      setBusy(false);
    }
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex h-12 w-fit items-center rounded-[10px] bg-brand px-5 text-[14px] font-bold text-ink-invert"
      >
        Open a container
      </button>
    );
  }

  return (
    <section className="rounded-[14px] border border-rule bg-panel">
      <div className="flex items-center justify-between border-b border-rule px-5 py-4">
        <span className="text-base font-bold tracking-[-0.01em]">Open a container</span>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-[13px] font-semibold text-ink-3"
        >
          Cancel
        </button>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
        <Field label="Vessel" value={vessel} onChange={setVessel} placeholder="MV Serendib Star" />
        <Field label="Voyage" value={voyage} onChange={setVoyage} placeholder="V.0247E" tabular />

        <label className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-ink-3">Container type</span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="h-12 rounded-[10px] border border-rule bg-panel-2 px-4 text-[15px]"
          >
            {TYPES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-ink-3">Destination</span>
          <select
            value={lane}
            onChange={(event) => setLane(event.target.value)}
            className="h-12 rounded-[10px] border border-rule bg-panel-2 px-4 text-[15px]"
          >
            {(reference?.lanes ?? []).map((option) => (
              <option key={option.code} value={option.code}>
                {option.from} → {option.to}
              </option>
            ))}
          </select>
        </label>

        <Field label="Cut-off" value={cutOff} onChange={setCutOff} type="date" tabular />
        <Field label="Sails" value={sails} onChange={setSails} type="date" tabular />
        <Field label="Arrives" value={eta} onChange={setEta} type="date" tabular />
      </div>

      <div className="flex flex-col gap-3 border-t border-rule px-5 py-4 sm:flex-row sm:items-center">
        <button
          type="button"
          disabled={!ready || busy}
          onClick={submit}
          className="h-12 shrink-0 rounded-[10px] bg-brand px-6 text-[14px] font-bold text-ink-invert disabled:opacity-40"
        >
          {busy ? 'Opening…' : 'Open it'}
        </button>

        <p className="text-[13px] leading-[1.5] text-ink-3">
          {dateProblem ?? 'The container number is issued automatically. Boxes can be loaded as soon as it is open.'}
        </p>
      </div>

      {error && (
        <p className="mx-5 mb-5 rounded-[12px] bg-alert-tint px-5 py-4 text-[14px] text-alert-ink">
          {error}
        </p>
      )}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  tabular = false,
  ...input
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  tabular?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'className'>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[13px] font-semibold text-ink-3">{label}</span>
      <input
        {...input}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-12 rounded-[10px] border border-rule bg-panel-2 px-4 text-[15px] ${
          tabular ? 'tnum' : ''
        }`}
      />
    </label>
  );
}
