import { post, request } from './http';
import type { PackagingKind, PieceInput, ServiceMode } from './api';

/** Both parties, requirement 1.2. */
export interface PartyInput {
  name: string;
  mobile: string;
  email?: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postcode: string;
  country: string;
  idNumber?: string;
}

export interface CreateBookingRequest {
  lane: string;
  service: ServiceMode;
  pieces: PieceInput[];
  sender: PartyInput;
  receiver: PartyInput;
}

export interface CreatedBooking {
  reference: string;
  status: string;
  total: string;
  totalMinor: number;
  pieceCount: number;
  transit: { min: number; max: number };
  dropOff: { depot: string; address: string; cutOff: string };
}

export const bookings = {
  /** 1.3 — submit the shipment. */
  create: (payload: CreateBookingRequest) =>
    post<{ booking: CreatedBooking; labelsToExpect: string[] }>('/v1/bookings', payload),
};

// ── Depot ──────────────────────────────────────────────────────────────────

export interface QueueEntry {
  bookingRef: string;
  customerName: string;
  route: string;
  service: string;
  pieceCount: number;
  awaitingReceipt: number;
  awaitingMeasure: number;
  held: number;
  readyToLabel: number;
  bookedTotal: string;
  bookedAt: string;
}

export interface ReceivedPiece {
  sequence: number;
  trackingId: string;
  packaging: string;
  declared: { dimensionsCm: string; weightKg: string };
}

export interface VerifyResult {
  trackingId: string;
  bookingRef: string;
  status: string;
  matchedDeclared: boolean;
  measured: { dimensionsCm: string; weightKg: string; volume: string };
  declared: { dimensionsCm: string; weightKg: string; volume: string };
  rerate: {
    outcome: 'unchanged' | 'absorbed' | 'approval_required' | 'hard_stop' | 'refund';
    bookedTotal: string;
    verifiedTotal: string;
    difference: string;
    differencePercent: string;
    tolerance: string;
    adjustmentReference: string | null;
    customerNotified: boolean;
    message: string;
  };
  provisional: boolean;
}

export interface PieceLookup {
  trackingId: string;
  bookingRef: string;
  customerName: string;
  consignee: string;
  route: string;
  sequence: number;
  packaging: PackagingKind;
  status: string;
  declared: { lengthCm: number; widthCm: number; heightCm: number; weightKg: number; volume: string };
  verified:
    | { lengthCm: number; widthCm: number; heightCm: number; weightKg: number; volume: string }
    | null;
  receivedAt: string | null;
  verifiedAt: string | null;
  loaded: boolean;
}

export interface Label {
  trackingId: string;
  bookingRef: string;
  sequence: number;
  pieceCount: number;
  consignee: string;
  destination: string;
  receiver: PartyInput;
  sender: PartyInput;
  service: string;
  lane: string;
  route: string;
  packaging: string;
  measurement: { dimensionsCm: string; weightKg: string; volume: string; source: string };
  barcodeSvg: string;
  printedAt: string;
}

export interface DepotOverview {
  counts: {
    awaitingReceipt: number;
    awaitingMeasure: number;
    held: number;
    readyToLabel: number;
    loadedToday: number;
  };
  openContainers: {
    containerNumber: string;
    destination: string;
    vessel: string;
    voyage: string;
    fillPercent: number;
    pieceCount: number;
    cutOffAt: string;
    hoursToCutOff: number;
  }[];
  heldPieces: {
    trackingId: string;
    bookingRef: string;
    consignee: string;
    declaredVolume: string;
    verifiedVolume: string;
  }[];
  recentEvents: { at: string; pieceId: string; code: string; actor: string; detail: string }[];
}

export const depot = {
  /** The warehouse dashboard. */
  overview: () => request<DepotOverview>('/v1/depot/overview'),

  queue: () => request<{ entries: QueueEntry[] }>('/v1/depot/queue'),

  piece: (trackingId: string) =>
    request<{ piece: PieceLookup }>(`/v1/depot/pieces/${encodeURIComponent(trackingId)}`),

  /** 2.1 — issue tracking IDs on physical receipt. */
  receive: (reference: string, depotId = 'WS-03') =>
    post<{ reference: string; received: ReceivedPiece[]; alreadyReceived: ReceivedPiece[] }>(
      `/v1/depot/bookings/${encodeURIComponent(reference)}/receive`,
      { depotId },
    ),

  /** 2.1 + 2.2 — measure, and learn the price consequence in the same call. */
  verify: (
    trackingId: string,
    measurement: { lengthMm: number; widthMm: number; heightMm: number; weightGrams: number },
  ) => post<VerifyResult>(`/v1/depot/pieces/${encodeURIComponent(trackingId)}/verify`, measurement),

  label: (trackingId: string) =>
    request<{ label: Label }>(`/v1/depot/pieces/${encodeURIComponent(trackingId)}/label`),

  markPrinted: (trackingIds: string[]) =>
    post<{ labelled: number }>('/v1/depot/labels/printed', { trackingIds }),

  /** 2.1 — the counter. */
  walkIn: (payload: {
    lane: string;
    service?: ServiceMode;
    senderName: string;
    senderMobile: string;
    receiverName: string;
    receiverMobile: string;
    receiverCity: string;
    pieces: PieceInput[];
  }) =>
    post<{
      reference: string;
      total: string;
      pieces: { trackingId: string; dimensionsCm: string; weightKg: string }[];
      needsAddress: true;
    }>('/v1/depot/walk-in', payload),
};

