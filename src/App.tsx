import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminSurface } from './layouts/AdminSurface';
import { CustomerLayout } from './layouts/CustomerLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { BookPage } from '@/pages/BookPage';
import { AccountPage } from '@/pages/customer/AccountPage';
import { AuthPage } from '@/pages/customer/AuthPage';
import { CustomerInvoicePage } from '@/pages/customer/CustomerInvoicePage';
import { RequireCustomer } from '@/components/customer/RequireCustomer';
import { HomePage } from './pages/HomePage';
import { DepotLayout } from '@/layouts/DepotLayout';
import { DepotDashboard } from '@/pages/depot/DepotDashboard';
import { ReceivingPage } from '@/pages/depot/ReceivingPage';
import { WalkInPage } from '@/pages/depot/WalkInPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { TrackPage } from './pages/TrackPage';
import { BillingPage } from './pages/admin/BillingPage';
import { ContainersPage } from '@/pages/admin/ContainersPage';
import { CustomersPage } from '@/pages/admin/CustomersPage';
import { RateCardsPage } from '@/pages/admin/RateCardsPage';
import { InvoicesPage } from '@/pages/admin/InvoicesPage';
import { MessagesPage } from '@/pages/admin/MessagesPage';
import { BookingsPage } from './pages/admin/BookingsPage';
import { LoginPage } from './pages/admin/LoginPage';
import { OverviewPage } from './pages/admin/OverviewPage';

/**
 * Three surfaces, three layouts.
 *
 * The nesting does the same job the Next.js route groups did: /admin/login sits
 * inside the admin look but outside the session guard, so it is not blocked by
 * the very check it exists to satisfy.
 */
export function App() {
  return (
    <Routes>
      {/* Customer */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/sign-in" element={<AuthPage mode="sign-in" />} />
        {/* Booking is behind the account; pricing and tracking are not. */}
        <Route
          path="/book"
          element={
            <RequireCustomer>
              <BookPage />
            </RequireCustomer>
          }
        />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/account/invoices/:number" element={<CustomerInvoicePage />} />
        <Route path="/track" element={<TrackPage />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<AdminSurface />}>
        <Route path="login" element={<LoginPage />} />
        <Route element={<DashboardLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="containers" element={<ContainersPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="rates" element={<RateCardsPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="depot" element={<DepotLayout />}>
            <Route index element={<DepotDashboard />} />
            <Route path="receiving" element={<ReceivingPage />} />
            <Route path="walk-in" element={<WalkInPage />} />
          </Route>
        </Route>
      </Route>

      {/* Depot */}
      <Route path="/depot/*" element={<Navigate to="/admin/depot" replace />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
