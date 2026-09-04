import { Route, Routes } from 'react-router-dom';
import { AdminSurface } from './layouts/AdminSurface';
import { CustomerLayout } from './layouts/CustomerLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { BookPage } from '@/pages/BookPage';
import { HomePage } from './pages/HomePage';
import { DepotPage } from './pages/DepotPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { TrackPage } from './pages/TrackPage';
import { BillingPage } from './pages/admin/BillingPage';
import { ContainersPage } from '@/pages/admin/ContainersPage';
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
        <Route path="/book" element={<BookPage />} />
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
        </Route>
      </Route>

      {/* Depot */}
      <Route path="/depot" element={<DepotPage />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
