import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuthSession } from '../lib/AuthContext';
import { getDomainQuestions, startDomainPractice } from '../lib/api';
import { domainColorVar } from '../lib/constants';
import { QuestionResponseList } from '../components/QuestionResponseList';
import type { DomainQuestionsResponse } from '../lib/types';
import './DomainDrilldown.css';

export function DomainDrilldown() {
  const { domain: domainParam } = useParams();
  const domain = Number(domainParam);
  const session = useAuthSession();
  const navigate = useNavigate();
  const [data, setData] = useState<DomainQuestionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [practicing, setPracticing] = useState(false);

  useEffect(() => {
    getDomainQuestions(session.access_token, domain)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load domain questions'));
  }, [domain, session.access_token]);

  async function handlePractice() {
    setError(null);
    setPracticing(true);
    try {
      const res = await startDomainPractice(session.access_token, domain);
      navigate(`/exam/${res.session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start domain practice');
      setPracticing(false);
    }
  }

  if (error) {
    return (
      <p className="domain-drilldown__error" role="alert">
        {error}
      </p>
    );
  }

  if (!data) {
    return <p className="domain-drilldown__loading">Loading domain questions…</p>;
  }

  return (
    <div className="domain-drilldown">
      <Link to="/weak-areas" className="domain-drilldown__back">
        ← Back to weak areas
      </Link>

      <div className="domain-drilldown__headline-row">
        <div>
          <p className="eyebrow">Domain drilldown</p>
          <h1 className="domain-drilldown__headline" style={{ color: domainColorVar(domain) }}>
            {data.domainName}
          </h1>
        </div>
        <button type="button" className="btn btn--primary" disabled={practicing} onClick={handlePractice}>
          {practicing ? 'Starting…' : 'Practice this domain'}
        </button>
      </div>

      <p className="domain-drilldown__subhead">
        Every attempt at a domain {domain} question across your completed sessions, most recent first.
      </p>

      <QuestionResponseList mode="cross-session" items={data.items} />
    </div>
  );
}
