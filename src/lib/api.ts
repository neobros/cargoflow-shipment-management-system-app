import { request, post } from './http';

export { ApiError, API_URL } from './http';

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
    oversizePiece: string;
  };
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

export const api = {
  /** Lanes, packaging presets and surcharges — the wizard renders from this. */
  reference: (): Promise<Reference> => request<Reference>('/v1/reference'),

  /** Price a shipment. Public, writes nothing. */
  estimate: (payload: QuoteRequest): Promise<{ quote: Quote }> =>
    post<{ quote: Quote }>('/v1/quotes/estimate', payload),

  /** Booked against verified, plus what the business may do about the gap. */
  compare: (booked: QuoteRequest, verified: QuoteRequest) =>
    post<{
      outcome: 'unchanged' | 'absorbed' | 'approval_required' | 'hard_stop' | 'refund';
      booked: Quote;
      verified: Quote;
      difference: string;
      differenceDisplay: string;
      differencePercent: string;
      tolerance: string;
      changedPieceIndexes: number[];
      autoApproveAt: string | null;
    }>('/v1/quotes/compare', { booked, verified }),
};

/** Millimetres are the storage unit; centimetres are what people say out loud. */
export const mmToCm = (mm: number): number => Math.round(mm / 10);
export const cmToMm = (cm: number): number => Math.round(cm * 10);
export const gramsToKg = (g: number): string => (g / 1000).toFixed(1);
export const kgToGrams = (kg: number): number => Math.round(kg * 1000);
