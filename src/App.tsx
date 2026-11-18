import { useEffect, useMemo, useState } from 'react';
import { STUDY } from './config';
import { embedded, flatten, post, startAutoResize } from './lib/bridge';
import { makePlan } from './lib/plan';
import { hashString } from './lib/rng';
import type { BookingRecord, SessionData } from './lib/types';
import Intro from './components/Intro';
import Check from './components/Check';
import Booking from './components/Booking';
import Done from './components/Done';
import Header from './components/Header';

type Phase = 'intro' | 'check' | 'booking' | 'done';

interface Saved {
  phase: Phase;
  data: SessionData;
}

const params = new URLSearchParams(window.location.search);
const pid = params.get('pid') || 'anon';
const debug = params.get('debug') === '1';
const storageKey = `btps4c:${pid}`;

function load(): Saved | null {
  if (!STUDY.resumeOnReload || pid === 'anon') return null;
  try {
    const raw = sessionStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

function save(s: Saved) {
  if (!STUDY.resumeOnReload || pid === 'anon') return;
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(s));
  } catch {
    /* storage unavailable: carry on without resume */
  }
}

function initialSeed(): number {
  const s = params.get('seed');
  if (s && /^\d+$/.test(s)) return Number(s) >>> 0;
  if (pid !== 'anon') return hashString(pid);
  return Math.floor(Math.random() * 2 ** 31);
}

export default function App() {
  const saved = useMemo(load, []);
  const [phase, setPhase] = useState<Phase>(saved?.phase ?? 'intro');
  const [data, setData] = useState<SessionData>(() => {
    if (saved) return saved.data;
    const seed = initialSeed();
    const plan = makePlan(seed);
    return {
      version: STUDY.version,
      pid,
      seed,
      embedded,
      startedAt: new Date().toISOString(),
      endedAt: null,
      durationMs: null,
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      checkAttempts: 0,
      tripOrder: plan.tripOrder,
      aiPlan: plan.aiPlan,
      bookings: [],
    };
  });
  const plan = useMemo(() => makePlan(data.seed), [data.seed]);

  useEffect(() => {
    startAutoResize();
    post('btps4c-ready', { pid, seed: data.seed });
  }, [data.seed]);

  useEffect(() => {
    save({ phase, data });
    window.scrollTo({ top: 0 });
  }, [phase, data]);

  const current = plan.bookings[data.bookings.length];

  function completeBooking(rec: BookingRecord) {
    const bookings = [...data.bookings, rec];
    const next: SessionData = { ...data, bookings };
    if (bookings.length === plan.bookings.length) {
      const endedAt = new Date();
      next.endedAt = endedAt.toISOString();
      next.durationMs = endedAt.getTime() - new Date(data.startedAt).getTime();
      setData(next);
      setPhase('done');
      post('btps4c-complete', { data: next, flat: flatten(next) });
    } else {
      setData(next);
      post('btps4c-progress', { completed: bookings.length - 1, of: plan.bookings.length - 1 });
    }
  }

  const scoredTotal = plan.bookings.length - 1;
  const progress =
    phase === 'booking' && current
      ? current.practice
        ? 'Practice trip'
        : `Trip ${current.pos} of ${scoredTotal}`
      : undefined;

  return (
    <div className="app">
      <Header progress={progress} />
      <main className="main">
        {phase === 'intro' && <Intro onNext={() => setPhase('check')} />}
        {phase === 'check' && (
          <Check
            onAttempt={() => setData((d) => ({ ...d, checkAttempts: d.checkAttempts + 1 }))}
            onPass={() => setPhase('booking')}
          />
        )}
        {phase === 'booking' && current && (
          <Booking key={current.pos} planned={current} onComplete={completeBooking} />
        )}
        {phase === 'done' && <Done data={data} debug={debug || !embedded} />}
      </main>
    </div>
  );
}
