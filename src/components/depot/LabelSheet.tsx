import { useState } from 'react';
import type { Label } from '@/lib/depot';

/**
 * Requirement 2.2: printable shipping labels.
 *
 * Rendered at 100 × 150 mm — the standard thermal label stock — and printed
 * through the browser rather than a driver, so it works from any machine on the
 * floor without software installed on it. The print stylesheet hides everything
 * else on the page and puts one label per physical page.
 *
 * The barcode arrives from the server as SVG, not as an image or a font. A
 * barcode resampled to the printer's resolution is a barcode that intermittently
 * fails to scan, and a scanner that works four times in five is worse on a
 * warehouse floor than one that never works, because nobody stops trusting it.
 */
export function LabelSheet({
  labels,
  onClear,
  onPrinted,
}: {
  labels: Label[];
  onClear: () => void;
  onPrinted: () => Promise<void> | void;
}) {
  const [printing, setPrinting] = useState(false);

  const print = async () => {
    setPrinting(true);
    window.print();
    // The dialog is modal and synchronous, so by here the operator has either
    // printed or cancelled. Recording it either way is the honest option: a
    // label marked printed that jammed is fixed by reprinting, whereas a
    // silently unrecorded print leaves the loading board wrong.
    await onPrinted();
    setPrinting(false);
  };

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          body > .cf-print-root, .cf-print-root * { display: revert !important; }
          .cf-print-root { position: absolute; inset: 0; background: #fff; }
          .cf-label { page-break-after: always; break-after: page; border: none !important; }
          .cf-label:last-child { page-break-after: auto; break-after: auto; }
          .cf-no-print { display: none !important; }
        }
        @page { size: 100mm 150mm; margin: 0; }
      `}</style>

      <section className="cf-print-root border border-rule bg-panel">
        <div className="cf-no-print flex flex-wrap items-center justify-between gap-3 border-b border-rule bg-panel-2 px-4 py-3 sm:px-5">
          <span className="text-sm font-bold uppercase tracking-[0.1em]">
            {labels.length} {labels.length === 1 ? 'label' : 'labels'} ready
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClear}
              className="h-10 px-4 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-3"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={print}
              disabled={printing}
              className="h-10 bg-ink px-5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-invert"
            >
              {printing ? 'Printing…' : 'Print all'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 p-4 sm:p-5">
          {labels.map((label) => (
            <LabelCard key={label.trackingId} label={label} />
          ))}
        </div>
      </section>
    </>
  );
}

function LabelCard({ label }: { label: Label }) {
  return (
    <article
      className="cf-label flex flex-col border border-ink bg-white text-black"
      style={{ width: '100mm', height: '150mm', padding: '4mm' }}
    >
      <header className="flex items-start justify-between border-b-2 border-black pb-2">
        <div>
          <p className="text-[15px] font-black uppercase tracking-[0.1em]">CargoFlow</p>
          <p className="text-[9px] uppercase tracking-[0.08em]">Consolidated freight</p>
        </div>
        <div className="text-right">
          <p className="text-[15px] font-black">{label.service}</p>
          <p className="text-[10px] font-bold">{label.route}</p>
        </div>
      </header>

      <section className="border-b border-black py-2">
        <p className="text-[8px] font-bold uppercase tracking-[0.1em]">Deliver to</p>
        <p className="text-[15px] font-bold leading-tight">{label.consignee}</p>
        <p className="text-[11px] leading-[1.35]">
          {label.receiver.line1}
          {label.receiver.line2 ? `, ${label.receiver.line2}` : ''}
          <br />
          {label.receiver.city} {label.receiver.region ?? ''} {label.receiver.postcode}
          <br />
          {label.receiver.country}
        </p>
        <p className="text-[11px] font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {label.receiver.mobile}
        </p>
      </section>

      <section className="flex justify-between border-b border-black py-2 text-[10px]">
        <span>
          <span className="font-bold uppercase">From </span>
          {label.sender.name}, {label.sender.city}
        </span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{label.sender.mobile}</span>
      </section>

      <section
        className="flex justify-between border-b border-black py-2 text-[11px]"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        <span>
          <span className="font-bold uppercase">Piece </span>
          {label.sequence} of {label.pieceCount}
        </span>
        <span>{label.measurement.dimensionsCm} cm</span>
        <span>{label.measurement.weightKg} kg</span>
        <span>{label.measurement.volume} m³</span>
      </section>

      <div className="mt-auto flex flex-col items-center gap-1 pt-3">
        <div
          className="w-full [&>svg]:h-auto [&>svg]:w-full"
          // The barcode is server-generated SVG with no scripts or external
          // references — see the Code 128 module. Rendering it as markup is
          // what lets it scale to the printer's own resolution.
          dangerouslySetInnerHTML={{ __html: label.barcodeSvg }}
        />
        <p
          className="text-[17px] font-black tracking-[0.12em]"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {label.trackingId}
        </p>
        <p className="text-[9px]" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {label.bookingRef} · {label.measurement.source} ·{' '}
          {new Date(label.printedAt).toLocaleDateString()}
        </p>
      </div>
    </article>
  );
}
