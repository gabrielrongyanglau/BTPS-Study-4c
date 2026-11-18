import { useState } from 'react';
import { STUDY } from '../config';

const QUESTIONS = [
  {
    id: 'alliance',
    q: 'Which frequent-flyer programme are you a member of?',
    options: [STUDY.allianceName, 'Orbis Alliance', 'StarPath', 'None'],
    answer: STUDY.allianceName,
  },
  {
    id: 'policy',
    q: 'What happens if you choose a fare above the company fare cap?',
    options: ['It is not allowed', 'You must give a reason', 'Nothing happens', 'You pay the difference yourself'],
    answer: 'You must give a reason',
  },
];

export default function Check({ onAttempt, onPass }: { onAttempt: () => void; onPass: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState(false);
  const complete = QUESTIONS.every((q) => answers[q.id]);

  function submit() {
    onAttempt();
    const ok = QUESTIONS.every((q) => answers[q.id] === q.answer);
    if (ok) onPass();
    else setError(true);
  }

  return (
    <section className="panel narrow">
      <h1>Quick check</h1>
      <p className="lead">Before you start, please answer two questions about the instructions.</p>
      {QUESTIONS.map((q) => (
        <fieldset key={q.id} className="question">
          <legend>{q.q}</legend>
          {q.options.map((o) => (
            <label key={o} className="radio">
              <input
                type="radio"
                name={q.id}
                checked={answers[q.id] === o}
                onChange={() => { setAnswers({ ...answers, [q.id]: o }); setError(false); }}
              />
              <span>{o}</span>
            </label>
          ))}
        </fieldset>
      ))}
      {error && (
        <p className="error" role="alert">
          At least one answer is not quite right. Please check the instructions above and try again.
        </p>
      )}
      <div className="actions">
        <button className="btn btn-primary" disabled={!complete} onClick={submit}>Start practice trip</button>
      </div>
    </section>
  );
}
