import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { auth, type CurrentUser } from '@/lib/admin';

interface AuthValue {
  user: CurrentUser | null;
  /** True until the first /auth/me has resolved — do not redirect before then. */
  checking: boolean;
  signIn: (email: string, password: string) => Promise<CurrentUser>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

/**
 * Who is signed in, asked once and shared.
 *
 * Without server rendering the browser cannot know this before it asks, so the
 * guard has to wait for the answer rather than redirecting on a null it has not
 * confirmed. `checking` exists to stop that flash.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [checking, setChecking] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { user: current } = await auth.me();
      setUser(current);
    } catch {
      // 401 is the normal answer for a signed-out visitor, not a failure.
      setUser(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { user: signedIn } = await auth.login(email, password);
    setUser(signedIn);
    setChecking(false);
    return signedIn;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await auth.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, checking, signIn, signOut, refresh }),
    [user, checking, signIn, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}
