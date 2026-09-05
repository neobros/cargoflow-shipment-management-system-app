import { API_URL, ApiError } from './http';

/**
 * Download a file from the API.
 *
 * The API is on a different origin and the route needs the session cookie, so
 * a plain `<a href>` would arrive unauthenticated. Fetching with credentials
 * and handing the blob to a synthetic link keeps the download working while
 * the session stays httpOnly.
 *
 * The object URL is revoked afterwards; without that every download holds its
 * bytes in memory until the tab closes, which for a clerk issuing forty
 * invoices is forty PDFs of leak.
 */
export const downloadFile = async (path: string, fallbackName: string): Promise<void> => {
  const response = await fetch(`${API_URL}${path}`, { credentials: 'include' });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: { code?: string; message?: string } }
      | null;
    throw new ApiError(
      body?.error?.message ?? 'That document could not be produced',
      body?.error?.code ?? 'download_failed',
      response.status,
    );
  }

  // Prefer the name the server chose — it is the document number.
  const disposition = response.headers.get('content-disposition') ?? '';
  const named = /filename="([^"]+)"/.exec(disposition)?.[1];

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = named ?? fallbackName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
