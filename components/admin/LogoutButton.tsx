'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const signOut = async () => {
    setBusy(true);
    try {
      await fetch(`${API_URL}/v1/auth/logout`, { method: 'POST', credentials: 'include' });
    } finally {
      router.replace('/admin/login');
      router.refresh();
    }
  };

  return (
    <button
      onClick={signOut}
      disabled={busy}
      className="h-8 rounded-lg border border-rule bg-panel text-[12px] font-semibold text-ink-2 disabled:opacity-60"
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
