import type { PartyInput } from '@/lib/depot';

/**
 * Requirement 1.2: sender and receiver, in full.
 *
 * The same component for both sides, because the fields genuinely are the same
 * and two near-identical forms drift apart the first time one is edited.
 */
export type PartyDraft = PartyInput;

export const blankParty = (country: string): PartyDraft => ({
  name: '',
  mobile: '',
  email: '',
  line1: '',
  line2: '',
  city: '',
  region: '',
  postcode: '',
  country,
});

const MOBILE = /^\+?[0-9][0-9 ()-]{6,19}$/;

/**
 * Validated to the same rules as the server, because a form that accepts what
 * the API will reject is worse than one that never accepted it. The server
 * still checks: this is courtesy, not enforcement.
 */
export const partyProblems = (party: PartyDraft): string[] => {
  const problems: string[] = [];
  if (party.name.trim().length < 2) problems.push('name');
  if (!MOBILE.test(party.mobile.trim())) problems.push('mobile');
  if (party.line1.trim().length < 3) problems.push('line1');
  if (party.city.trim().length < 2) problems.push('city');
  if (party.postcode.trim().length < 3) problems.push('postcode');
  if (party.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(party.email.trim())) problems.push('email');
  return problems;
};

const COUNTRIES = [
  ['LK', 'Sri Lanka'],
  ['AU', 'Australia'],
];

export function PartyFields({
  title,
  subtitle,
  value,
  onChange,
  problems,
  askForId = false,
}: {
  title: string;
  subtitle: string;
  value: PartyDraft;
  onChange: (party: PartyDraft) => void;
  problems: string[];
  askForId?: boolean;
}) {
  const set = (patch: Partial<PartyDraft>) => onChange({ ...value, ...patch });
  const wrong = (field: string) => problems.includes(field) && Boolean(fieldValue(value, field));

  return (
    <section className="rounded-[22px] border border-rule bg-panel p-6">
      <h2 className="font-display text-[21px] font-bold tracking-[-0.02em]">{title}</h2>
      <p className="mt-1 text-[14px] leading-[1.55] text-ink-3">{subtitle}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field
          label="Full name"
          value={value.name}
          onChange={(v) => set({ name: v })}
          invalid={wrong('name')}
          autoComplete="name"
          className="sm:col-span-2"
        />
        <Field
          label="Mobile number"
          value={value.mobile}
          onChange={(v) => set({ mobile: v })}
          invalid={wrong('mobile')}
          hint="With the country code, e.g. +94 77 123 4567"
          inputMode="tel"
          autoComplete="tel"
          tabular
        />
        <Field
          label="Email (optional)"
          value={value.email ?? ''}
          onChange={(v) => set({ email: v })}
          invalid={wrong('email')}
          inputMode="email"
          autoComplete="email"
        />
        <Field
          label="Street address"
          value={value.line1}
          onChange={(v) => set({ line1: v })}
          invalid={wrong('line1')}
          autoComplete="address-line1"
          className="sm:col-span-2"
        />
        <Field
          label="Apartment, unit (optional)"
          value={value.line2 ?? ''}
          onChange={(v) => set({ line2: v })}
          autoComplete="address-line2"
          className="sm:col-span-2"
        />
        <Field
          label="Suburb or city"
          value={value.city}
          onChange={(v) => set({ city: v })}
          invalid={wrong('city')}
          autoComplete="address-level2"
        />
        <Field
          label="State or province"
          value={value.region ?? ''}
          onChange={(v) => set({ region: v })}
          autoComplete="address-level1"
        />
        <Field
          label="Postcode"
          value={value.postcode}
          onChange={(v) => set({ postcode: v })}
          invalid={wrong('postcode')}
          autoComplete="postal-code"
          tabular
        />
        <label className="flex flex-col gap-2">
          <span className="text-[13px] font-bold text-ink-3">Country</span>
          <select
            value={value.country}
            onChange={(e) => set({ country: e.target.value })}
            className="h-[52px] rounded-[14px] bg-panel-2 px-4 text-[16px] font-medium"
          >
            {COUNTRIES.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </label>

        {askForId && (
          <Field
            label="NIC or passport number (optional)"
            value={value.idNumber ?? ''}
            onChange={(v) => set({ idNumber: v })}
            hint="Sri Lanka Customs asks for this on export. Providing it now avoids a phone call later."
            className="sm:col-span-2"
            tabular
          />
        )}
      </div>
    </section>
  );
}

const fieldValue = (party: PartyDraft, field: string): string =>
  (party as unknown as Record<string, string | undefined>)[field] ?? '';

function Field({
  label,
  value,
  onChange,
  invalid = false,
  hint,
  className = '',
  tabular = false,
  ...input
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  hint?: string;
  className?: string;
  tabular?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'className'>) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="text-[13px] font-bold text-ink-3">{label}</span>
      <input
        {...input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
        className={`h-[52px] rounded-[14px] px-4 text-[16px] ${tabular ? 'tnum' : ''} ${
          invalid ? 'border-2 border-alert bg-alert-tint' : 'bg-panel-2'
        }`}
      />
      {hint && <span className="text-[12px] leading-[1.5] text-ink-4">{hint}</span>}
    </label>
  );
}
