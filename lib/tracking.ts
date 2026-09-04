import { ApiError } from './api';

/**
 * Public tracking. Server-side only — the page renders on the server so a
 * shared tracking link works with JavaScript disabled and shows the shipment
 * in the first paint, which matters on a Sri Lankan mobile connection.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

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

export const trackShipment = async (reference: string): Promise<Tracking> => {
  let response: Response;

  try {
    response = await fetch(`${API_URL}/v1/track/${encodeURIComponent(reference)}`, {
      // Tracking is live data; a cached "at the depot" would be a lie.
      cache: 'no-store',
    });
  } catch {
    throw new ApiError('Cannot reach the CargoFlow API', 'network_unreachable', 0);
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (body as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ApiError(
      error?.message ?? 'We could not look that up',
      error?.code ?? 'request_failed',
      response.status,
    );
  }

  return body as Tracking;
};
