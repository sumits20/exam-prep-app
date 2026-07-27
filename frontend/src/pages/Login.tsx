// Aesthetic direction: this is the public marketing/sign-in page, so it uses the
// same light app-shell system as the rest of the product (--app-* tokens,
// .card--raised, .domain-chip, .eyebrow) rather than a separate splash look — the
// signature element is the domain-weighting bar below, built from the paper
// generator's real weights (see backend exam_domains), so the hero makes a
// concrete, checkable claim instead of generic marketing art.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { DOMAIN_NAMES, domainColorVar } from '../lib/constants';
import './Login.css';

const DOMAIN_WEIGHTS: { domain: number; pct: number }[] = [
  { domain: 1, pct: 27 },
  { domain: 2, pct: 18 },
  { domain: 3, pct: 20 },
  { domain: 4, pct: 20 },
  { domain: 5, pct: 15 },
];

const STATS = [
  { value: '300+', label: 'Practice questions' },
  { value: '6', label: 'Official exam scenarios' },
  { value: '5', label: 'Weighted domains' },
  { value: '72%', label: 'Passing threshold' },
];

const STEPS = [
  {
    n: 1,
    title: 'Practice',
    body: 'Draw a timed, scenario-based paper weighted exactly like the real exam — not a random grab-bag of questions.',
  },
  {
    n: 2,
    title: 'Track',
    body: 'Every session is saved to your history, with a domain-by-domain breakdown of what you got right.',
  },
  {
    n: 3,
    title: 'Improve',
    body: "Weak Areas shows exactly which domains are holding your score back, with one click into focused practice.",
  },
];

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
    <div className="landing">
      <header className="landing__topbar">
        <span className="landing__brand">ExamOwl</span>
        <nav className="landing__topnav">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <button
            type="button"
            className="btn btn--ghost landing__topbar-cta"
            onClick={handleSignIn}
            disabled={isSigningIn}
          >
            Sign in
          </button>
        </nav>
      </header>

      <main>
        <section className={`landing__hero${ready ? ' landing__hero--ready' : ''}`}>
          <p className="eyebrow">Practice exams for Claude Certification</p>
          <h1 className="landing__headline">Master the Claude Certified Architect exam</h1>
          <p className="landing__subhead">
            ExamOwl is a practice-exam platform for the Claude Certification program — starting with
            the Claude Certified Architect &ndash; Foundations track, with more tracks planned. Take
            realistic, scenario-based practice papers weighted exactly like the real exam, so a good
            score actually means something.
          </p>

          <button type="button" className="btn btn--primary landing__cta" onClick={handleSignIn} disabled={isSigningIn}>
            <GoogleMark />
            {isSigningIn ? 'Opening Google…' : 'Sign in with Google to start practicing'}
          </button>

          {error && (
            <p className="landing__error" role="alert">
              {error}
            </p>
          )}

          <div className="landing__weightbar-wrap">
            <p className="landing__weightbar-label">Every practice paper is drawn to this exact domain weighting</p>
            <div className="landing__weightbar">
              {DOMAIN_WEIGHTS.map((d) => (
                <span
                  key={d.domain}
                  className="landing__weightbar-seg"
                  style={{ width: ready ? `${d.pct}%` : 0, background: domainColorVar(d.domain) }}
                />
              ))}
            </div>
            <div className="landing__weightbar-legend">
              {DOMAIN_WEIGHTS.map((d) => (
                <span key={d.domain} className="domain-chip" style={{ color: domainColorVar(d.domain) }}>
                  <span className="domain-chip__dot" />
                  {DOMAIN_NAMES[d.domain]} &middot; {d.pct}%
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="landing__section">
          <p className="eyebrow">What is ExamOwl</p>
          <h2 className="landing__section-heading">Built to feel like the real exam, not a quiz app</h2>
          <p className="landing__section-body">
            Every paper draws from a bank of scenario-based questions modeled on the official exam guide,
            samples it to match the real domain weighting, and scores it against the same 72% passing
            threshold. After every attempt you get a full review — what you got right, what you missed, and
            why — plus a running history across every session you take.
          </p>

          <div className="landing__stats">
            {STATS.map((s) => (
              <div key={s.label} className="card--raised landing__stat">
                <span className="landing__stat-value">{s.value}</span>
                <span className="landing__stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="landing__section">
          <p className="eyebrow">How it works</p>
          <h2 className="landing__section-heading">Practice, track, improve</h2>

          <div className="landing__steps">
            {STEPS.map((step) => (
              <div key={step.n} className="card--raised landing__step">
                <span className="landing__step-number">{step.n}</span>
                <h3 className="landing__step-title">{step.title}</h3>
                <p className="landing__step-body">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="landing__section landing__section--why">
          <p className="eyebrow">Why Google sign-in</p>
          <h2 className="landing__section-heading">We use it to save your progress — nothing else</h2>
          <p className="landing__section-body">
            Signing in with Google lets ExamOwl save your exam sessions, scores, and per-domain weak-area
            tracking to your account, so you can pick up where you left off on any device. We don't use
            your Google account for anything beyond that — see the{' '}
            <Link to="/privacy">Privacy Policy</Link> for the full detail.
          </p>
        </section>

        <section className="landing__section landing__section--final-cta">
          <h2 className="landing__section-heading">Ready to see where you actually stand?</h2>
          <button type="button" className="btn btn--primary landing__cta" onClick={handleSignIn} disabled={isSigningIn}>
            <GoogleMark />
            {isSigningIn ? 'Opening Google…' : 'Sign in with Google'}
          </button>
        </section>
      </main>

      <footer className="landing__footer">
        <span className="landing__brand">ExamOwl</span>
        <div className="landing__footer-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </div>
        <p className="landing__footer-note">
          Independent study tool. Not affiliated with or endorsed by Anthropic.
        </p>
      </footer>
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
