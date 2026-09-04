import { request } from './http';

export interface TrackedMeasurement {
  dimensionsCm: string;
  weightKg: string;
  volume: string;
}

export interface TrackedPiece {
  trackingId: string | null;
  sequence: number;
  packaging: string;
  status: string;
  statusLabel: string;
  declared: TrackedMeasurement;
  verified: TrackedMeasurement | null;
  changed: boolean;
}

export interface TrackedStage {
  code: string;
  title: string;
  detail: string;
  at: string | null;
  state: 'done' | 'current' | 'pending';
}

export interface Tracking {
  booking: {
    reference: string;
    customerName: string;
    route: { from: string; to: string };
    service: string;
    status: string;
    statusLabel: string;
    bookedAt: string;
    pieceCount: number;
  };
  matchedTrackingId: string | null;
  pieces: TrackedPiece[];
  timeline: TrackedStage[];
  adjustment: {
    reference: string;
    state: string;
    bookedTotal: string;
    verifiedTotal: string;
    difference: string;
    differenceDisplay: string;
    differencePercent: string;
    changedPieceIndexes: number[];
    raisedAt: string;
    autoApproveAt: string | null;
  } | null;
  container: {
    number: string;
    vessel: string;
    voyage: string;
    cutOffAt: string;
    etaAt: string;
  } | null;
  totals: {
    declaredVolume: string;
    verifiedVolume: string | null;
    weightKg: string;
    payable: string;
    payableDisplay: string;
  };
}

/** Public tracking — no account, just the number on the label. */
export const trackShipment = (reference: string): Promise<Tracking> =>
  request<Tracking>(`/v1/track/${encodeURIComponent(reference)}`);
