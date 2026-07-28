import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { recordLogin } from './lib/api';
import { AuthProvider } from './lib/AuthContext';
import { Login } from './pages/Login';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { MeetTheFounder } from './pages/MeetTheFounder';
import { NavShell } from './components/NavShell';
import { ExamPicker } from './pages/ExamPicker';
import { ExamSession } from './pages/ExamSession';
import { ExamSummary } from './pages/ExamSummary';
import { History } from './pages/History';
import { SessionReview } from './pages/SessionReview';
import { WeakAreas } from './pages/WeakAreas';
import { DomainDrilldown } from './pages/DomainDrilldown';

function AuthedApp({ session }: { session: Session }) {
  return (
    <AuthProvider session={session}>
      <NavShell />
    </AuthProvider>
  );
}

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

  return (
    <BrowserRouter>
      <Routes>
        {/* Public — reachable with no session, required for Google OAuth verification
            (a homepage plus Privacy Policy / Terms of Service, all publicly crawlable). */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/meet-the-founder" element={<MeetTheFounder />} />

        {session ? (
          <Route element={<AuthedApp session={session} />}>
            <Route path="/" element={<Navigate to="/exam" replace />} />
            <Route path="/exam" element={<ExamPicker />} />
            <Route path="/exam/:sessionId" element={<ExamSession />} />
            <Route path="/exam/:sessionId/summary" element={<ExamSummary />} />
            <Route path="/history" element={<History />} />
            <Route path="/history/:sessionId" element={<SessionReview />} />
            <Route path="/weak-areas" element={<WeakAreas />} />
            <Route path="/weak-areas/:examType/:domain" element={<DomainDrilldown />} />
            <Route path="*" element={<Navigate to="/exam" replace />} />
          </Route>
        ) : (
          <>
            <Route path="/" element={<Login />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}
