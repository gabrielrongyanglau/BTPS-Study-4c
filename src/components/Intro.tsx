import { STUDY, TRIPS } from '../config';

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
        <h2>{STUDY.rewards.name}</h2>
        <p>
          Your company runs a travel rewards scheme, <strong>{STUDY.rewards.name}</strong>. When you book a flight
          on a partner airline, you earn points that you can redeem for {STUDY.rewards.redeem}. Partner airlines are
          marked on each flight.
        </p>
      </div>

      <div className="profile-card">
        <h2>Company travel policy</h2>
        <ul className="ticks">
          <li>Each trip has a <strong>fare cap</strong>. You may book above it, but you must give a reason.</li>
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
