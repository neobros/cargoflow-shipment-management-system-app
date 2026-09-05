import { post, request } from './http';

export type Role = 'operator' | 'supervisor' | 'billing' | 'admin';

export interface CurrentUser {
  email: string;
  name: string;
  role: Role;
  roleLabel: string;
  roleScope: string;
  depotId: string | null;
  permissions: string[];
}

export interface Exception {
  id: string;
  type: string;
  tone: 'alert' | 'warn' | 'muted';
  reference: string;
  what: string;
  waiting: string;
  waitingHours: number;
  action: { label: string; permission: string | null; href: string | null };
}

export interface Overview {
  kpis: {
    bookedToday: number;
    awaitingCheck: number;
    unapprovedRerates: number;
    heldValue: string;
    heldValueDisplay: string;
  };
  exceptions: Exception[];
}

export interface AdminAdjustment {
  reference: string;
  bookingRef: string;
  state: string;
  bookedTotal: string;
  verifiedTotal: string;
  difference: string;
  differenceDisplay: string;
  differencePercent: string;
  raisedAt: string;
  raisedBy: string;
  waiting: string;
  autoApproveAt: string | null;
  changedPieceIndexes: number[];
}

export interface AdminBooking {
  reference: string;
  customerName: string;
  lane: string;
  service: string;
  status: string;
  pieceCount: number;
  bookedTotal: string;
  currentTotal: string;
  createdAt: string;
}

export const auth = {
  me: () => request<{ user: CurrentUser }>('/v1/auth/me'),
  login: (email: string, password: string) =>
    post<{ user: CurrentUser }>('/v1/auth/login', { email, password }),
  logout: () => post<{ ok: true }>('/v1/auth/logout'),
};

export const admin = {
  overview: () => request<Overview>('/v1/admin/overview'),
  adjustments: () => request<{ adjustments: AdminAdjustment[] }>('/v1/admin/adjustments'),
  bookings: () => request<{ bookings: AdminBooking[] }>('/v1/admin/bookings'),
  approve: (reference: string, reason: string) =>
    post(`/v1/admin/adjustments/${reference}/approve`, { reason }),
  waive: (reference: string, reason: string) =>
    post(`/v1/admin/adjustments/${reference}/waive`, { reason }),
  remind: (reference: string) => post(`/v1/admin/adjustments/${reference}/remind`),

  /** Every rate card version, newest first. */
  rateCards: () => request<{ cards: RateCardSummary[] }>('/v1/admin/rate-cards'),

  /** Publish a new version. Rates left out are carried forward unchanged. */
  publishRateCard: (payload: {
    basedOn?: number;
    effectiveFrom: string;
    lanes: { lane: string; service: 'sea_lcl' | 'air_express'; rate: number }[];
  }) => post<{ card: RateCardSummary }>('/v1/admin/rate-cards', payload),

  customers: (search?: string) =>
    request<{ customers: CustomerSummary[] }>(
      search ? `/v1/admin/customers?search=${encodeURIComponent(search)}` : '/v1/admin/customers',
    ),

  customer: (reference: string) =>
    request<CustomerDetail>(`/v1/admin/customers/${encodeURIComponent(reference)}`),
};

/**
 * Whether to render a control. The server enforces the same rules on every
 * request — hiding a button is a courtesy, never the control itself.
 */
export const can = (user: CurrentUser | null, permission: string): boolean =>
  user?.permissions.includes(permission) ?? false;

/**
 * Where this person's work actually is.
 *
 * Signing in should land you on a screen you can use. A depot operator sent to
 * the operations overview — which their role cannot open — gets a refusal as
 * the first thing they see after typing a correct password, which reads like
 * the login failed rather than like the system knowing who they are.
 *
 * Ordered by what each role does most: the floor before the office.
 */
export const landingFor = (user: CurrentUser | null): string => {
  if (!user) return '/admin/login';
  if (can(user, 'admin:access')) return '/admin';
  if (can(user, 'depot:receive')) return '/admin/depot';
  if (can(user, 'bookings:read')) return '/admin/bookings';
  return '/';
};

// ── Rate cards ─────────────────────────────────────────────────────────────

export interface RateCardSummary {
  version: number;
  currency: string;
  state: 'live' | 'scheduled' | 'expired';
  effectiveFrom: string;
  effectiveTo: string | null;
  laneCount: number;
  bookingsQuoted: number;
  lanes: {
    lane: string;
    route: string;
    service: string;
    rate: string;
    unit: string;
    minimum: string;
    transit: string;
  }[];
  surcharges: { label: string; amount: string }[];
  taxPercent: string;
  tolerance: {
    percent: string;
    minimum: string;
    hardStopPercent: string;
    autoApproveDays: number;
  };
}

// ── Customers ──────────────────────────────────────────────────────────────

export interface CustomerSummary {
  reference: string;
  name: string;
  email: string;
  mobile: string;
  shipments: number;
  inFlight: number;
  billedTotal: string;
  outstandingTotal: string;
  overdueCount: number;
  lastBookedAt: string | null;
  joinedAt: string;
}

export interface CustomerDetail {
  customer: {
    reference: string;
    name: string;
    email: string;
    mobile: string;
    joinedAt: string;
    lastLoginAt: string | null;
    emailVerified: boolean;
  };
  shipments: {
    reference: string;
    route: string;
    status: string;
    statusLabel: string;
    total: string;
    bookedAt: string;
  }[];
  invoices: {
    number: string;
    bookingRef: string;
    total: string;
    status: string;
    dueAt: string;
    overdue: boolean;
  }[];
}
