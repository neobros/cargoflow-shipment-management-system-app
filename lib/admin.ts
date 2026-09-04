import { cookies } from 'next/headers';
import { ApiError } from './api';

/**
 * Server-side admin client.
 *
 * The session lives in an httpOnly cookie set by the API, which JavaScript
 * cannot read by design. Server components therefore forward the incoming
 * cookie header on every call — the browser never holds the token in a place a
 * script could reach.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

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

const serverFetch = async <T>(path: string): Promise<T> => {
  const jar = await cookies();
  const header = jar
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: header ? { cookie: header } : {},
      cache: 'no-store',
    });
  } catch {
    throw new ApiError('Cannot reach the CargoFlow API', 'network_unreachable', 0);
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (body as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ApiError(error?.message ?? 'Request failed', error?.code ?? 'request_failed', response.status);
  }

  return body as T;
};

/** Null rather than throwing — the layout uses this to decide whether to redirect. */
export const getCurrentUser = async (): Promise<CurrentUser | null> => {
  try {
    const { user } = await serverFetch<{ user: CurrentUser }>('/v1/auth/me');
    return user;
  } catch {
    return null;
  }
};

export const getOverview = (): Promise<Overview> => serverFetch<Overview>('/v1/admin/overview');

export const getAdjustments = (): Promise<{ adjustments: AdminAdjustment[] }> =>
  serverFetch<{ adjustments: AdminAdjustment[] }>('/v1/admin/adjustments');

export const getBookings = (): Promise<{ bookings: AdminBooking[] }> =>
  serverFetch<{ bookings: AdminBooking[] }>('/v1/admin/bookings');

export const can = (user: CurrentUser | null, permission: string): boolean =>
  user?.permissions.includes(permission) ?? false;
