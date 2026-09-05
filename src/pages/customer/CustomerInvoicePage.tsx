import { Link, Navigate, useParams } from 'react-router-dom';
import { InvoiceSheet } from '@/components/admin/InvoiceSheet';
import { useAsync } from '@/hooks/useAsync';
import { useCustomer } from '@/hooks/useCustomer';
import { customer } from '@/lib/customer';

/**
 * Requirement 7.1: the customer invoice page.
 *
 * The same document the office prints, because a customer ringing about a
 * figure and the clerk answering the phone must be looking at the same piece of
 * paper. Only the surrounding chrome differs.
 */
export function CustomerInvoicePage() {
  const { number = '' } = useParams();
  const { account, checking } = useCustomer();
  const { data, error, loading } = useAsync(() => customer.invoice(number), [number]);

  if (checking) {
    return (
      <div className="mx-auto max-w-[900px] px-5 py-20">
        <p className="text-[15px] text-ink-3">One moment…</p>
      </div>
    );
  }

  if (!account) {
    return <Navigate to="/sign-in" replace state={{ from: `/account/invoices/${number}` }} />;
  }

  return (
    <div className="mx-auto max-w-[900px] px-5 py-10 sm:px-6 md:px-14 md:py-14">
      <Link to="/account" className="text-[14px] font-bold text-brand">
        ← Back to your shipping
      </Link>

      {loading && <p className="mt-6 text-[15px] text-ink-3">Loading your invoice…</p>}

      {error && (
        <div className="mt-6 rounded-[20px] border border-rule bg-panel px-6 py-12 text-center">
          <p className="text-[16px] font-semibold">We could not find that invoice</p>
          <p className="mx-auto mt-2 max-w-[44ch] text-[15px] leading-[1.6] text-ink-3">
            {error.message}. If you believe it should be here, quote the number when you contact us
            and we will look it up.
          </p>
        </div>
      )}

      {data && (
        <>
          <div className="mt-5 flex flex-wrap items-baseline justify-between gap-3">
            <h1 className="tnum font-display text-[clamp(26px,5vw,36px)] font-extrabold leading-none tracking-[-0.03em]">
              {data.invoice.number}
            </h1>
            <span
              className={`rounded-full px-4 py-2 text-[13px] font-bold ${
                data.invoice.status === 'paid'
                  ? 'bg-ok-tint text-ok-ink'
                  : data.invoice.overdue
                    ? 'bg-alert-tint text-alert-ink'
                    : 'bg-warn-tint text-warn-ink'
              }`}
            >
              {data.invoice.status === 'paid'
                ? 'Paid — thank you'
                : data.invoice.overdue
                  ? 'Overdue'
                  : 'Awaiting payment'}
            </span>
          </div>

          <p className="mt-2 text-[15px] leading-[1.6] text-ink-2">
            For shipment{' '}
            <Link to={`/track?id=${data.invoice.bookingRef}`} className="tnum font-bold text-brand">
              {data.invoice.bookingRef}
            </Link>
            {data.invoice.basis === 'verified'
              ? ' — priced on the measurements we took at our depot.'
              : ' — priced on the sizes you gave us.'}
          </p>

          <div className="mt-6">
            {/* The staff sheet, minus the close button: this page IS the view. */}
            <InvoiceSheet
              invoice={data.invoice}
              pdfPath={`/v1/customer/invoices/${data.invoice.number}/pdf`}
              onClose={() => window.history.back()}
            />
          </div>
        </>
      )}
    </div>
  );
}
