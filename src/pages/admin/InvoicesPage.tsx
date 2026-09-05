import { useCallback, useEffect, useState } from 'react';
import { InvoiceSheet } from '@/components/admin/InvoiceSheet';
import { admin, type AdminBooking } from '@/lib/admin';
import { documents, type Invoice } from '@/lib/depot';
import { ApiError } from '@/lib/http';

const day = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

/** Requirements 3.1 and 3.2 for the customer-facing financial document. */
export function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [uninvoiced, setUninvoiced] = useState<AdminBooking[]>([]);
  const [open, setOpen] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [{ invoices: all }, { bookings }] = await Promise.all([
        documents.invoices(),
        admin.bookings(),
      ]);
      setInvoices(all);

      const invoiced = new Set(all.filter((i) => i.status !== 'void').map((i) => i.bookingRef));
      // A booking still waiting on a price change is not billable, and showing
      // it here with an Issue button that always fails would be a lie.
      setUninvoiced(
        bookings.filter((b) => !invoiced.has(b.reference) && b.status !== 'rerate_held'),
      );
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not load invoices');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const act = async (key: string, work: () => Promise<string>) => {
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      setNotice(await work());
      await refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'That did not work');
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <header className="flex h-[68px] items-center justify-between border-b border-rule bg-panel px-5 sm:px-8">
        <span className="text-[19px] font-bold tracking-[-0.015em]">Invoices</span>
        <span className="tnum text-[13px] font-medium text-ink-4">
          {invoices.filter((i) => i.status === 'issued').length} unpaid
        </span>
      </header>

      <div className="flex flex-col gap-5 px-5 pb-9 pt-[26px] sm:px-8">
        {error && (
          <p className="rounded-[12px] bg-alert-tint px-5 py-4 text-[14px] text-alert-ink">{error}</p>
        )}
        {notice && (
          <p className="rounded-[12px] bg-ok-tint px-5 py-4 text-[14px] text-ok-ink">{notice}</p>
        )}

        {uninvoiced.length > 0 && (
          <section className="rounded-[14px] border border-rule bg-panel">
            <div className="border-b border-rule px-5 py-4">
              <span className="text-base font-bold">Ready to invoice</span>
              <p className="mt-1 text-[13px] text-ink-3">
                Priced on the depot's measurements where we have them, on the customer's figures
                where we do not.
              </p>
            </div>
            {uninvoiced.map((booking) => (
              <div
                key={booking.reference}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-rule-2 px-5 py-4 last:border-b-0"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="tnum text-[14px] font-semibold">{booking.reference}</span>
                  <span className="text-[13px] text-ink-3">
                    {booking.customerName} · {booking.pieceCount} boxes · {booking.lane}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="tnum text-[15px] font-bold">{booking.currentTotal}</span>
                  <button
                    type="button"
                    disabled={busy === booking.reference}
                    onClick={() =>
                      act(booking.reference, async () => {
                        const { invoice } = await documents.issue(booking.reference);
                        setOpen(invoice);
                        return `${invoice.number} issued for ${booking.reference} and emailed to the customer.`;
                      })
                    }
                    className="h-10 rounded-[10px] bg-brand px-4 text-[13px] font-bold text-ink-invert disabled:opacity-40"
                  >
                    {busy === booking.reference ? 'Issuing…' : 'Issue invoice'}
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}

        <section className="rounded-[14px] border border-rule bg-panel">
          <div className="border-b border-rule px-5 py-4">
            <span className="text-base font-bold">Issued</span>
          </div>

          {invoices.length === 0 ? (
            <p className="px-5 py-12 text-center text-[15px] text-ink-3">
              No invoices yet. They appear here once a shipment is measured and any price change is
              settled.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <div className="grid min-w-[820px] grid-cols-[150px_130px_minmax(0,1fr)_110px_110px_100px_110px] gap-3 border-b border-rule bg-panel-2 px-5 py-3">
                {['Invoice', 'Booking', 'Customer', 'Total', 'Due', 'Basis', ''].map(
                  (head, index) => (
                    <span key={head || index} className="text-[11px] font-bold text-ink-3">
                      {head}
                    </span>
                  ),
                )}
              </div>

              {invoices.map((invoice) => (
                <div
                  key={invoice.number}
                  className="grid min-w-[820px] grid-cols-[150px_130px_minmax(0,1fr)_110px_110px_100px_110px] items-center gap-3 border-b border-rule-2 px-5 py-4 last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => setOpen(invoice)}
                    className="tnum text-left text-[13px] font-semibold text-brand"
                  >
                    {invoice.number}
                  </button>
                  <span className="tnum text-[13px] text-ink-3">{invoice.bookingRef}</span>
                  <span className="truncate text-[14px]">{invoice.customerName}</span>
                  <span className="tnum text-right text-[14px] font-bold">{invoice.total}</span>
                  <span
                    className={`tnum text-right text-[13px] ${
                      invoice.overdue ? 'font-bold text-alert-ink' : 'text-ink-3'
                    }`}
                  >
                    {day(invoice.dueAt)}
                  </span>
                  <span className="text-[12px] text-ink-4">{invoice.basis}</span>
                  {invoice.status === 'paid' ? (
                    <span className="rounded-[7px] bg-ok-tint px-[10px] py-[5px] text-center text-[11px] font-bold text-ok-ink">
                      Paid
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={busy === invoice.number}
                      onClick={() =>
                        act(invoice.number, async () => {
                          await documents.markPaid(invoice.number);
                          return `${invoice.number} marked paid.`;
                        })
                      }
                      className="h-9 rounded-[8px] bg-panel-2 text-[12px] font-bold text-ink-2 disabled:opacity-40"
                    >
                      Mark paid
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {open && <InvoiceSheet invoice={open} onClose={() => setOpen(null)} />}
      </div>
    </>
  );
}
