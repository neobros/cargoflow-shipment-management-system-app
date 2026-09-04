import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LogoutButton } from '@/components/admin/LogoutButton';
import { LogoMark } from '@/components/Logo';
import { can, getCurrentUser } from '@/lib/admin';

export const dynamic = 'force-dynamic';

/**
 * Everything behind this layout requires a session.
 *
 * The check runs on the server before any markup is produced, so an unsigned-in
 * visitor never briefly sees a dashboard. Navigation is also filtered by
 * permission — but the server enforces the same rules independently, because a
 * hidden button is a courtesy, not a control.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  const nav = [
    {
      group: 'RUN THE DAY',
      items: [
        { label: 'Overview', href: '/admin', permission: 'admin:access', built: true },
        { label: 'Bookings', href: '/admin/bookings', permission: 'bookings:read', built: true },
        { label: 'Warehouse', href: '/admin/warehouse', permission: 'bookings:read', built: false },
        { label: 'Containers', href: '/admin/containers', permission: 'bookings:read', built: false },
      ],
    },
    {
      group: 'MONEY',
      items: [
        { label: 'Billing', href: '/admin/billing', permission: 'adjustments:read', built: true },
        { label: 'Rate cards', href: '/admin/rates', permission: 'rates:read', built: false },
        { label: 'Customers', href: '/admin/customers', permission: 'bookings:read', built: false },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen">
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

        {nav.map((section) => {
          const visible = section.items.filter((item) => can(user, item.permission));
          if (visible.length === 0) return null;

          return (
            <div key={section.group} className="flex flex-col">
              <span className="px-2 pb-[10px] pt-[22px] text-[11px] font-bold text-ink-4 first:pt-0">
                {section.group}
              </span>
              {visible.map((item) =>
                item.built ? (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="mb-[3px] flex h-[42px] items-center gap-3 rounded-[10px] px-3 text-sm font-medium text-ink-2 hover:bg-panel-2"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    key={item.href}
                    aria-disabled="true"
                    title="Not built yet"
                    className="mb-[3px] flex h-[42px] cursor-not-allowed items-center gap-3 rounded-[10px] px-3 text-sm font-medium text-ink-4"
                  >
                    {item.label}
                  </span>
                ),
              )}
            </div>
          );
        })}

        <span className="flex-grow" />

        <div className="flex flex-col gap-2 rounded-xl bg-panel-2 p-3">
          <div className="flex items-center gap-[11px]">
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-brand text-[13px] font-bold text-white">
              {user.name
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)}
            </span>
            <div className="flex min-w-0 flex-col gap-[3px]">
              <span className="truncate text-[13px] font-semibold leading-none">{user.name}</span>
              <span className="text-[11px] font-medium leading-none text-ink-4">{user.roleLabel}</span>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-grow flex-col">{children}</div>
    </div>
  );
}
