// Aesthetic direction: architectural blueprint / drafting table — cyanotype
// blue-on-navy, hairline grid, corner registration marks, condensed stenciled
// display type. Chosen to literalize "Architect" in the exam name.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Login.css';

export function Login() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  async function handleSignIn() {
    setError(null);
    setIsSigningIn(true);

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });

    if (signInError) {
      setError(signInError.message);
      setIsSigningIn(false);
    }
    // On success the browser navigates to Google — nothing else to do here.
  }

  return (
    <div className={`login ${ready ? 'login--ready' : ''}`}>
      <div className="login__grid" aria-hidden="true" />
      <div className="login__panel">
        <span className="login__corner login__corner--tl" aria-hidden="true" />
        <span className="login__corner login__corner--tr" aria-hidden="true" />
        <span className="login__corner login__corner--bl" aria-hidden="true" />
        <span className="login__corner login__corner--br" aria-hidden="true" />

        <p className="login__eyebrow">ExamOwl &middot; Claude Certified Architect &mdash; Foundations</p>
        <h1 className="login__headline">Access Terminal</h1>
        <p className="login__subhead">
          Sign in to draw your practice paper and pick up where you left off.
        </p>

        <button
          type="button"
          className="login__button"
          onClick={handleSignIn}
          disabled={isSigningIn}
        >
          <GoogleMark />
          {isSigningIn ? 'Opening Google…' : 'Sign in with Google'}
        </button>

        {error && (
          <p className="login__error" role="alert">
            {error}
          </p>
        )}

        <div className="login__legal">
          <Link to="/privacy">Privacy Policy</Link>
          <span aria-hidden="true">&middot;</span>
          <Link to="/terms">Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="login__button-icon" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.85.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.94v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.94a9 9 0 0 0 0 8.1l3.03-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.42 0 9 0A9 9 0 0 0 .94 4.95l3.03 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
