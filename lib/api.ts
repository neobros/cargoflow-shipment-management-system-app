/**
 * The only place in the app that knows the API exists.
 *
 * Every response shape here mirrors what the backend actually returns — money
 * as pre-formatted strings computed by the pricing engine, never re-derived in
 * the browser. A price shown to a customer and a price stored on their booking
 * must come from the same arithmetic, and that arithmetic lives on the server.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type ServiceMode = 'sea_lcl' | 'air_express';

export type PackagingKind =
  | 'small_box'
  | 'medium_box'
  | 'large_box'
  | 'barrel'
  | 'custom_carton'
  | 'half_pallet';

export interface PackagingPreset {
  kind: PackagingKind;
  name: string;
  note: string;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  weightGrams: number;
}

export interface LaneService {
  service: ServiceMode;
  ratePerUnit: string;
  unit: string;
  minimum: string;
  transit: { min: number; max: number };
}

export interface Lane {
  code: string;
  from: string;
  to: string;
  services: LaneService[];
}

export interface Reference {
  rateCardVersion: number;
  currency: string;
  lanes: Lane[];
  packaging: PackagingPreset[];
  surcharges: {
    handlingPerPiece: string;
    customsClearance: string;
    originPickup: string;
    remoteDelivery: string;
    oversizePiece: string;
  };
  cover: { percent: string; minimum: string };
  taxPercent: string;
}

export interface PieceInput {
  packaging: PackagingKind;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  weightGrams: number;
}

export interface QuoteRequest {
  lane: string;
  service: ServiceMode;
  pieces: PieceInput[];
  declaredValue?: number;
  coverRequested?: boolean;
  pickupRequested?: boolean;
  remoteDelivery?: boolean;
}

export interface QuoteLine {
  code: string;
  label: string;
  basis: string;
  amount: string;
  amountMinor: number;
}

export interface Quote {
  rateCardVersion: number;
  currency: string;
  lane: string;
  service: ServiceMode;
  pieceCount: number;
  volume: { raw: number; display: string; unit: string };
  chargeable: { raw: number; display: string; unit: string; minimumApplied: boolean };
  weightKg: string;
  pieces: Array<{
    index: number;
    packaging: PackagingKind;
    dimensionsCm: string;
    weightKg: string;
    volume: string;
    oversize: boolean;
  }>;
  lines: QuoteLine[];
  subtotal: string;
  tax: string;
  total: string;
  totalMinor: number;
  totalDisplay: string;
  transit: { min: number; max: number };
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...init?.headers },
    });
  } catch {
    // A dead API is a normal condition in development, not an exception the
    // user should see a stack trace for.
    throw new ApiError('Cannot reach the CargoFlow API', 'network_unreachable', 0);
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (body as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ApiError(
      error?.message ?? 'That did not work',
      error?.code ?? 'request_failed',
      response.status,
    );
  }

  return body as T;
};

export const api = {
  /** Lanes, packaging presets and surcharges — the wizard renders from this. */
  reference: (): Promise<Reference> => request<Reference>('/v1/reference'),

  /** Price a shipment. Public, writes nothing. */
  estimate: (payload: QuoteRequest): Promise<{ quote: Quote }> =>
    request<{ quote: Quote }>('/v1/quotes/estimate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** Booked against verified, plus what the business may do about the gap. */
  compare: (booked: QuoteRequest, verified: QuoteRequest) =>
    request<{
      outcome: 'unchanged' | 'absorbed' | 'approval_required' | 'hard_stop' | 'refund';
      booked: Quote;
      verified: Quote;
      difference: string;
      differenceDisplay: string;
      differencePercent: string;
      tolerance: string;
      changedPieceIndexes: number[];
      autoApproveAt: string | null;
    }>('/v1/quotes/compare', {
      method: 'POST',
      body: JSON.stringify({ booked, verified }),
    }),
};

/** Millimetres are the storage unit; centimetres are what people say out loud. */
export const mmToCm = (mm: number): number => Math.round(mm / 10);
export const cmToMm = (cm: number): number => Math.round(cm * 10);
export const gramsToKg = (g: number): string => (g / 1000).toFixed(1);
export const kgToGrams = (kg: number): number => Math.round(kg * 1000);
