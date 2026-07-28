import { Link } from 'react-router-dom';
import './LegalDocument.css';

export function TermsOfService() {
  return (
    <div className="legal-doc">
      <div className="legal-doc__inner">
        <Link to="/" className="legal-doc__back">
          ← Back to home
        </Link>

        <p className="legal-doc__eyebrow">ExamOwl · Legal</p>
        <h1 className="legal-doc__title">Terms of Service</h1>
        <p className="legal-doc__updated">Last updated: 27 July 2026</p>

        <div className="legal-doc__section">
          <h2>1. Acceptance of terms</h2>
          <p>
            By creating an account or otherwise using ExamOwl ("the Service"), you agree to these Terms of
            Service. If you don't agree, please don't use the Service.
          </p>
        </div>

        <div className="legal-doc__section">
          <h2>2. Description of the service</h2>
          <p>
            ExamOwl is a practice-exam simulation tool that lets you take timed practice papers, review
            past attempts, and track performance across exam domains.
          </p>
        </div>

        <div className="legal-doc__section">
          <h2>3. Not affiliated with Anthropic</h2>
          <p>
            ExamOwl is an independent, unofficial study tool. It is <strong>not created, endorsed, or
            affiliated with Anthropic</strong>. References to "Claude Certified Architect" and related exam
            names describe the certification the practice content is modeled on; they do not imply any
            partnership with, or approval from, Anthropic. Passing practice papers on ExamOwl does not
            guarantee any result on an official certification exam.
          </p>
        </div>

        <div className="legal-doc__section">
          <h2>4. Accounts</h2>
          <p>
            You sign in with Google. You're responsible for keeping your Google account secure — anyone
            with access to it can access your ExamOwl data.
          </p>
        </div>

        <div className="legal-doc__section">
          <h2>5. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Scrape, copy, or redistribute the question bank or exam content;</li>
            <li>Attempt to reverse-engineer, disrupt, or circumvent the Service's access controls;</li>
            <li>Use the Service in any way that violates applicable law.</li>
          </ul>
        </div>

        <div className="legal-doc__section">
          <h2>6. Intellectual property</h2>
          <p>
            All question content, design, and code that make up the Service belong to their respective
            owners. Using the Service doesn't grant you any right to reproduce or resell that content.
          </p>
        </div>

        <div className="legal-doc__section">
          <h2>7. Disclaimer of warranties</h2>
          <p>
            The Service is provided "as is", without warranties of any kind, express or implied, including
            accuracy, completeness, or fitness for a particular purpose. Practice content is a study aid
            and is not guaranteed to reflect the content or difficulty of any official certification exam.
          </p>
        </div>

        <div className="legal-doc__section">
          <h2>8. Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, ExamOwl and its operator will not be liable for any
            indirect, incidental, or consequential damages arising from your use of the Service, including
            exam outcomes based on your use of it.
          </p>
        </div>

        <div className="legal-doc__section">
          <h2>9. Termination</h2>
          <p>
            We may suspend or terminate access to the Service for any account that violates these terms.
            You may stop using the Service, and request deletion of your data, at any time.
          </p>
        </div>

        <div className="legal-doc__section">
          <h2>10. Changes to these terms</h2>
          <p>
            We may update these terms from time to time; the date above reflects the latest revision.
            Continued use of the Service after a change means you accept the revised terms.
          </p>
        </div>

        <div className="legal-doc__section">
          <h2>11. Governing law</h2>
          <p>
            These terms are governed by the laws of England and Wales.
          </p>
        </div>

        <div className="legal-doc__section">
          <h2>12. Contact</h2>
          <p>
            Questions about these terms can be sent to support@examowl.co.uk.
          </p>
        </div>

        <div className="legal-doc__footer">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/meet-the-founder">Meet the Founder</Link>
        </div>
      </div>
    </div>
  );
}
