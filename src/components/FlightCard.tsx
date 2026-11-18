import { STUDY } from '../config';
import { clock, dayOffset, duration, money } from '../lib/format';
import type { Flight, Trip } from '../lib/types';

interface Props {
  flight: Flight;
  trip: Trip;
  aiPick: boolean;
  highlighted: boolean;
  expanded: boolean;
  onToggleDetails: () => void;
  onSelect: () => void;
}

const Yes = () => <span className="yes" aria-label="yes">✓</span>;
const No = () => <span className="no" aria-label="no">✕</span>;

export default function FlightCard({ flight: f, trip, aiPick, highlighted, expanded, onToggleDetails, onSelect }: Props) {
  const over = f.price - trip.fareCap;
  return (
    <article id={`card-${f.id}`} className={`card ${highlighted ? 'card-highlight' : ''}`} aria-label={`${f.airline} ${f.flightNo}`}>
      {aiPick && <div className="ai-flag">Trip Assistant pick</div>}
      <div className="card-top">
        <div className="airline">
          <span className="airline-name">{f.airline}</span>
          <span className="muted small">{f.flightNo}</span>
        </div>
        <div className="tags">
          {f.alliance ? (
            <span className="badge badge-alliance">{STUDY.allianceName}</span>
          ) : (
            <span className="badge badge-plain">Not {STUDY.allianceName}</span>
          )}
          <span className={`badge ${f.safety === 7 ? 'badge-safe' : 'badge-warn'}`}>Safety {f.safety}/7</span>
        </div>
      </div>

      <div className="card-body">
        <div className="route">
          <div className="time">
            <strong>{clock(f.depMin)}</strong>
            <span className="muted small">{STUDY.origin.airport}</span>
          </div>
          <div className="leg">
            <span className="small">{duration(f.durMin)}</span>
            <div className="line">{f.stops === 1 && <span className="dot" />}</div>
            <span className={`small ${f.stops === 0 ? 'ok' : 'warn'}`}>
              {f.stops === 0 ? 'Direct' : `1 stop · ${f.via} · ${duration(f.layoverMin)} layover`}
            </span>
          </div>
          <div className="time">
            <strong>
              {clock(f.arrMin)}
              {dayOffset(f.arrMin) && <sup>{dayOffset(f.arrMin)}</sup>}
            </strong>
            <span className="muted small">{trip.airport}</span>
          </div>
        </div>

        <div className="price-box">
          <div className="price">{money(f.price)}</div>
          {f.withinPolicy ? (
            <span className="badge badge-safe">Within policy</span>
          ) : (
            <span className="badge badge-warn">{money(over)} above cap</span>
          )}
          <button className="btn btn-primary btn-select" onClick={onSelect}>Select</button>
        </div>
      </div>

      <ul className="features">
        <li>{f.wifi ? <Yes /> : <No />} Wi-Fi and power</li>
        <li>{f.wifi ? <Yes /> : <No />} Work-friendly seat</li>
        <li className={f.co2Pct < 0 ? 'ok' : 'warn'}>
          {f.co2} kg CO₂e · {f.co2Pct < 0 ? '' : '+'}{f.co2Pct}% vs typical
        </li>
        <li>{f.alliance ? `+${f.miles.toLocaleString('en-GB')} ${STUDY.allianceName} miles` : `No ${STUDY.allianceName} miles`}</li>
      </ul>

      <button className="link" aria-expanded={expanded} onClick={onToggleDetails}>
        {expanded ? 'Hide flight details' : 'Flight details'}
      </button>
      {expanded && (
        <dl className="details">
          <div><dt>Aircraft</dt><dd>{f.aircraft}{f.co2Pct < 0 ? ' (newer, fuel-efficient model)' : ' (older model)'}</dd></div>
          <div>
            <dt>Itinerary</dt>
            <dd>
              {f.stops === 0
                ? `Non-stop ${STUDY.origin.airport} to ${trip.airport}`
                : `${STUDY.origin.airport} to ${f.via}, ${duration(f.layoverMin)} connection, then on to ${trip.airport}`}
            </dd>
          </div>
          <div>
            <dt>Safety rating</dt>
            <dd>
              {f.safety === 7
                ? 'Independent audit 7/7: passed every safety and operational audit.'
                : 'Independent audit 4/7: meets minimum international standards, with some audit items outstanding.'}
            </dd>
          </div>
          <div><dt>Emissions</dt><dd>{f.co2} kg CO₂e per passenger; typical for this route is {Math.round(trip.distanceKm * 0.078)} kg.</dd></div>
          <div>
            <dt>On board</dt>
            <dd>{f.wifi ? 'Free Wi-Fi, in-seat power and a seat with a laptop-sized tray.' : 'No Wi-Fi or in-seat power; standard tray table.'}</dd>
          </div>
          <div>
            <dt>Loyalty</dt>
            <dd>{f.alliance ? `${STUDY.allianceName} member airline: earns miles and status credits.` : `Not a ${STUDY.allianceName} airline: earns nothing on your membership.`}</dd>
          </div>
          <div><dt>Baggage</dt><dd>1 × 23 kg checked bag and 1 cabin bag included.</dd></div>
        </dl>
      )}
    </article>
  );
}
