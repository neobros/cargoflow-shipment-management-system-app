import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { landingFor } from '@/lib/admin';
import { ApiError } from '@/lib/http';

export function LoginForm({
  redirectTo,
  defaultEmail = 'billing@cargoflow.test',
}: {
  redirectTo?: string;
  defaultEmail?: string;
} = {}) {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const signedIn = await signIn(email, password);
      // An explicit redirect (the depot's own sign-in) wins; otherwise go where
      // this role can actually work rather than to a fixed page.
      navigate(redirectTo ?? landingFor(signedIn), { replace: true });
    } catch (e) {
      setError(
        e instanceof ApiError && e.code === 'network_unreachable'
          ? 'Cannot reach the CargoFlow API. Is it running on port 4000?'
          : e instanceof ApiError
            ? e.message
            : 'That did not work. Try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-7 flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-[13px] font-bold text-ink-2">Work email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
          className="h-11 rounded-[10px] border border-rule bg-panel px-4 text-[15px]"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-[13px] font-bold text-ink-2">Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          className="h-11 rounded-[10px] border border-rule bg-panel px-4 text-[15px]"
        />
      </label>

      {error && (
        <p role="alert" className="rounded-[10px] bg-alert-tint px-4 py-3 text-[14px] text-alert-ink">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-1 h-11 rounded-[10px] bg-brand text-[15px] font-bold text-white disabled:opacity-60"
      >
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
