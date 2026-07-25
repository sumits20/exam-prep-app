import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { recordLogin } from './lib/api';
import { Login } from './pages/Login';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);

      if (event === 'SIGNED_IN' && newSession) {
        recordLogin(newSession.access_token).catch((err) => {
          console.error('Failed to record login:', err);
        });
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) {
    return null;
  }

  if (!session) {
    return <Login />;
  }

  // Placeholder — exam selection routing is the next step.
  return (
    <main className="session-placeholder">
      <p className="session-placeholder__eyebrow">Access granted</p>
      <h1 className="session-placeholder__headline">Logged in as {session.user.email}</h1>
    </main>
  );
}
