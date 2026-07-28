// Reuses the marketing homepage's `.landing` chrome (Login.css) so this page
// matches its visual system exactly — same eyebrow/headline/footer classes,
// same --app-* tokens. Only the photo + letter-style body get page-specific
// rules, in MeetTheFounder.css.
import { Link } from 'react-router-dom';
import '../pages/Login.css';
import './MeetTheFounder.css';

export function MeetTheFounder() {
  return (
    <div className="landing">
      <header className="landing__topbar">
        <Link to="/" className="landing__brand">
          ExamOwl
        </Link>
        <nav className="landing__topnav">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </nav>
      </header>

      <main>
        <section className="landing__hero landing__hero--ready">
          <img
            src="/data/founder.jpg"
            alt="Sumit Sardar, founder of ExamOwl"
            className="meet-founder__photo"
          />
          <p className="eyebrow">About ExamOwl</p>
          <h1 className="landing__headline">Meet the Founder</h1>

          <div className="meet-founder__body">
            <p>Hi, I'm Sumit Sardar — the person behind ExamOwl.</p>
            <p>
              By day, I work in enterprise SAP consulting, specialising in billing and revenue systems
              for large organisations. Outside of that, I've spent the last few months deep in
              Anthropic's Claude certification programme myself — and quickly realised there wasn't a
              proper way to practice for the exams beyond re-reading documentation.
            </p>
            <p>
              So I built the tool I wished existed: realistic practice questions, domain-weighted
              sampling, and honest tracking of where you're actually weak — not just a score at the end.
            </p>
            <p>
              ExamOwl is independently built and maintained. If you have feedback or spot something
              wrong, I'd genuinely like to hear it.
            </p>
            <p className="meet-founder__signature">— Sumit</p>
          </div>
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
