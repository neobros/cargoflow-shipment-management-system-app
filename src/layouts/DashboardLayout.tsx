import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { LogoutButton } from '@/components/admin/LogoutButton';
import { LogoTile } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { can } from '@/lib/admin';

const NAV = [
  {
    group: 'RUN THE DAY',
    items: [
      { label: 'Overview', to: '/admin', permission: 'admin:access', built: true, end: true },
      { label: 'Bookings', to: '/admin/bookings', permission: 'bookings:read', built: true, end: false },
      { label: 'Warehouse', to: '/admin/warehouse', permission: 'bookings:read', built: false, end: false },
      { label: 'Containers', to: '/admin/containers', permission: 'bookings:read', built: false, end: false },
    ],
  },
  {
    group: 'MONEY',
    items: [
      { label: 'Billing', to: '/admin/billing', permission: 'adjustments:read', built: true, end: false },
      { label: 'Rate cards', to: '/admin/rates', permission: 'rates:read', built: false, end: false },
      { label: 'Customers', to: '/admin/customers', permission: 'bookings:read', built: false, end: false },
    ],
  },
];

/**
 * Everything behind this layout requires a session.
 *
 * Without server rendering the browser cannot know who is signed in before it
 * asks, so the guard waits for the first /auth/me rather than redirecting on a
 * null it has not confirmed — otherwise a reload would bounce a signed-in
 * operator to the login screen.
 */
export function DashboardLayout() {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-[15px] text-ink-3">Checking your session…</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2);

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-[248px] shrink-0 flex-col border-r border-rule bg-panel px-4 py-[22px]">
        <Link to="/admin" className="flex items-center gap-[11px] px-2 pb-6">
          <LogoTile size={36} mark={26} />
          <div className="flex flex-col gap-[3px]">
            <span className="text-base font-bold leading-none tracking-[-0.01em]">CargoFlow</span>
            <span className="text-[11px] font-semibold leading-none text-ink-4">Operations</span>
          </div>
        </Link>

        {NAV.map((section) => {
          const visible = section.items.filter((item) => can(user, item.permission));
          if (visible.length === 0) return null;

          return (
            <div key={section.group} className="flex flex-col">
              <span className="px-2 pb-[10px] pt-[22px] text-[11px] font-bold text-ink-4 first:pt-0">
                {section.group}
              </span>
              {visible.map((item) => {
                const active = item.end
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to);

                return item.built ? (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`mb-[3px] flex h-[42px] items-center gap-3 rounded-[10px] px-3 text-sm ${
                      active ? 'bg-brand-tint font-bold text-brand' : 'font-medium text-ink-2'
                    }`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  // Not built yet — a dead link is worse than an honest disabled one.
                  <span
                    key={item.to}
                    aria-disabled="true"
                    title="Not built yet"
                    className="mb-[3px] flex h-[42px] cursor-not-allowed items-center gap-3 rounded-[10px] px-3 text-sm font-medium text-ink-4"
                  >
                    {item.label}
                  </span>
                );
              })}
            </div>
          );
        })}

        <span className="flex-grow" />

        <div className="flex flex-col gap-2 rounded-xl bg-panel-2 p-3">
          <div className="flex items-center gap-[11px]">
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-brand text-[13px] font-bold text-white">
              {initials}
            </span>
            <div className="flex min-w-0 flex-col gap-[3px]">
              <span className="truncate text-[13px] font-semibold leading-none">{user.name}</span>
              <span className="text-[11px] font-medium leading-none text-ink-4">{user.roleLabel}</span>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-grow flex-col">
        <Outlet />
      </div>
    </div>
  );
}
