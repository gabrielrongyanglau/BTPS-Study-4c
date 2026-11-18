import { STUDY } from '../config';

export default function Header({ progress }: { progress?: string }) {
  return (
    <header className="header">
      <div className="brand">
        <span className="logo" aria-hidden>
          <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" /></svg>
        </span>
        <span className="brand-name">{STUDY.platform}</span>
        <span className="brand-co">{STUDY.company} corporate travel</span>
      </div>
      {progress && <div className="progress-pill">{progress}</div>}
    </header>
  );
}
