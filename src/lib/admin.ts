import { post, request } from './http';

export type Role = 'operator' | 'supervisor' | 'billing' | 'admin';

export interface CurrentUser {
  email: string;
  name: string;
  role: Role;
  roleLabel: string;
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
};

/**
 * Whether to render a control. The server enforces the same rules on every
 * request — hiding a button is a courtesy, never the control itself.
 */
export const can = (user: CurrentUser | null, permission: string): boolean =>
  user?.permissions.includes(permission) ?? false;
