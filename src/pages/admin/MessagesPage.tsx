import { useEffect, useState } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { documents, type NotificationRow } from '@/lib/depot';
import { ApiError } from '@/lib/http';

const EVENT_LABELS: Record<string, string> = {
  booking_confirmed: 'Booking confirmed',
  received_at_depot: 'Arrived at depot',
  price_changed: 'Price changed',
  price_settled: 'Price settled',
  price_reminder: 'Reminder',
  invoice_issued: 'Invoice issued',
  loaded_into_container: 'Loaded',
  departed: 'Departed',
};

const EVENT_TONE: Record<string, string> = {
  price_changed: 'bg-alert-tint text-alert-ink',
  price_reminder: 'bg-warn-tint text-warn-ink',
  invoice_issued: 'bg-accent-tint text-accent',
};

const when = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * Requirement 3.1, the audit half.
 *
 * "You never told me about the price change" is the most common dispute in
 * consolidated freight, and it is unanswerable without a record of what was
 * sent, to which number, and when. Every message the system generates lands
 * here, body included.
 */
export function MessagesPage() {
  const [filter, setFilter] = useState('');
  const [applied, setApplied] = useState<string | undefined>(undefined);
  const { data, error, loading } = useAsync(() => documents.notifications(applied), [applied]);
  const [open, setOpen] = useState<NotificationRow | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Close the reader when the list underneath it changes.
  useEffect(() => setOpen(null), [applied]);

  const rows = data?.notifications ?? [];
  const health = data?.health;

  const requeue = async (row: NotificationRow) => {
    const key = `${row.entityId}:${row.event}`;
    setBusy(key);
    try {
      const { requeued } = await documents.retryNotification(row.entityId, row.event);
      setNotice(
        requeued > 0
          ? `${requeued} message${requeued === 1 ? '' : 's'} back in the queue. The dispatcher picks them up within fifteen seconds.`
          : 'Nothing to requeue — it may already have gone.',
      );
    } catch (caught) {
      setNotice(caught instanceof ApiError ? caught.message : 'Could not requeue that');
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <header className="flex h-[68px] items-center justify-between border-b border-rule bg-panel px-5 sm:px-8">
        <span className="text-[19px] font-bold tracking-[-0.015em]">Messages</span>
        <span className="tnum text-[13px] font-medium text-ink-4">{rows.length} shown</span>
      </header>

      <div className="flex flex-col gap-5 px-5 pb-9 pt-[26px] sm:px-8">
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            setApplied(filter.trim() ? filter.trim().toUpperCase() : undefined);
          }}
        >
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter by booking reference"
            aria-label="Booking reference"
            className="tnum h-11 min-w-0 flex-grow rounded-[10px] bg-panel-2 px-4 text-[14px] uppercase placeholder:normal-case"
          />
          <button
            type="submit"
            className="h-11 shrink-0 rounded-[10px] bg-brand px-5 text-[13px] font-bold text-ink-invert"
          >
            Filter
          </button>
          {applied && (
            <button
              type="button"
              onClick={() => {
                setFilter('');
                setApplied(undefined);
              }}
              className="h-11 shrink-0 rounded-[10px] bg-panel-2 px-4 text-[13px] font-bold text-ink-2"
            >
              Clear
            </button>
          )}
        </form>

        {health && (
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Waiting to go', value: health.pending, urgent: false },
              { label: 'Failed', value: health.failed, urgent: health.failed > 0 },
              { label: 'Sent today', value: health.sentToday, urgent: false },
            ].map((tile) => (
              <div
                key={tile.label}
                className={`flex flex-col gap-2 rounded-[14px] border bg-panel p-5 ${
                  tile.urgent ? 'border-alert' : 'border-rule'
                }`}
              >
                <span
                  className={`text-[13px] font-semibold ${tile.urgent ? 'text-alert-ink' : 'text-ink-3'}`}
                >
                  {tile.label}
                </span>
                <span
                  className={`tnum text-[32px] font-bold leading-none ${
                    tile.urgent ? 'text-alert-ink' : ''
                  }`}
                >
                  {tile.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {notice && (
          <p className="rounded-[12px] bg-ok-tint px-5 py-4 text-[14px] text-ok-ink">{notice}</p>
        )}

        {loading && <p className="text-[15px] text-ink-3">Loading…</p>}
        {error && (
          <p className="rounded-[12px] bg-alert-tint px-5 py-4 text-[14px] text-alert-ink">
            {error.message}
          </p>
        )}

        {data && (
          <div className="rounded-[14px] border border-rule bg-panel">
            {rows.length === 0 ? (
              <p className="px-5 py-12 text-center text-[15px] text-ink-3">
                Nothing sent yet{applied ? ` for ${applied}` : ''}.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <div className="grid min-w-[840px] grid-cols-[150px_130px_70px_minmax(0,1fr)_190px_90px] gap-3 border-b border-rule bg-panel-2 px-5 py-3">
                  {['When', 'Booking', 'Via', 'What was sent', 'To', 'Status'].map((head) => (
                    <span key={head} className="text-[11px] font-bold text-ink-3">
                      {head}
                    </span>
                  ))}
                </div>

                {rows.map((row, index) => (
                  <button
                    key={`${row.bookingRef}-${row.event}-${row.channel}-${index}`}
                    type="button"
                    onClick={() => setOpen(row)}
                    className="grid min-w-[840px] w-full grid-cols-[150px_130px_70px_minmax(0,1fr)_190px_90px] items-center gap-3 border-b border-rule-2 px-5 py-3 text-left last:border-b-0"
                  >
                    <span className="tnum text-[12px] text-ink-3">{when(row.createdAt)}</span>
                    <span className="tnum text-[13px] font-semibold">{row.bookingRef}</span>
                    <span className="text-[12px] uppercase text-ink-3">{row.channel}</span>
                    <span
                      className={`inline-flex w-fit items-center rounded-[7px] px-[10px] py-[5px] text-[11px] font-bold ${
                        EVENT_TONE[row.event] ?? 'bg-panel-2 text-ink-2'
                      }`}
                    >
                      {EVENT_LABELS[row.event] ?? row.event}
                    </span>
                    <span className="tnum truncate text-[12px] text-ink-3">{row.to}</span>
                    <span
                      className={`inline-flex w-fit items-center rounded-[7px] px-[10px] py-[5px] text-[11px] font-bold ${
                        row.status === 'sent'
                          ? 'bg-ok-tint text-ok-ink'
                          : row.status === 'failed'
                            ? 'bg-alert-tint text-alert-ink'
                            : 'bg-warn-tint text-warn-ink'
                      }`}
                      title={row.error ?? undefined}
                    >
                      {row.status}
                      {row.attempts > 1 ? ` ·${row.attempts}` : ''}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {open && (
          <section className="rounded-[14px] border-2 border-brand bg-panel">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-5 py-4">
              <div className="flex min-w-0 flex-col">
                <span className="text-[15px] font-bold">{open.subject}</span>
                <span className="tnum text-[12px] text-ink-3">
                  {open.channel} to {open.to} · {when(open.createdAt)}
                  {open.sentAt ? ` · delivered ${when(open.sentAt)}` : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="text-[13px] font-bold text-ink-3"
              >
                Close
              </button>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap px-5 py-4 font-sans text-[14px] leading-[1.6] text-ink-2">
              {open.body}
            </pre>

            <div className="flex flex-wrap items-center gap-4 border-t border-rule px-5 py-4">
              <span className="tnum text-[12px] text-ink-4">
                {open.attempts} attempt{open.attempts === 1 ? '' : 's'}
                {open.transport ? ` · via ${open.transport}` : ''}
              </span>
              {open.error && (
                <span className="text-[12px] font-medium text-alert-ink">{open.error}</span>
              )}
              {open.status === 'failed' && (
                <button
                  type="button"
                  disabled={busy === `${open.entityId}:${open.event}`}
                  onClick={() => void requeue(open)}
                  className="ml-auto h-10 rounded-[10px] bg-brand px-4 text-[13px] font-bold text-ink-invert disabled:opacity-40"
                >
                  Try again
                </button>
              )}
            </div>
          </section>
        )}

        <p className="text-[13px] leading-[1.6] text-ink-4">
          Messages are queued, then handed to a transport by a dispatcher that retries with backoff
          and gives up after five attempts. Which transport carries them is configuration:
          <span className="tnum"> log</span> by default, so nothing reaches a customer until SMTP or
          an SMS provider is set in the environment. The database enforces one message per booking,
          event and channel, so a retry cannot send a second text about the same price change.
        </p>

      </div>
    </>
  );
}
