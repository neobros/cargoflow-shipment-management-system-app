import { Link } from 'react-router-dom';
import { Wordmark } from '@/components/Logo';

const links = [
  { to: '/', label: 'Get a price', primary: true },
  { to: '/track', label: 'Track a box', primary: false },
  { to: '/admin', label: 'Admin panel', primary: false },
  { to: '/admin/depot', label: 'Depot floor', primary: false },
];

export function NotFoundPage() {
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
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`inline-flex items-center rounded-full px-7 py-4 text-[15px] font-bold ${
              link.primary ? 'bg-brand text-ink-invert' : 'bg-panel-2 text-ink-2'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
