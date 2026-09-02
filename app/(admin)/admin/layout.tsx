import Link from 'next/link';
import { LogoMark } from '@/components/Logo';

const nav = [
  { group: 'RUN THE DAY', items: [['Overview', '/admin', true], ['Bookings', '/admin/bookings', false], ['Warehouse', '/admin/warehouse', false], ['Containers', '/admin/containers', false]] },
  { group: 'MONEY', items: [['Billing', '/admin/billing', false], ['Rate cards', '/admin/rates', false], ['Customers', '/admin/customers', false]] },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-surface="admin" className="flex min-h-screen bg-bg text-ink">
      <aside className="flex w-[248px] shrink-0 flex-col border-r border-rule bg-panel px-4 py-[22px]">
        <Link href="/admin" className="flex items-center gap-[11px] px-2 pb-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-brand">
            <LogoMark stroke="#ffffff" />
          </span>
          <div className="flex flex-col gap-[3px]">
            <span className="text-base font-bold leading-none tracking-[-0.01em]">CargoFlow</span>
            <span className="text-[11px] font-semibold leading-none text-ink-4">Operations</span>
          </div>
        </Link>

        {nav.map((section) => (
          <div key={section.group} className="flex flex-col">
            <span className="px-2 pb-[10px] pt-[22px] text-[11px] font-bold text-ink-4 first:pt-0">
              {section.group}
            </span>
            {section.items.map(([label, href, active]) => (
              <Link
                key={href}
                href={href}
                className={`mb-[3px] flex h-[42px] items-center gap-3 rounded-[10px] px-3 text-sm ${
                  active ? 'bg-brand-tint font-bold text-brand' : 'font-medium text-ink-2'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        ))}

        <span className="flex-grow" />

        <div className="flex items-center gap-[11px] rounded-xl bg-panel-2 p-3">
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-brand text-[13px] font-bold text-white">
            AD
          </span>
          <div className="flex flex-col gap-[3px]">
            <span className="text-[13px] font-semibold leading-none">Anusha D.</span>
            <span className="text-[11px] font-medium leading-none text-ink-4">Administrator</span>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-grow flex-col">{children}</div>
    </div>
  );
}
