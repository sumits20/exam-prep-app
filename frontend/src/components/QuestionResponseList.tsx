import type { DomainQuestionItem, Option, ReviewItem } from '../lib/types';
import { formatDate } from '../lib/format';
import { DomainChip } from './DomainChip';
import './QuestionResponseList.css';

const OPTION_KEYS: Option[] = ['A', 'B', 'C', 'D'];

type Props =
  | { mode: 'session'; items: ReviewItem[] }
  | { mode: 'cross-session'; items: DomainQuestionItem[] };

export function QuestionResponseList(props: Props) {
  if (props.items.length === 0) {
    return <p className="qrl__empty">No questions to show here yet.</p>;
  }

  return (
    <div className="qrl">
      {props.mode === 'session'
        ? props.items.map((item) => <SessionItem key={item.examAnswerId} item={item} />)
        : props.items.map((item) => <CrossSessionItem key={item.examAnswerId} item={item} />)}
    </div>
  );
}

function OptionRow({ options, correctAnswer, selectedOption }: { options: DomainQuestionItem['options']; correctAnswer: Option; selectedOption: Option | null }) {
  return (
    <div className="qrl__options">
      {OPTION_KEYS.map((opt) => {
        const isCorrect = opt === correctAnswer;
        const isSelected = opt === selectedOption;
        const cls = [
          'qrl__option',
          isCorrect ? 'qrl__option--correct' : '',
          isSelected && !isCorrect ? 'qrl__option--wrong' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <div key={opt} className={cls}>
            <span className="qrl__option-key">{opt}</span>
            <span className="qrl__option-text">{options[opt]}</span>
            {isSelected && <span className="qrl__option-tag">Your answer</span>}
            {isCorrect && !isSelected && <span className="qrl__option-tag">Correct</span>}
          </div>
        );
      })}
    </div>
  );
}

function SessionItem({ item }: { item: ReviewItem }) {
  return (
    <div className="card--raised qrl__item">
      <div className="qrl__item-head">
        <DomainChip domain={item.domain} label={item.domainName} />
        <span className={`qrl__result ${item.isCorrect ? 'qrl__result--correct' : 'qrl__result--wrong'}`}>
          {item.isCorrect ? 'Correct' : item.selectedOption ? 'Incorrect' : 'Unanswered'}
        </span>
      </div>
      <p className="qrl__scenario">{item.scenario}</p>
      <p className="qrl__stem">{item.questionText}</p>
      <OptionRow options={item.options} correctAnswer={item.correctAnswer} selectedOption={item.selectedOption} />
      <p className="qrl__rationale">{item.rationale}</p>

      {(item.questionHistory.attempts > 0 || item.domainHistory.attempts > 0) && (
        <div className="qrl__pattern">
          {item.questionHistory.attempts > 0 && (
            <p className="qrl__pattern-line">
              You've answered this exact question {item.questionHistory.attempts} time
              {item.questionHistory.attempts === 1 ? '' : 's'} before — correct {item.questionHistory.correct} of{' '}
              {item.questionHistory.attempts}.
            </p>
          )}
          {item.domainHistory.attempts > 0 && (
            <p className="qrl__pattern-line">
              Across your other sessions, {item.domainName} accuracy is {item.domainHistory.accuracyPct}% (
              {item.domainHistory.correct}/{item.domainHistory.attempts}).
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function CrossSessionItem({ item }: { item: DomainQuestionItem }) {
  return (
    <div className="card--raised qrl__item">
      <div className="qrl__item-head">
        <span className="qrl__attempt-date">{formatDate(item.answeredAt)}</span>
        <span className={`qrl__result ${item.isCorrect ? 'qrl__result--correct' : 'qrl__result--wrong'}`}>
          {item.isCorrect ? 'Correct' : 'Incorrect'}
        </span>
      </div>
      <p className="qrl__scenario">{item.scenario}</p>
      <p className="qrl__stem">{item.questionText}</p>
      <OptionRow options={item.options} correctAnswer={item.correctAnswer} selectedOption={item.selectedOption} />
      <p className="qrl__rationale">{item.rationale}</p>
    </div>
  );
}
