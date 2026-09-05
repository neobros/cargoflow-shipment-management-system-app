import { Navigate, useLocation } from 'react-router-dom';
import { useCustomer } from '@/hooks/useCustomer';

/**
 * Send anyone without an account to sign in, remembering where they were going.
 *
 * It waits for the first `/customer/me` rather than redirecting on a null it
 * has not confirmed — without that, a signed-in customer refreshing the booking
 * page would be bounced to sign-in every time.
 */
export function RequireCustomer({ children }: { children: React.ReactNode }) {
  const { account, checking } = useCustomer();
  const location = useLocation();

  if (checking) {
    return (
      <div className="mx-auto max-w-[900px] px-5 py-20">
        <p className="text-[15px] text-ink-3">One moment…</p>
      </div>
    );
  }

  if (!account) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname + location.search }} />;
  }

  return <>{children}</>;
}
