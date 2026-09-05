import { useState } from 'react';
import { admin } from '@/lib/admin';
import { ApiError } from '@/lib/http';

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
  onSettled,
}: {
  reference: string;
  waiting: string;
  canApprove: boolean;
  canWaive: boolean;
  canRemind: boolean;
  onSettled: () => void;
}) {
  const [pending, setPending] = useState<Pending>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null);

  const run = async (work: () => Promise<unknown>, done?: () => void) => {
    setBusy(true);
    setMessage(null);
    try {
      await work();
      done?.();
      return true;
    } catch (e) {
      setMessage({
        tone: 'bad',
        text: e instanceof ApiError ? e.message : 'That did not work',
      });
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
            onClick={() =>
              void run(
                () =>
                  pending === 'approve'
                    ? admin.approve(reference, reason)
                    : admin.waive(reference, reason),
                () => {
                  setPending(null);
                  setReason('');
                  onSettled();
                },
              )
            }
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
            const ok = await run(() => admin.remind(reference));
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
