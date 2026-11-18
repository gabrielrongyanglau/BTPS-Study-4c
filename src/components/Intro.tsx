import { STUDY, TRIPS } from '../config';
import { money } from '../lib/format';

export default function Intro({ onNext }: { onNext: () => void }) {
  return (
    <section className="panel narrow">
      <h1>Welcome to {STUDY.platform}</h1>
      <p className="lead">
        Imagine you are a consultant at <strong>{STUDY.company}</strong>, based in {STUDY.origin.city}. Your
        company has asked you to travel to {TRIPS.length} client meetings. Your task is to book the outbound
        flight for each trip, starting with one practice trip.
      </p>

      <div className="profile-card">
        <h2>Your traveller profile</h2>
        <dl>
          <div><dt>Home airport</dt><dd>{STUDY.origin.city} ({STUDY.origin.airport})</dd></div>
          <div>
            <dt>Frequent-flyer membership</dt>
            <dd>
              <span className="badge badge-alliance">{STUDY.allianceName}</span> {STUDY.memberTier} member. Flights
              on {STUDY.allianceName} airlines earn you miles and status credits.
            </dd>
          </div>
        </dl>
      </div>

      <div className="profile-card">
        <h2>Company travel policy</h2>
        <ul className="ticks">
          <li>Each trip has a <strong>fare cap</strong>. You may book above it, but you must give a reason.</li>
          <li>You have an <strong>add-on allowance of {money(STUDY.addonAllowance)}</strong> per trip for extras such as lounge access or insurance. It cannot be carried over.</li>
          <li>Every flight shown arrives in time for your meeting.</li>
        </ul>
      </div>

      <div className="profile-card">
        <h2>Trip Assistant</h2>
        <p>
          On some trips an AI <strong>Trip Assistant</strong> will suggest a flight. You are free to follow or
          ignore its suggestion.
        </p>
      </div>

      <p className="muted small">
        All airlines are fictional. Please book as you would if these were your own work trips. This takes about 12
        minutes.
      </p>
      <div className="actions">
        <button className="btn btn-primary" onClick={onNext}>Continue</button>
      </div>
    </section>
  );
}
