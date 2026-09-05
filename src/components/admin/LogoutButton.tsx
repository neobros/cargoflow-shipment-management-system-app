import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function LogoutButton({ redirectTo = '/admin/login' }: { redirectTo?: string } = {}) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    setBusy(true);
    try {
      await signOut();
    } finally {
      navigate(redirectTo, { replace: true });
    }
  };

  return (
    <button
      onClick={handle}
      disabled={busy}
      className="h-8 rounded-lg border border-rule bg-panel px-3 text-[12px] font-semibold text-ink-2 disabled:opacity-60"
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