// ── Containers, 2.3 ────────────────────────────────────────────────────────

export interface ContainerSummary {
  containerNumber: string;
  type: string;
  vessel: string;
  voyage: string;
  lane: string;
  route: string;
  destinationLabel: string;
  status: 'open' | 'sealed' | 'in_transit' | 'arrived' | 'devanned';
  sealNumber: string | null;
  capacity: string;
  loaded: string;
  fillPercent: number;
  pieceCount: number;
  bookingCount: number;
  cutOffAt: string;
  sailsAt: string;
  etaAt: string;
}

export interface ContainerPiece {
  trackingId: string;
  bookingRef: string;
  consignee: string;
  destination: string;
  packaging: string;
  volume: string;
  weightKg: string;
  status: string;
}

export interface Bol {
  number: string;
  container: {
    containerNumber: string;
    type: string;
    sealNumber: string | null;
    vessel: string;
    voyage: string;
    portOfLoading: string;
    portOfDischarge: string;
    sailsAt: string;
    etaAt: string;
  };
  carrier: string;
  totals: { packages: number; grossWeightKg: string; measurementM3: string; houses: number };
  houses: {
    bookingRef: string;
    shipper: PartyInput;
    consignee: PartyInput;
    marks: string[];
    packageCount: number;
    packaging: string;
    grossWeightKg: string;
    measurementM3: string;
  }[];
  issuedAt: string;
  freightTerms: string;
}

const path = (containerNumber: string) => encodeURIComponent(containerNumber);

export const containers = {
  list: () => request<{ containers: ContainerSummary[] }>('/v1/containers'),

  get: (containerNumber: string) =>
    request<{ container: ContainerSummary; pieces: ContainerPiece[] }>(
      `/v1/containers/${path(containerNumber)}`,
    ),

  create: (payload: {
    type: string;
    vessel: string;
    voyage: string;
    lane: string;
    cutOffAt: string;
    sailsAt: string;
    etaAt: string;
  }) => post<{ container: ContainerSummary }>('/v1/containers', payload),

  load: (containerNumber: string, trackingIds: string[]) =>
    post<{
      containerNumber: string;
      loaded: string[];
      refused: { trackingId: string; reason: string }[];
      container: ContainerSummary;
    }>(`/v1/containers/${path(containerNumber)}/load`, { trackingIds }),

  seal: (containerNumber: string, sealNumber: string) =>
    post<{ container: ContainerSummary }>(`/v1/containers/${path(containerNumber)}/seal`, {
      sealNumber,
    }),

  bol: (containerNumber: string) => request<{ bol: Bol }>(`/v1/containers/${path(containerNumber)}/bol`),
};

// ── Invoices and messages, 3.1 / 3.2 ───────────────────────────────────────

export interface Invoice {
  number: string;
  bookingRef: string;
  customerRef: string;
  customerName: string;
  billTo: PartyInput;
  currency: string;
  lines: { code: string; label: string; basis: string; amount: string }[];
  subtotal: string;
  tax: string;
  total: string;
  totalMinor: number;
  basis: 'booked' | 'verified';
  rateCardVersion: number;
  status: 'issued' | 'paid' | 'void';
  issuedAt: string;
  dueAt: string;
  paidAt: string | null;
  issuedBy: string;
  overdue: boolean;
}

export interface NotificationRow {
  entityId: string;
  event: string;
  channel: 'email' | 'sms';
  to: string;
  subject: string;
  body: string;
  bookingRef: string;
  status: 'pending' | 'sent' | 'failed' | 'suppressed';
  attempts: number;
  /** Which transport carried it — `log:email`, `smtp`, `twilio`. */
  transport: string | null;
  error: string | null;
  createdAt: string;
  sentAt: string | null;
}

export interface QueueHealth {
  pending: number;
  failed: number;
  sentToday: number;
}

export const documents = {
  invoices: () => request<{ invoices: Invoice[] }>('/v1/invoices'),
  invoice: (number: string) => request<{ invoice: Invoice }>(`/v1/invoices/${encodeURIComponent(number)}`),
  issue: (reference: string) =>
    post<{ invoice: Invoice }>(`/v1/bookings/${encodeURIComponent(reference)}/invoice`),
  markPaid: (number: string) =>
    post<{ invoice: Invoice }>(`/v1/invoices/${encodeURIComponent(number)}/paid`),
  retryNotification: (entityId: string, event: string) =>
    post<{ requeued: number }>('/v1/notifications/retry', { entityId, event }),

  notifications: (bookingRef?: string) =>
    request<{ health: QueueHealth; notifications: NotificationRow[] }>(
      bookingRef ? `/v1/notifications?bookingRef=${encodeURIComponent(bookingRef)}` : '/v1/notifications',
    ),
};
