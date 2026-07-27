import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { ReactNode } from 'react';

const AuthContext = createContext<Session | null>(null);

export function AuthProvider({ session, children }: { session: Session; children: ReactNode }) {
  return <AuthContext.Provider value={session}>{children}</AuthContext.Provider>;
}

// Only ever rendered inside <AuthProvider> once App.tsx has confirmed a session exists,
// so a null context here means the provider was skipped, not that auth is still loading.
export function useAuthSession(): Session {
  const session = useContext(AuthContext);
  if (!session) {
    throw new Error('useAuthSession must be used within AuthProvider');
  }
  return session;
}
