import { Link } from 'react-router-dom';
import './LegalDocument.css';

export function PrivacyPolicy() {
  return (
    <div className="legal-doc">
      <div className="legal-doc__inner">
        <Link to="/" className="legal-doc__back">
          ← Back to home
        </Link>

        <p className="legal-doc__eyebrow">ExamOwl · Legal</p>
        <h1 className="legal-doc__title">Privacy Policy</h1>
        <p className="legal-doc__updated">Last updated: 27 July 2026</p>

        <div className="legal-doc__section">
          <p>
            ExamOwl ("we", "us", "our") provides a practice-exam simulation service for the Claude
            Certified Architect certification tracks. This policy explains what information we collect
            when you use ExamOwl, why we collect it, and how it's handled.
          </p>
        </div>

        <div className="legal-doc__section">
          <h2>Information we collect</h2>
          <ul>
            <li>
              <strong>Account information:</strong> when you sign in with Google, we receive your name,
              email address, and profile picture from Google via our authentication provider, Supabase.
            </li>
            <li>
              <strong>Login history:</strong> the date/time of each sign-in and your browser's user-agent
              string, kept for account security purposes.
            </li>
            <li>
              <strong>Exam activity:</strong> the practice sessions you start, the questions you're shown,
              the answers you submit, your scores, and timing — this is the core data the service needs
              to let you resume sessions, review past attempts, and track your progress by domain.
            </li>
          </ul>
        </div>

        <div className="legal-doc__section">
          <h2>How we use your information</h2>
          <p>
            Your information is used <strong>exclusively to operate ExamOwl</strong>: authenticating you,
            saving and resuming your exam sessions, showing your history and performance breakdowns, and
            — periodically — generating AI-assisted study recommendations based on your own past answers.
          </p>
          <p>
            <strong>We do not sell your data.</strong> We do not use it for advertising, and we do not
            share it with third parties for their own marketing or analytics purposes. Your exam activity
            is used only for exam usage monitoring and improving your own study experience — nothing else.
          </p>
        </div>

        <div className="legal-doc__section">
          <h2>Third-party processors</h2>
          <p>In order to run the service, some of your information is processed by:</p>
          <ul>
            <li>
              <strong>Supabase</strong> — authentication and database hosting for all account and exam
              data.
            </li>
            <li>
              <strong>Google</strong> — sign-in (Google OAuth). We never see or store your Google
              password.
            </li>
            <li>
              <strong>Anthropic</strong> — the Claude API is used to generate the periodic study-summary
              feature, using your own aggregated answer data.
            </li>
          </ul>
          <p>Each of these providers processes data under their own privacy policies.</p>
        </div>

        <div className="legal-doc__section">
          <h2>Cookies</h2>
          <p>
            ExamOwl uses only the essential session/authentication cookie set by Supabase Auth to keep you
            signed in. We do not use advertising or third-party tracking cookies.
          </p>
        </div>

        <div className="legal-doc__section">
          <h2>Data retention and your rights</h2>
          <p>
            We retain your account and exam data for as long as your account is active. You can request
            access to, correction of, or deletion of your data at any time by contacting us (below); we'll
            action deletion requests within a reasonable time.
          </p>
        </div>

        <div className="legal-doc__section">
          <h2>Children's privacy</h2>
          <p>ExamOwl is not directed at, and is not knowingly used by, children under 13.</p>
        </div>

        <div className="legal-doc__section">
          <h2>Changes to this policy</h2>
          <p>
            If this policy changes, we'll update the date above. Continued use of ExamOwl after a change
            means you accept the revised policy.
          </p>
        </div>

        <div className="legal-doc__section">
          <h2>Contact</h2>
          <p>
            Questions about this policy, or requests regarding your data, can be sent to{' '}
            <span className="legal-doc__placeholder">[your contact email]</span>.
          </p>
        </div>

        <div className="legal-doc__footer">
          <Link to="/terms">Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}
