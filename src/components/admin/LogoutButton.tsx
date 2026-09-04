import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function LogoutButton() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    setBusy(true);
    try {
      await signOut();
    } finally {
      navigate('/admin/login', { replace: true });
    }
  };

  return (
    <button
      onClick={handle}
      disabled={busy}
      className="h-8 rounded-lg border border-rule bg-panel text-[12px] font-semibold text-ink-2 disabled:opacity-60"
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
