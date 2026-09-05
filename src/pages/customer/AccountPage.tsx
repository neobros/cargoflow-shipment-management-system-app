import { Link, Navigate } from 'react-router-dom';
import { useAsync } from '@/hooks/useAsync';
import { useCustomer } from '@/hooks/useCustomer';
import { customer, type CustomerShipment, type InvoiceSummary } from '@/lib/customer';

const day = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

/** Everything the account holder can see about their own shipping. */
export function AccountPage() {
  const { account, checking, signOut } = useCustomer();
  const shipments = useAsync(() => customer.shipments(), []);
  const invoices = useAsync(() => customer.invoices(), []);

  if (checking) {
    return (
      <div className="mx-auto max-w-[900px] px-5 py-20">
        <p className="text-[15px] text-ink-3">One moment…</p>
      </div>
    );
  }

  if (!account) return <Navigate to="/sign-in" replace state={{ from: '/account' }} />;

  const rows = shipments.data?.shipments ?? [];
  const bills = invoices.data?.invoices ?? [];
  const unpaid = bills.filter((invoice) => invoice.status === 'issued');

  return (
    <div className="mx-auto max-w-[900px] px-5 py-10 sm:px-6 md:px-14 md:py-14">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[clamp(28px,5vw,40px)] font-extrabold leading-[1.05] tracking-[-0.03em]">
            {account.name.split(' ')[0]}'s shipping
          </h1>
          <p className="tnum mt-2 text-[15px] text-ink-3">
            {account.email} · {account.mobile} · account {account.reference}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="h-11 rounded-full bg-panel-2 px-5 text-[14px] font-bold text-ink-2"
        >
          Sign out
        </button>
      </div>

      <Link
        to="/book"
        className="mt-7 inline-flex h-14 items-center rounded-full bg-brand px-8 text-[16px] font-bold text-ink-invert"
      >
        Send a shipment
      </Link>

      {unpaid.length > 0 && (
        <p className="mt-7 rounded-[16px] bg-warn-tint px-5 py-4 text-[15px] leading-[1.55] text-warn-ink">
          <strong className="font-bold">
            {unpaid.length} {unpaid.length === 1 ? 'invoice is' : 'invoices are'} waiting to be paid.
          </strong>{' '}
          Details are on each invoice below.
        </p>
      )}

      <section className="mt-10">
        <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">Your shipments</h2>

        {shipments.loading && <p className="mt-4 text-[15px] text-ink-3">Loading…</p>}
        {shipments.error && (
          <p className="mt-4 rounded-[14px] bg-alert-tint px-5 py-4 text-[15px] text-alert-ink">
            {shipments.error.message}
          </p>
        )}

        {shipments.data && rows.length === 0 && (
          <div className="mt-4 rounded-[20px] border border-rule bg-panel px-6 py-12 text-center">
            <p className="text-[16px] font-semibold">Nothing sent yet</p>
            <p className="mx-auto mt-2 max-w-[40ch] text-[15px] leading-[1.6] text-ink-3">
              When you book a shipment it appears here, and you can follow every box from this page.
            </p>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {rows.map((shipment) => (
            <ShipmentCard key={shipment.reference} shipment={shipment} />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">Your invoices</h2>

        {invoices.data && bills.length === 0 && (
          <p className="mt-4 text-[15px] leading-[1.6] text-ink-3">
            No invoices yet. We invoice once your boxes have been weighed at our depot and any price
            change has been settled.
          </p>
        )}

        <div className="mt-4 flex flex-col gap-2">
          {bills.map((invoice) => (
            <InvoiceRow key={invoice.number} invoice={invoice} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ShipmentCard({ shipment }: { shipment: CustomerShipment }) {
  return (
    <article
      className={`rounded-[20px] border p-5 sm:p-6 ${
        shipment.awaitingApproval ? 'border-alert bg-alert-tint' : 'border-rule bg-panel'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/track?id=${shipment.reference}`}
            className="tnum text-[17px] font-bold text-ink"
          >
            {shipment.reference}
          </Link>
          <p className="mt-1 text-[15px] text-ink-2">
            {shipment.route} · {shipment.pieceCount}{' '}
            {shipment.pieceCount === 1 ? 'box' : 'boxes'} · booked {day(shipment.bookedAt)}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold ${
            shipment.awaitingApproval ? 'bg-panel text-alert-ink' : 'bg-ok-tint text-ok-ink'
          }`}
        >
          {shipment.awaitingApproval ? 'Needs your OK' : shipment.statusLabel}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="tnum text-[15px]">
          {shipment.bookedTotal !== shipment.currentTotal ? (
            <>
              <span className="text-ink-4 line-through">A${shipment.bookedTotal}</span>{' '}
              <span className="font-bold text-alert-ink">A${shipment.currentTotal}</span>
            </>
          ) : (
            <span className="font-bold">A${shipment.currentTotal}</span>
          )}
        </span>

        <Link to={`/track?id=${shipment.reference}`} className="text-[14px] font-bold text-brand">
          Follow it →
        </Link>

        {shipment.invoiceNumber && (
          <Link
            to={`/account/invoices/${shipment.invoiceNumber}`}
            className="tnum text-[14px] font-bold text-brand"
          >
            {shipment.invoiceNumber} →
          </Link>
        )}
      </div>

      {shipment.awaitingApproval && (
        <p className="mt-3 text-[14px] leading-[1.55] text-alert-ink">
          We measured your boxes and the price has changed. Nothing ships and nothing is charged
          until you say yes.
        </p>
      )}
    </article>
  );
}

function InvoiceRow({ invoice }: { invoice: InvoiceSummary }) {
  return (
    <Link
      to={`/account/invoices/${invoice.number}`}
      className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-rule bg-panel px-5 py-4"
    >
      <div className="min-w-0">
        <span className="tnum text-[15px] font-bold">{invoice.number}</span>
        <span className="tnum ml-3 text-[14px] text-ink-3">{invoice.bookingRef}</span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <span className="tnum text-[16px] font-bold">
          {invoice.currency} {invoice.total}
        </span>
        {invoice.status === 'paid' ? (
          <span className="rounded-full bg-ok-tint px-3 py-1 text-[12px] font-bold text-ok-ink">
            Paid
          </span>
        ) : (
          <span
            className={`tnum rounded-full px-3 py-1 text-[12px] font-bold ${
              invoice.overdue ? 'bg-alert-tint text-alert-ink' : 'bg-warn-tint text-warn-ink'
            }`}
          >
            {invoice.overdue ? 'Overdue' : `Due ${day(invoice.dueAt)}`}
          </span>
        )}
      </div>
    </Link>
  );
}
