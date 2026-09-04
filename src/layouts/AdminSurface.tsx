import { Outlet } from 'react-router-dom';

/**
 * Sets the admin surface tokens and nothing else.
 *
 * The sidebar and the session guard live in DashboardLayout, so /admin/login
 * can render inside the admin look without being blocked by the check it exists
 * to satisfy.
 */
export function AdminSurface() {
  return (
    <div data-surface="admin" className="min-h-screen bg-bg text-ink">
      <Outlet />
    </div>
  );
}
