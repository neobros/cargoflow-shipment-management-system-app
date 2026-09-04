import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/admin/LoginForm';
import { LogoMark } from '@/components/Logo';
import { getCurrentUser } from '@/lib/admin';

export const metadata: Metadata = { title: 'Staff sign in' };
export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  // Already signed in? Don't make them look at a login form.
  if (await getCurrentUser()) redirect('/admin');

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand">
            <LogoMark size={24} stroke="#ffffff" />
          </span>
          <div className="flex flex-col gap-1">
            <span className="text-[19px] font-bold leading-none tracking-[-0.015em]">CargoFlow</span>
            <span className="text-[12px] font-semibold leading-none text-ink-4">Operations</span>
          </div>
        </div>

        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.025em]">Staff sign in</h1>
        <p className="mt-2 text-[15px] leading-[1.6] text-ink-3">
          This is the operations panel. Customers sign in with a mobile number on the main site.
        </p>

        <LoginForm />

        <div className="mt-8 rounded-xl border border-rule bg-panel p-5">
          <p className="mb-3 text-[13px] font-bold text-ink-2">Development accounts</p>
          <ul className="flex list-none flex-col gap-2 p-0 text-[13px] text-ink-3">
            <li className="flex justify-between gap-4">
              <span className="tnum">admin@cargoflow.test</span>
              <span>Administrator</span>
            </li>
            <li className="flex justify-between gap-4">
              <span className="tnum">billing@cargoflow.test</span>
              <span>Billing</span>
            </li>
            <li className="flex justify-between gap-4">
              <span className="tnum">supervisor@cargoflow.test</span>
              <span>Depot supervisor</span>
            </li>
            <li className="flex justify-between gap-4">
              <span className="tnum">operator@cargoflow.test</span>
              <span>Depot operator</span>
            </li>
          </ul>
          <p className="mt-3 text-[13px] text-ink-4">
            Password <span className="tnum font-semibold text-ink-2">cargoflow</span> for all four. Sign in as
            the operator to watch the server refuse an approval.
          </p>
        </div>
      </div>
    </div>
  );
}
