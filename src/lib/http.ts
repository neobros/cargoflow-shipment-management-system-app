/**
 * The only place in the app that knows the API exists.
 *
 * Everything runs in the browser now, so every request carries the session
 * cookie with `credentials: 'include'`. The cookie stays httpOnly — JavaScript
 * still cannot read the token, it just gets sent.
 */

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

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

export const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: 'include',
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

export const post = <T>(path: string, payload?: unknown): Promise<T> =>
  request<T>(path, { method: 'POST', body: payload ? JSON.stringify(payload) : undefined });
