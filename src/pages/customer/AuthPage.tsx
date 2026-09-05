import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useCustomer } from '@/hooks/useCustomer';
import { ApiError } from '@/lib/http';

/**
 * Register and sign in, one component.
 *
 * The two forms share every field the smaller one has, and splitting them into
 * separate files is how the password rules end up stated differently on each.
 */
export function AuthPage({ mode }: { mode: 'register' | 'sign-in' }) {
  const { account, checking, register, signIn } = useCustomer();
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Where they were headed before being asked to sign in.
  const next = (location.state as { from?: string } | null)?.from ?? '/account';

  if (checking) {
    return (
      <div className="mx-auto max-w-[440px] px-5 py-20 text-center">
        <p className="text-[15px] text-ink-3">One moment…</p>
      </div>
    );
  }

  if (account) return <Navigate to={next} replace />;

  const registering = mode === 'register';

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (registering) {
        await register({ name, email, mobile, password });
      } else {
        await signIn(email, password);
      }
      navigate(next, { replace: true });
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.code === 'network_unreachable'
          ? 'Cannot reach CargoFlow. Please try again in a moment.'
          : caught instanceof ApiError
            ? caught.message
            : 'That did not work. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[440px] px-5 py-12 sm:px-6 md:py-16">
      <h1 className="font-display text-[clamp(28px,6vw,38px)] font-extrabold leading-[1.05] tracking-[-0.03em]">
        {registering ? 'Create your account' : 'Welcome back'}
      </h1>
      <p className="mt-3 text-[16px] leading-[1.6] text-ink-2">
        {registering
          ? 'You need an account to send a shipment. It keeps your invoices and past shipments in one place.'
          : 'Sign in to book a shipment, follow your boxes and see your invoices.'}
      </p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
        {registering && (
          <Field label="Your full name" value={name} onChange={setName} autoComplete="name" required />
        )}

        <Field
          label="Email address"
          value={email}
          onChange={setEmail}
          type="email"
          autoComplete="email"
          required
        />

        {registering && (
          <Field
            label="Mobile number"
            value={mobile}
            onChange={setMobile}
            type="tel"
            autoComplete="tel"
            hint="With the country code. We text this number the moment a price changes."
            tabular
            required
          />
        )}

        <Field
          label="Password"
          value={password}
          onChange={setPassword}
          type="password"
          autoComplete={registering ? 'new-password' : 'current-password'}
          hint={registering ? 'At least 10 characters. A short phrase works well.' : undefined}
          required
        />

        {error && (
          <p className="rounded-[14px] bg-alert-tint px-5 py-4 text-[15px] leading-[1.55] text-alert-ink">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-2 h-14 rounded-full bg-brand text-[16px] font-bold text-ink-invert disabled:opacity-50"
        >
          {busy ? 'One moment…' : registering ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <p className="mt-7 text-[15px] text-ink-3">
        {registering ? 'Already have an account? ' : 'New to CargoFlow? '}
        <Link
          to={registering ? '/sign-in' : '/register'}
          state={location.state}
          className="font-bold text-brand"
        >
          {registering ? 'Sign in' : 'Create an account'}
        </Link>
      </p>

      <p className="mt-4 text-[14px] leading-[1.6] text-ink-4">
        You do not need an account to{' '}
        <a href="/#quote" className="font-semibold text-ink-3 underline">
          get a price
        </a>{' '}
        or to{' '}
        <Link to="/track" className="font-semibold text-ink-3 underline">
          track a box
        </Link>
        .
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
  tabular = false,
  ...input
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  tabular?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[13px] font-bold text-ink-3">{label}</span>
      <input
        {...input}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-[54px] rounded-[14px] bg-panel-2 px-4 text-[16px] ${tabular ? 'tnum' : ''}`}
      />
      {hint && <span className="text-[13px] leading-[1.5] text-ink-4">{hint}</span>}
    </label>
  );
}
