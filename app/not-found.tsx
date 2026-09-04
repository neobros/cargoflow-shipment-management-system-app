import Link from 'next/link';
import { Wordmark } from '@/components/Logo';

export default function NotFound() {
  return (
    <div
      data-surface="customer"
      className="flex min-h-screen flex-col items-center justify-center gap-8 bg-bg px-6 text-center text-ink"
    >
      <Wordmark />

      <div className="flex max-w-[46ch] flex-col gap-4">
        <h1 className="font-display text-[clamp(32px,6vw,48px)] font-extrabold leading-[1.05] tracking-[-0.035em]">
          That page isn&apos;t here
        </h1>
        <p className="text-[17px] leading-[1.6] text-ink-2">
          It may not be built yet — CargoFlow is under active development. The pages below all work.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-13 items-center rounded-full bg-brand px-7 py-4 text-[15px] font-bold text-ink-invert"
        >
          Get a price
        </Link>
        <Link
          href="/track"
          className="inline-flex items-center rounded-full bg-panel-2 px-7 py-4 text-[15px] font-bold text-ink-2"
        >
          Track a box
        </Link>
        <Link
          href="/admin"
          className="inline-flex items-center rounded-full bg-panel-2 px-7 py-4 text-[15px] font-bold text-ink-2"
        >
          Admin panel
        </Link>
        <Link
          href="/depot"
          className="inline-flex items-center rounded-full bg-panel-2 px-7 py-4 text-[15px] font-bold text-ink-2"
        >
          Depot floor
        </Link>
      </div>
    </div>
  );
}
