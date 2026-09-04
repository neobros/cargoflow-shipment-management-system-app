/**
 * Sets the admin surface tokens and nothing else.
 *
 * The sidebar and the session guard live in (dashboard)/layout.tsx, so that
 * /admin/login can render inside the admin look without being guarded by the
 * very check it exists to satisfy.
 */
export default function AdminSurface({ children }: { children: React.ReactNode }) {
  return (
    <div data-surface="admin" className="min-h-screen bg-bg text-ink">
      {children}
    </div>
  );
}
