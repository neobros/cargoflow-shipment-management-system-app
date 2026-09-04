import type { Invoice } from '@/lib/depot';

const day = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * Requirement 3.2: the customer's financial invoice.
 *
 * The document stores its own lines rather than pointing at the quote that
 * produced them. A rate card is effective-dated and a quote can be recomputed;
 * an invoice is a financial record and has to say the same thing in five years,
 * whatever has been published since.
 *
 * GST appears once, under the subtotal, and not again as a line — the quote
 * carries it both ways and only one of them belongs on a tax invoice.
 */
export function InvoiceSheet({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          body > .cf-invoice-root, .cf-invoice-root * { display: revert !important; }
          .cf-invoice-root { position: absolute; inset: 0; background: #fff; }
          .cf-no-print { display: none !important; }
        }
        @page { size: A4 portrait; margin: 16mm; }
      `}</style>

      <section className="cf-invoice-root rounded-[14px] border border-rule bg-panel">
        <div className="cf-no-print flex items-center justify-between border-b border-rule px-5 py-4">
          <span className="text-base font-bold">{invoice.number}</span>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="h-10 px-4 text-[13px] font-bold text-ink-3">
              Close
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="h-10 rounded-[10px] bg-brand px-5 text-[13px] font-bold text-ink-invert"
            >
              Print
            </button>
          </div>
        </div>

        <article
          className="bg-white p-6 text-black sm:p-10"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-black pb-5">
            <div>
              <p className="text-[20px] font-black uppercase tracking-[0.06em]">Tax invoice</p>
              <p className="mt-1 text-[12px] leading-[1.5]">
                CargoFlow Consolidators (Pvt) Ltd
                <br />
                118 Negombo Road, Peliyagoda 11600, Sri Lanka
                <br />
                ABN [to be issued] · Registered for GST
              </p>
            </div>
            <div className="text-right text-[12px]">
              <p className="text-[11px] font-bold uppercase">Invoice number</p>
              <p className="text-[17px] font-black">{invoice.number}</p>
              <p className="mt-2">Issued {day(invoice.issuedAt)}</p>
              <p className={invoice.overdue ? 'font-bold' : ''}>Due {day(invoice.dueAt)}</p>
              {invoice.status === 'paid' && invoice.paidAt && (
                <p className="mt-2 font-black uppercase">Paid {day(invoice.paidAt)}</p>
              )}
            </div>
          </header>

          <div className="grid gap-6 border-b border-black py-5 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.08em]">Bill to</p>
              <p className="text-[14px] font-bold">{invoice.billTo.name}</p>
              <p className="text-[12px] leading-[1.5]">
                {invoice.billTo.line1}
                {invoice.billTo.line2 ? `, ${invoice.billTo.line2}` : ''}
                <br />
                {invoice.billTo.city} {invoice.billTo.postcode}, {invoice.billTo.country}
                <br />
                {invoice.billTo.mobile}
                {invoice.billTo.email ? ` · ${invoice.billTo.email}` : ''}
              </p>
            </div>
            <div className="text-[12px] sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em]">For</p>
              <p className="text-[14px] font-bold">Booking {invoice.bookingRef}</p>
              <p>Customer {invoice.customerRef}</p>
              <p className="mt-2 text-[11px]">
                Priced on {invoice.basis === 'verified' ? 'our depot measurements' : 'declared sizes'}{' '}
                · rate card v{invoice.rateCardVersion}
              </p>
            </div>
          </div>

          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-black text-left">
                <th className="py-2 text-[10px] font-bold uppercase tracking-[0.08em]">Charge</th>
                <th className="py-2 text-[10px] font-bold uppercase tracking-[0.08em]">
                  Worked out from
                </th>
                <th className="py-2 text-right text-[10px] font-bold uppercase tracking-[0.08em]">
                  {invoice.currency}
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((line) => (
                <tr key={line.code} className="border-b border-[#ddd]">
                  <td className="py-2 font-semibold">{line.label}</td>
                  <td className="py-2 text-[11px]">{line.basis}</td>
                  <td className="py-2 text-right font-semibold">{line.amount}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="py-2 text-right text-[11px] font-bold uppercase">
                  Subtotal
                </td>
                <td className="py-2 text-right font-semibold">{invoice.subtotal}</td>
              </tr>
              <tr className="border-b border-black">
                <td colSpan={2} className="py-2 text-right text-[11px] font-bold uppercase">
                  GST
                </td>
                <td className="py-2 text-right font-semibold">{invoice.tax}</td>
              </tr>
              <tr>
                <td colSpan={2} className="py-3 text-right text-[13px] font-black uppercase">
                  Total due {invoice.currency}
                </td>
                <td className="py-3 text-right text-[19px] font-black">{invoice.total}</td>
              </tr>
            </tfoot>
          </table>

          <footer className="mt-8 border-t border-black pt-4 text-[11px] leading-[1.6]">
            <p className="font-bold">Payment</p>
            <p>
              Bank transfer to [account details to be issued]. Quote {invoice.number} as the
              reference. Payment is due within 14 days of the issue date above.
            </p>
            <p className="mt-3">
              Goods are held against payment. Where this invoice was raised on our depot
              measurements, those measurements were taken on certified equipment and photographed;
              a copy is available on request against booking {invoice.bookingRef}.
            </p>
          </footer>
        </article>
      </section>
    </>
  );
}
