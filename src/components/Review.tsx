import { useState } from 'react';
import { ADDONS, JUSTIFICATIONS, STUDY } from '../config';
import { clock, dayOffset, duration, money } from '../lib/format';
import type { Flight, Trip } from '../lib/types';

export interface ReviewResult {
  justification: string[];
  justificationText: string;
  addons: string[];
  addonSpend: number;
  bleisure: boolean;
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
  const [addons, setAddons] = useState<string[]>([]);
  const [just, setJust] = useState<string[]>([]);
  const [justText, setJustText] = useState('');
  const [bleisure, setBleisure] = useState<boolean | null>(null);

  const spend = addons.reduce((s, id) => s + ADDONS.find((a) => a.id === id)!.price, 0);
  const remaining = STUDY.addonAllowance - spend;
  const over = !f.withinPolicy;
  const needsOtherText = just.includes('OTHER') && justText.trim().length < 3;
  const valid = bleisure !== null && (!over || (just.length > 0 && !needsOtherText));

  function toggleAddon(id: string) {
    const on = !addons.includes(id);
    log('addon', { id, on });
    setAddons(on ? [...addons, id] : addons.filter((x) => x !== id));
  }

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

      <section className="panel">
        <div className="row-between">
          <h2>Add-ons</h2>
          <span className={`allowance ${remaining === 0 ? 'allowance-empty' : ''}`}>
            {money(remaining)} of {money(STUDY.addonAllowance)} left
          </span>
        </div>
        <p className="small muted">Optional. Paid from your per-trip allowance, which cannot be carried over.</p>
        <div className="addons">
          {ADDONS.map((a) => {
            const on = addons.includes(a.id);
            const disabled = !on && a.price > remaining;
            return (
              <label key={a.id} className={`addon ${on ? 'addon-on' : ''} ${disabled ? 'addon-disabled' : ''}`}>
                <input type="checkbox" checked={on} disabled={disabled} onChange={() => toggleAddon(a.id)} />
                <span className="addon-text">
                  <strong>{a.title}</strong>
                  <span className="small muted">{a.desc}</span>
                </span>
                <span className="addon-price">{money(a.price)}</span>
              </label>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <h2>Extend your stay?</h2>
        <p className="small">
          Your company allows you to add two personal days in {trip.city} after the meeting. The return flight change is
          covered; the extra hotel nights are at your own cost.
        </p>
        <div className="seg">
          {[true, false].map((v) => (
            <label key={String(v)} className={`seg-btn ${bleisure === v ? 'seg-on' : ''}`}>
              <input
                type="radio"
                name="bleisure"
                checked={bleisure === v}
                onChange={() => { log('bleisure', { value: v }); setBleisure(v); }}
              />
              {v ? 'Yes, add 2 days' : 'No, return after the meeting'}
            </label>
          ))}
        </div>
      </section>

      <div className="actions sticky-actions">
        {!valid && (
          <span className="small muted">
            {bleisure === null ? 'Choose whether to extend your stay. ' : ''}
            {over && just.length === 0 ? 'Give a reason for the fare. ' : ''}
            {needsOtherText ? 'Describe your other reason.' : ''}
          </span>
        )}
        <button
          className="btn btn-primary"
          disabled={!valid}
          onClick={() =>
            onConfirm({
              justification: just,
              justificationText: justText.trim(),
              addons,
              addonSpend: spend,
              bleisure: bleisure === true,
            })
          }
        >
          Confirm booking
        </button>
      </div>
    </div>
  );
}
