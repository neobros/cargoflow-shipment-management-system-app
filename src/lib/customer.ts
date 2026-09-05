import { post, request } from './http';
import type { Invoice, PartyInput } from './depot';

export interface CurrentCustomer {
  reference: string;
  name: string;
  email: string;
  mobile: string;
  /** The address they last sent from, so the next booking pre-fills. */
  lastSender: PartyInput | null;
}

export interface CustomerShipment {
  reference: string;
  status: string;
  statusLabel: string;
  route: string;
  service: string;
  pieceCount: number;
  bookedTotal: string;
  currentTotal: string;
  awaitingApproval: boolean;
  invoiceNumber: string | null;
  bookedAt: string;
}

export interface InvoiceSummary {
  number: string;
  bookingRef: string;
  currency: string;
  total: string;
  status: 'issued' | 'paid' | 'void';
  issuedAt: string;
  dueAt: string;
  paidAt: string | null;
  overdue: boolean;
}

export const customer = {
  register: (input: { name: string; email: string; mobile: string; password: string }) =>
    post<{ customer: CurrentCustomer }>('/v1/customer/register', input),

  signIn: (email: string, password: string) =>
    post<{ customer: CurrentCustomer }>('/v1/customer/sign-in', { email, password }),

  signOut: () => post<{ signedOut: true }>('/v1/customer/sign-out'),

  /** Returns null when signed out, rather than throwing. */
  me: () => request<{ customer: CurrentCustomer | null }>('/v1/customer/me'),

  changePassword: (current: string, next: string) =>
    post<{ changed: true }>('/v1/customer/password', { current, next }),

  shipments: () => request<{ shipments: CustomerShipment[] }>('/v1/customer/shipments'),

  invoices: () => request<{ invoices: InvoiceSummary[] }>('/v1/customer/invoices'),

  invoice: (number: string) =>
    request<{ invoice: Invoice }>(`/v1/customer/invoices/${encodeURIComponent(number)}`),
};
