import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { admin, type CustomerDetail, type CustomerSummary } from '@/lib/admin';
import { ApiError } from '@/lib/http';

const day = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

const COLUMNS =
  'grid min-w-[980px] grid-cols-[110px_minmax(200px,1fr)_210px_70px_110px_120px_120px] gap-3 px-5';

const HEADS = [
  { label: 'Account', align: '' },
  { label: 'Name', align: '' },
  { label: 'Contact', align: '' },
  { label: 'Sent', align: 'text-center' },
  { label: 'Billed', align: 'text-right' },
  { label: 'Outstanding', align: 'text-right' },
  { label: 'Last booking', align: 'text-right' },
];

/**
 * The customer directory.
 *
 * What a clerk needs while someone is on the phone: find them by whatever they
 * said — a name, an email, the number they are calling from — then see what
 * they have sent and whether they owe anything.
 *
 * Deliberately not a CRM. No notes, no tags, no lifecycle stage: none of that
 * is asked for, and a half-built CRM is worse than none because people start
 * trusting it with things it does not really keep.
 */
export function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState('');
  const [open, setOpen] = useState<CustomerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (term: string) => {
    setLoading(true);
    try {
      const { customers: found } = await admin.customers(term || undefined);
      setCustomers(found);
      setError(null);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh(applied);
  }, [refresh, applied]);

  const openCustomer = async (reference: string) => {
    try {
      setOpen(await admin.customer(reference));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not open that customer');
    }
  };

  return (
    <>
      <header className="flex h-[68px] items-center justify-between border-b border-rule bg-panel px-5 sm:px-8">
        <span className="text-[19px] font-bold tracking-[-0.015em]">Customers</span>
        <span className="tnum text-[13px] font-medium text-ink-4">{customers.length} shown</span>
      </header>

      <div className="flex flex-col gap-5 px-5 pb-9 pt-[26px] sm:px-8">
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            setApplied(search.trim());
          }}
        >
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name, email, mobile or account number"
            aria-label="Find a customer"
            className="h-11 min-w-0 flex-grow rounded-[10px] bg-panel-2 px-4 text-[14px]"
          />
          <button
            type="submit"
            className="h-11 shrink-0 rounded-[10px] bg-brand px-5 text-[13px] font-bold text-ink-invert"
          >
            Find
          </button>
          {applied && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setApplied('');
              }}
              className="h-11 shrink-0 rounded-[10px] bg-panel-2 px-4 text-[13px] font-bold text-ink-2"
            >
              Clear
            </button>
          )}
        </form>

        {error && (
          <p className="rounded-[12px] bg-alert-tint px-5 py-4 text-[14px] text-alert-ink">{error}</p>
        )}
        {loading && <p className="text-[15px] text-ink-3">Loading…</p>}

        {open && <Detail detail={open} onClose={() => setOpen(null)} />}

        {!loading && (
          <section className="overflow-hidden rounded-[14px] border border-rule bg-panel">
            {customers.length === 0 ? (
              <p className="px-5 py-12 text-center text-[15px] text-ink-3">
                {applied
                  ? `Nobody matches “${applied}”.`
                  : 'No customer accounts yet. One appears here as soon as somebody registers.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <div className={`${COLUMNS} border-b border-rule bg-panel-2 py-3`}>
                  {HEADS.map(({ label, align }) => (
                    <span key={label} className={`text-[11px] font-bold text-ink-3 ${align}`}>
                      {label}
                    </span>
                  ))}
                </div>

                {customers.map((customer) => (
                  <button
                    key={customer.reference}
                    type="button"
                    onClick={() => void openCustomer(customer.reference)}
                    className={`${COLUMNS} w-full items-center border-b border-rule-2 py-4 text-left last:border-b-0`}
                  >
                    <span className="tnum text-[13px] font-semibold text-brand">{customer.reference}</span>
                    <span className="truncate text-sm font-medium">{customer.name}</span>
                    <span className="tnum truncate text-[12px] text-ink-3">
                      {customer.email}
                      <br />
                      {customer.mobile}
                    </span>
                    <span className="tnum text-center text-[13px]">
                      {customer.shipments}
                      {customer.inFlight > 0 && (
                        <span className="block text-[11px] text-brand">{customer.inFlight} moving</span>
                      )}
                    </span>
                    <span className="tnum text-right text-[13px]">{customer.billedTotal}</span>
                    <span
                      className={`tnum text-right text-[13px] ${
                        customer.overdueCount > 0 ? 'font-bold text-alert-ink' : 'text-ink-3'
                      }`}
                    >
                      {customer.outstandingTotal}
                      {customer.overdueCount > 0 && (
                        <span className="block text-[11px] font-medium">
                          {customer.overdueCount} overdue
                        </span>
                      )}
                    </span>
                    <span className="tnum text-right text-[12px] text-ink-4">
                      {customer.lastBookedAt ? day(customer.lastBookedAt) : '—'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}

function Detail({ detail, onClose }: { detail: CustomerDetail; onClose: () => void }) {
  const { customer } = detail;

  return (
    <section className="rounded-[14px] border-2 border-brand bg-panel">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-rule px-5 py-4">
        <div>
          <span className="text-base font-bold tracking-[-0.01em]">{customer.name}</span>
          <p className="tnum mt-1 text-[13px] text-ink-3">
            {customer.reference} · {customer.email} · {customer.mobile}
          </p>
          <p className="text-[12px] text-ink-4">
            Joined {day(customer.joinedAt)}
            {customer.lastLoginAt ? ` · last signed in ${day(customer.lastLoginAt)}` : ' · never signed in'}
            {customer.emailVerified ? '' : ' · email not verified'}
          </p>
        </div>
        <button type="button" onClick={onClose} className="text-[13px] font-semibold text-ink-3">
          Close
        </button>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-2">
        <div>
          <span className="text-[13px] font-semibold text-ink-3">Shipments</span>
          {detail.shipments.length === 0 ? (
            <p className="mt-2 text-[14px] text-ink-4">Nothing sent yet.</p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {detail.shipments.map((shipment) => (
                <Link
                  key={shipment.reference}
                  to={`/track?id=${shipment.reference}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] bg-panel-2 px-4 py-3"
                >
                  <span className="tnum text-[13px] font-semibold">{shipment.reference}</span>
                  <span className="text-[12px] text-ink-3">{shipment.route}</span>
                  <span className="text-[12px] text-ink-3">{shipment.statusLabel}</span>
                  <span className="tnum text-[13px] font-bold">{shipment.total}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="text-[13px] font-semibold text-ink-3">Invoices</span>
          {detail.invoices.length === 0 ? (
            <p className="mt-2 text-[14px] text-ink-4">Nothing invoiced yet.</p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {detail.invoices.map((invoice) => (
                <div
                  key={invoice.number}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] bg-panel-2 px-4 py-3"
                >
                  <span className="tnum text-[13px] font-semibold">{invoice.number}</span>
                  <span className="tnum text-[12px] text-ink-3">{invoice.bookingRef}</span>
                  <span className="tnum text-[13px] font-bold">{invoice.total}</span>
                  <span
                    className={`rounded-[7px] px-[10px] py-[4px] text-[11px] font-bold ${
                      invoice.status === 'paid'
                        ? 'bg-ok-tint text-ok-ink'
                        : invoice.overdue
                          ? 'bg-alert-tint text-alert-ink'
                          : 'bg-warn-tint text-warn-ink'
                    }`}
                  >
                    {invoice.status === 'paid' ? 'Paid' : invoice.overdue ? 'Overdue' : `Due ${day(invoice.dueAt)}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
