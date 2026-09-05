import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { customer, type CurrentCustomer } from '@/lib/customer';

interface CustomerAuth {
  account: CurrentCustomer | null;
  checking: boolean;
  register: (input: {
    name: string;
    email: string;
    mobile: string;
    password: string;
  }) => Promise<CurrentCustomer>;
  signIn: (email: string, password: string) => Promise<CurrentCustomer>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CustomerContext = createContext<CustomerAuth | null>(null);

/**
 * Who is signed in on the customer side.
 *
 * Entirely separate from the staff `useAuth`: different cookie, different
 * endpoint, different context. A page that wants a customer cannot accidentally
 * be satisfied by a staff session, because it never sees one.
 */
export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<CurrentCustomer | null>(null);
  const [checking, setChecking] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { customer: me } = await customer.me();
      setAccount(me);
    } catch {
      // A dead API is not the same as being signed out, but from the browser's
      // point of view there is nothing else it can do about it.
      setAccount(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const register: CustomerAuth['register'] = useCallback(async (input) => {
    const { customer: created } = await customer.register(input);
    setAccount(created);
    setChecking(false);
    return created;
  }, []);

  const signIn: CustomerAuth['signIn'] = useCallback(async (email, password) => {
    const { customer: signedIn } = await customer.signIn(email, password);
    setAccount(signedIn);
    setChecking(false);
    return signedIn;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await customer.signOut();
    } finally {
      setAccount(null);
    }
  }, []);

  return (
    <CustomerContext.Provider value={{ account, checking, register, signIn, signOut, refresh }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer(): CustomerAuth {
  const value = useContext(CustomerContext);
  if (!value) throw new Error('useCustomer must be used inside a CustomerProvider');
  return value;
}
