import { useEffect, useState } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { LogoutButton } from '@/components/admin/LogoutButton';
import { NavIcon, type NavIconName } from '@/components/admin/NavIcon';
import { LogoTile } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { can } from '@/lib/admin';

const NAV: {
  group: string;
  items: {
    label: string;
    to: string;
    icon: NavIconName;
    permission: string;
    built: boolean;
    end: boolean;
  }[];
}[] = [
  {
    group: 'RUN THE DAY',
    items: [
      { label: 'Overview', to: '/admin', icon: 'overview', permission: 'admin:access', built: true, end: true },
      { label: 'Bookings', to: '/admin/bookings', icon: 'bookings', permission: 'bookings:read', built: true, end: false },
      { label: 'Depot floor', to: '/admin/depot', icon: 'depot', permission: 'depot:receive', built: true, end: false },
      { label: 'Containers', to: '/admin/containers', icon: 'containers', permission: 'containers:read', built: true, end: false },
    ],
  },
  {
    group: 'MONEY',
    items: [
      { label: 'Billing', to: '/admin/billing', icon: 'billing', permission: 'adjustments:read', built: true, end: false },
      { label: 'Invoices', to: '/admin/invoices', icon: 'invoices', permission: 'invoices:issue', built: true, end: false },
      { label: 'Messages', to: '/admin/messages', icon: 'messages', permission: 'adjustments:read', built: true, end: false },
      { label: 'Rate cards', to: '/admin/rates', icon: 'rates', permission: 'rates:read', built: true, end: false },
      { label: 'Customers', to: '/admin/customers', icon: 'customers', permission: 'customers:read', built: true, end: false },
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
  const [menuOpen, setMenuOpen] = useState(false);

  // Navigating on a phone should close the drawer behind you.
  useEffect(() => setMenuOpen(false), [location.pathname]);

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
      {/* Phone chrome: the sidebar becomes a drawer behind this bar. */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-rule bg-panel px-4 md:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open the menu"
          aria-expanded={menuOpen}
          className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-panel-2"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <LogoTile size={30} mark={22} />
        <span className="text-[15px] font-bold tracking-[-0.01em]">CargoFlow</span>
      </div>

      {menuOpen && (
        <button
          type="button"
          aria-label="Close the menu"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[248px] shrink-0 flex-col overflow-y-auto border-r border-rule bg-panel px-4 py-[22px] transition-transform duration-200 md:static md:translate-x-0 md:transition-none ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
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

                const className = `mb-[3px] flex h-[42px] items-center gap-3 rounded-[10px] px-3 text-sm ${
                  active ? 'bg-brand-tint font-bold text-brand' : 'font-medium text-ink-2'
                }`;

                return item.built ? (
                  <Link key={item.to} to={item.to} className={className}>
                    <NavIcon name={item.icon} />
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
                    {/* Dimmed with the label, so a disabled row reads as one thing. */}
                    <NavIcon name={item.icon} className="opacity-60" />
                    {item.label}
                  </span>
                );
              })}
            </div>
          );
        })}

        <span className="flex-grow" />

        <div className="flex flex-col gap-2 rounded-xl bg-panel-2 p-3">
          {/* The boundary should be legible here, not discovered by being
              refused three screens later. */}
          <p className="text-[11px] leading-[1.45] text-ink-4">{user.roleScope}</p>
          <div className="flex items-center gap-[11px]">
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-brand text-[13px] font-bold text-white">
              {initials}
            </span>
            <div className="flex min-w-0 flex-col gap-[3px]">
              <span className="truncate text-[13px] font-semibold leading-none">{user.name}</span>
              <span className="text-[11px] font-medium leading-none text-brand">{user.roleLabel}</span>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* pt-14 clears the fixed phone bar; the bar is gone from md up. */}
      <div className="flex min-w-0 flex-grow flex-col pt-14 md:pt-0">
        <Outlet />
      </div>
    </div>
  );
}
