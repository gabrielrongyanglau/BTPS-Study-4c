import { useState } from 'react';
import { JUSTIFICATIONS, STUDY } from '../config';
import { clock, dayOffset, duration, money } from '../lib/format';
import type { Flight, Trip } from '../lib/types';

export interface ReviewResult {
  justification: string[];
  justificationText: string;
}

interface Props {
  trip: Trip;
  flight: Flight;
  practice: boolean;
  log: (type: string, data?: Record<string, unknown>) => void;
  onBack: () => void;
  onConfirm: (r: ReviewResult) => void;
}

export default function Review({ trip, flight: f, practice, log, onBack, onConfirm }: Props) {
  const [just, setJust] = useState<string[]>([]);
  const [justText, setJustText] = useState('');

  const over = !f.withinPolicy;
  const needsOtherText = just.includes('OTHER') && justText.trim().length < 3;
  const valid = !over || (just.length > 0 && !needsOtherText);

  function toggleJust(id: string) {
    const on = !just.includes(id);
    log('justify', { id, on });
    setJust(on ? [...just, id] : just.filter((x) => x !== id));
  }

  return (
    <div className="booking">
      {practice && (
        <div className="notice"><strong>Practice trip.</strong> This booking is not used in the study.</div>
      )}
      <section className="panel">
        <p className="eyebrow">Review your booking</p>
        <h1>{STUDY.origin.city} to {trip.city}</h1>
        <div className="summary">
          <div>
            <strong>{f.airline}</strong> <span className="muted">{f.flightNo}</span>
            <div className="small">
              Monday {clock(f.depMin)} {STUDY.origin.airport} → {clock(f.arrMin)}
              {dayOffset(f.arrMin) && <sup>{dayOffset(f.arrMin)}</sup>} {trip.airport} · {duration(f.durMin)} ·{' '}
              {f.stops === 0 ? 'Direct' : `1 stop via ${f.via}`}
            </div>
            <div className="small muted">
              {f.co2} kg CO₂e · {f.partner ? `+${f.points.toLocaleString('en-GB')} ${STUDY.rewards.name} points` : `No ${STUDY.rewards.name} points`}
            </div>
          </div>
          <div className="summary-price">
            <div className="price">{money(f.price)}</div>
            {f.withinPolicy ? (
              <span className="badge badge-safe">Within policy</span>
            ) : (
              <span className="badge badge-warn">{money(f.price - trip.fareCap)} above cap</span>
            )}
          </div>
        </div>
        <button className="link" onClick={onBack}>← Change flight</button>
      </section>

      {over && (
        <section className="panel">
          <h2>Reason for booking above the fare cap</h2>
          <p className="small muted">Your company asks for a reason when a fare is above the cap. Select all that apply.</p>
          {JUSTIFICATIONS.map((j) => (
            <label key={j.id} className="check">
              <input type="checkbox" checked={just.includes(j.id)} onChange={() => toggleJust(j.id)} />
              <span>{j.label}</span>
            </label>
          ))}
          {just.includes('OTHER') && (
            <textarea
              className="textarea"
              placeholder="Please describe your reason"
              value={justText}
              onChange={(e) => setJustText(e.target.value)}
              rows={2}
            />
          )}
        </section>
      )}

      <div className="actions sticky-actions">
        {!valid && (
          <span className="small muted">
            {just.length === 0 ? 'Give a reason for the fare. ' : ''}
            {needsOtherText ? 'Describe your other reason.' : ''}
          </span>
        )}
        <button
          className="btn btn-primary"
          disabled={!valid}
          onClick={() => onConfirm({ justification: just, justificationText: justText.trim() })}
        >
          Confirm booking
        </button>
      </div>
    </div>
  );
}
