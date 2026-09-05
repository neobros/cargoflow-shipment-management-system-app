import { useState } from 'react';
import { downloadFile } from '@/lib/download';
import type { Bol } from '@/lib/depot';

const day = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * Requirement 3.2: the Master Bill of Lading.
 *
 * A consolidator's master bill covers the container as one movement, with each
 * customer's shipment as a house entry beneath it. The layout follows the
 * conventional BOL blocks — shipper, consignee, vessel and voyage, marks and
 * numbers, package count, gross weight, measurement — because the people who
 * read it at the port are looking for those in those positions, not for
 * whatever arrangement we found prettier.
 *
 * Printed through the browser onto A4, or downloaded as a PDF the server draws
 * with pdfkit — a print dialog is not a file, and the carrier needs one they
 * can attach to an email.
 */
export function BolSheet({
  bol,
  onClose,
  containerNumber,
}: {
  bol: Bol;
  onClose: () => void;
  containerNumber: string;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await downloadFile(
        `/v1/containers/${encodeURIComponent(containerNumber)}/bol.pdf`,
        `${bol.number}.pdf`,
      );
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          body > .cf-bol-root, .cf-bol-root * { display: revert !important; }
          .cf-bol-root { position: absolute; inset: 0; background: #fff; padding: 0; }
          .cf-no-print { display: none !important; }
        }
        @page { size: A4 portrait; margin: 14mm; }
      `}</style>

      <section className="cf-bol-root rounded-[14px] border border-rule bg-panel">
        <div className="cf-no-print flex items-center justify-between border-b border-rule px-5 py-4">
          <span className="text-base font-bold">Master Bill of Lading</span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 text-[13px] font-bold text-ink-3"
            >
              Close
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="h-10 rounded-[10px] bg-panel-2 px-4 text-[13px] font-bold text-ink-2 disabled:opacity-40"
            >
              {saving ? 'Making it…' : 'Download PDF'}
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

        {error && (
          <p className="cf-no-print mx-5 mt-4 rounded-[12px] bg-alert-tint px-5 py-4 text-[14px] text-alert-ink">
            {error}
          </p>
        )}

        <article className="bg-white p-6 text-black sm:p-8" style={{ fontVariantNumeric: 'tabular-nums' }}>
          <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-black pb-4">
            <div>
              <p className="text-[19px] font-black uppercase tracking-[0.06em]">
                Master Bill of Lading
              </p>
              <p className="text-[12px]">{bol.carrier}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold uppercase">B/L number</p>
              <p className="text-[17px] font-black">{bol.number}</p>
              <p className="text-[11px]">Issued {day(bol.issuedAt)}</p>
            </div>
          </header>

          <div className="grid gap-x-8 gap-y-4 border-b border-black py-4 sm:grid-cols-2">
            <Block label="Vessel and voyage" value={`${bol.container.vessel} ${bol.container.voyage}`} />
            <Block
              label="Container / seal"
              value={`${bol.container.containerNumber} · ${bol.container.type}${
                bol.container.sealNumber ? ` · seal ${bol.container.sealNumber}` : ' · not yet sealed'
              }`}
            />
            <Block label="Port of loading" value={bol.container.portOfLoading} />
            <Block label="Port of discharge" value={bol.container.portOfDischarge} />
            <Block label="Sailed" value={day(bol.container.sailsAt)} />
            <Block label="Estimated arrival" value={day(bol.container.etaAt)} />
          </div>

          <div className="grid grid-cols-2 gap-4 border-b-2 border-black py-4 sm:grid-cols-4">
            <Block label="Packages" value={String(bol.totals.packages)} big />
            <Block label="Gross weight" value={`${bol.totals.grossWeightKg} kg`} big />
            <Block label="Measurement" value={`${bol.totals.measurementM3} m³`} big />
            <Block label="House bills" value={String(bol.totals.houses)} big />
          </div>

          <p className="py-3 text-[12px] font-bold uppercase tracking-[0.08em]">
            {bol.freightTerms} · said to contain · shipper's load, stow and count
          </p>

          <div className="flex flex-col">
            {bol.houses.map((house, index) => (
              <div
                key={house.bookingRef}
                className={`grid gap-x-6 gap-y-3 border-t border-black py-4 sm:grid-cols-[1fr_1fr_150px] ${
                  index === 0 ? 'border-t-2' : ''
                }`}
              >
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em]">
                    Shipper — {house.bookingRef}
                  </p>
                  <p className="text-[13px] font-bold">{house.shipper.name}</p>
                  <p className="text-[11px] leading-[1.4]">
                    {house.shipper.line1}
                    <br />
                    {house.shipper.city} {house.shipper.postcode}, {house.shipper.country}
                    <br />
                    {house.shipper.mobile}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em]">Consignee</p>
                  <p className="text-[13px] font-bold">{house.consignee.name}</p>
                  <p className="text-[11px] leading-[1.4]">
                    {house.consignee.line1}
                    {house.consignee.line2 ? `, ${house.consignee.line2}` : ''}
                    <br />
                    {house.consignee.city} {house.consignee.region ?? ''} {house.consignee.postcode},{' '}
                    {house.consignee.country}
                    <br />
                    {house.consignee.mobile}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em]">
                    Packages · weight · measure
                  </p>
                  <p className="text-[13px] font-bold">
                    {house.packageCount} × {house.packaging}
                  </p>
                  <p className="text-[11px]">
                    {house.grossWeightKg} kg
                    <br />
                    {house.measurementM3} m³
                  </p>
                </div>

                <div className="sm:col-span-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em]">
                    Marks and numbers
                  </p>
                  <p className="text-[11px] leading-[1.5]">{house.marks.join(' · ')}</p>
                </div>
              </div>
            ))}
          </div>

          <footer className="mt-6 grid gap-8 border-t-2 border-black pt-6 sm:grid-cols-2">
            {['For the carrier', 'Place and date of issue'].map((label) => (
              <div key={label}>
                <div className="h-10 border-b border-black" />
                <p className="mt-1 text-[10px] uppercase tracking-[0.08em]">{label}</p>
              </div>
            ))}
          </footer>
        </article>
      </section>
    </>
  );
}

function Block({ label, value, big = false }: { label: string; value: string; big?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.08em]">{label}</p>
      <p className={big ? 'text-[17px] font-black' : 'text-[13px] font-semibold'}>{value}</p>
    </div>
  );
}
