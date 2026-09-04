'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Pending = 'approve' | 'waive' | null;

/**
 * Approve, waive or nudge.
 *
 * Approving and waiving both demand a typed reason, because they override what
 * a customer has not agreed to. The server demands it too — this prompt is a
 * courtesy, not the control.
 */
export function AdjustmentActions({
  reference,
  waiting,
  canApprove,
  canWaive,
  canRemind,
}: {
  reference: string;
  waiting: string;
  canApprove: boolean;
  canWaive: boolean;
  canRemind: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<Pending>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null);

  const call = async (path: string, body?: unknown) => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_URL}/v1/admin/adjustments/${reference}/${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage({ tone: 'bad', text: result?.error?.message ?? 'That did not work' });
        return false;
      }

      setPending(null);
      setReason('');
      router.refresh();
      return true;
    } catch {
      setMessage({ tone: 'bad', text: 'Cannot reach the API' });
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (pending) {
    return (
      <div className="flex flex-col gap-2">
        <label className="text-[12px] font-semibold text-ink-2">
          Why are you {pending === 'approve' ? 'approving' : 'waiving'} this? It goes on the record.
        </label>
        <div className="flex gap-2">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            autoFocus
            placeholder="Customer phoned the depot and agreed"
            className="h-9 min-w-0 flex-grow rounded-lg border border-rule bg-panel px-3 text-[13px]"
          />
          <button
            disabled={busy || reason.trim().length < 4}
            onClick={() => void call(pending, { reason })}
            className="h-9 shrink-0 rounded-lg bg-brand px-4 text-[13px] font-bold text-white disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Confirm'}
          </button>
          <button
            disabled={busy}
            onClick={() => {
              setPending(null);
              setMessage(null);
            }}
            className="h-9 shrink-0 rounded-lg border border-rule px-3 text-[13px] font-semibold text-ink-2"
          >
            Cancel
          </button>
        </div>
        {message && (
          <span className={`text-[12px] ${message.tone === 'bad' ? 'text-alert-ink' : 'text-ok-ink'}`}>
            {message.text}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="tnum mr-1 text-[12px] text-ink-4">waiting {waiting}</span>

      {canApprove && (
        <button
          onClick={() => setPending('approve')}
          className="h-8 rounded-lg bg-brand px-3 text-[12px] font-bold text-white"
        >
          Approve for them
        </button>
      )}
      {canWaive && (
        <button
          onClick={() => setPending('waive')}
          className="h-8 rounded-lg border border-rule bg-panel px-3 text-[12px] font-semibold text-ink-2"
        >
          Waive
        </button>
      )}
      {canRemind && (
        <button
          disabled={busy}
          onClick={async () => {
            const ok = await call('remind');
            if (ok) setMessage({ tone: 'ok', text: 'Reminder queued' });
          }}
          className="h-8 rounded-lg border border-rule bg-panel px-3 text-[12px] font-semibold text-ink-2 disabled:opacity-50"
        >
          {busy ? '…' : 'Remind'}
        </button>
      )}

      {message && (
        <span className={`text-[12px] ${message.tone === 'bad' ? 'text-alert-ink' : 'text-ok-ink'}`}>
          {message.text}
        </span>
      )}
    </div>
  );
}
