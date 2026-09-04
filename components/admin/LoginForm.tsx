'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('billing@cargoflow.test');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/v1/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        // The API sets an httpOnly cookie; this is what lets it come back.
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setError(body?.error?.message ?? 'That did not work. Try again.');
        return;
      }

      // Refresh so the server components re-run with the new session.
      router.replace('/admin');
      router.refresh();
    } catch {
      setError('Cannot reach the CargoFlow API. Is it running on port 4000?');
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
