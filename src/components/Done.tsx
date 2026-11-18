import type { SessionData } from '../lib/types';

export default function Done({ data, debug }: { data: SessionData; debug: boolean }) {
  function download() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `btps4c_${data.pid}.json`;
    a.click();
  }
  return (
    <section className="panel narrow center">
      <div className="done-icon" aria-hidden>✓</div>
      <h1>All trips booked</h1>
      <p className="lead">Thank you. Your bookings have been recorded.</p>
      <p><strong>Please click the Next button below to continue the survey.</strong></p>
      {debug && (
        <div className="debug">
          <p className="muted small">Researcher view (not shown when embedded in Qualtrics without ?debug=1)</p>
          <button className="btn" onClick={download}>Download session JSON</button>
        </div>
      )}
    </section>
  );
}
