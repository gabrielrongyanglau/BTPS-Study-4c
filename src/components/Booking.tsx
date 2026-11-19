import { useMemo, useRef, useState } from 'react';
import { AI_REASON_TEXT, STUDY } from '../config';
import { clock, money } from '../lib/format';
import type { PlannedBooking } from '../lib/plan';
import type { BookingRecord, Flight, LogEvent, Reason } from '../lib/types';
import FlightCard from './FlightCard';
import Review, { type ReviewResult } from './Review';

type SortKey = 'default' | 'price' | 'duration' | 'departure' | 'co2';
type FilterKey = 'direct' | 'policy' | 'partner';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'default', label: 'Default' },
  { key: 'price', label: 'Lowest price' },
  { key: 'duration', label: 'Shortest' },
  { key: 'departure', label: 'Earliest departure' },
  { key: 'co2', label: 'Lowest CO₂' },
];

const FILTERS: { key: FilterKey; label: string; test: (f: Flight) => boolean }[] = [
  { key: 'direct', label: 'Direct only', test: (f) => f.stops === 0 },
  { key: 'policy', label: 'Within policy', test: (f) => f.withinPolicy },
  { key: 'partner', label: `${STUDY.rewards.name} partners`, test: (f) => f.partner },
];

/** Departure time sorted from the start of the travel day (early hours after late evening). */
const depSortKey = (m: number) => (m < 4 * 60 ? m + 1440 : m);

export function aiMessage(flight: Flight, reasons: Reason[]): string {
  const parts = reasons.map((r) => AI_REASON_TEXT[r].replace('{pct}', String(Math.abs(flight.co2Pct))));
  const because = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0];
  return `I recommend ${flight.airline} ${flight.flightNo} (departs ${clock(flight.depMin)}) because ${because}.`;
}

export default function Booking({ planned, onComplete }: { planned: PlannedBooking; onComplete: (r: BookingRecord) => void }) {
  const { trip, flights } = planned;
  const t0 = useRef(performance.now());
  const events = useRef<LogEvent[]>([]);
  const firstSelect = useRef<number | null>(null);
  const changed = useRef(0);

  const [step, setStep] = useState<'results' | 'review'>('results');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('default');
  const [filters, setFilters] = useState<FilterKey[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [highlight, setHighlight] = useState<string | null>(null);

  const elapsed = () => Math.round(performance.now() - t0.current);
  const log = (type: string, data?: Record<string, unknown>) => {
    events.current.push(data ? [elapsed(), type, data] : [elapsed(), type]);
  };

  const byId = useMemo(() => Object.fromEntries(flights.map((f) => [f.id, f])), [flights]);
  const rec = planned.recOptIdx != null ? flights[planned.recOptIdx] : null;

  const visible = useMemo(() => {
    let list = planned.displayOrder.map((id) => byId[id]);
    for (const k of filters) list = list.filter(FILTERS.find((f) => f.key === k)!.test);
    const sorted = list.slice();
    if (sort === 'price') sorted.sort((a, b) => a.price - b.price);
    if (sort === 'duration') sorted.sort((a, b) => a.durMin - b.durMin);
    if (sort === 'departure') sorted.sort((a, b) => depSortKey(a.depMin) - depSortKey(b.depMin));
    if (sort === 'co2') sorted.sort((a, b) => a.co2 - b.co2);
    return sorted;
  }, [planned.displayOrder, byId, filters, sort]);

  function toggleFilter(k: FilterKey) {
    const on = !filters.includes(k);
    log('filter', { key: k, on });
    setFilters(on ? [...filters, k] : filters.filter((x) => x !== k));
  }

  function changeSort(k: SortKey) {
    log('sort', { key: k });
    setSort(k);
  }

  function toggleDetails(id: string) {
    const open = !expanded.includes(id);
    log('details', { id, open });
    setExpanded(open ? [...expanded, id] : expanded.filter((x) => x !== id));
  }

  function select(id: string) {
    if (firstSelect.current == null) firstSelect.current = elapsed();
    log('select', { id });
    setSelectedId(id);
    setStep('review');
    window.scrollTo({ top: 0 });
  }

  function showRec() {
    if (!rec) return;
    log('ai_show');
    setHighlight(rec.id);
    document.getElementById(`card-${rec.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => setHighlight(null), 1800);
  }

  function back() {
    changed.current += 1;
    log('change_flight', { from: selectedId });
    setStep('results');
  }

  function confirm(r: ReviewResult) {
    const choice = byId[selectedId!];
    log('confirm');
    onComplete({
      pos: planned.pos,
      practice: planned.practice,
      tripId: trip.id,
      designSet: planned.designSet,
      aiShown: planned.aiShown,
      recId: rec?.id ?? null,
      recOptIdx: planned.recOptIdx,
      recReasons: planned.recReasons,
      displayOrder: planned.displayOrder,
      options: flights,
      choiceId: choice.id,
      choiceOptIdx: choice.optIdx,
      choiceCode: choice.code,
      choicePrice: choice.price,
      followedAI: rec ? rec.id === choice.id : null,
      overPolicy: !choice.withinPolicy,
      justification: r.justification,
      justificationText: r.justificationText,
      changedFlight: changed.current,
      rtMs: elapsed(),
      choiceRtMs: firstSelect.current ?? elapsed(),
      events: events.current,
    });
  }

  if (step === 'review' && selectedId) {
    return <Review trip={trip} flight={byId[selectedId]} practice={planned.practice} log={log} onBack={back} onConfirm={confirm} />;
  }

  return (
    <div className="booking">
      {planned.practice && (
        <div className="notice">
          <strong>Practice trip.</strong> This booking is not used in the study. Take a moment to explore the sorting,
          filters and flight details.
        </div>
      )}

      <section className="brief">
        <div>
          <p className="eyebrow">Trip brief</p>
          <h1>{STUDY.origin.city} to {trip.city}</h1>
          <p>{trip.purpose} in {trip.city}, {trip.country}.</p>
          <p className="muted small">Every flight shown arrives in time for your meeting.</p>
        </div>
        <dl className="brief-facts">
          <div><dt>Outbound</dt><dd>Monday, {STUDY.origin.airport} to {trip.airport}</dd></div>
          <div><dt>Meeting</dt><dd>Wednesday, 10:00 local time</dd></div>
          <div><dt>Fare cap</dt><dd>{money(trip.fareCap)}</dd></div>
        </dl>
      </section>

      {rec && (
        <section className="assistant" aria-label="Trip Assistant">
          <div className="assistant-avatar" aria-hidden>AI</div>
          <div>
            <p className="assistant-name">Trip Assistant</p>
            <p>{aiMessage(rec, planned.recReasons)}</p>
            <button className="link" onClick={showRec}>Show this flight</button>
          </div>
        </section>
      )}

      <section className="toolbar" aria-label="Sort and filter">
        <label className="sort">
          <span className="small muted">Sort by</span>
          <select value={sort} onChange={(e) => changeSort(e.target.value as SortKey)}>
            {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </label>
        <div className="chips">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`chip ${filters.includes(f.key) ? 'chip-on' : ''}`}
              aria-pressed={filters.includes(f.key)}
              onClick={() => toggleFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      <p className="small muted results-count">{visible.length} of {flights.length} flights · prices are one-way, economy</p>

      <div className="results">
        {visible.map((f) => (
          <FlightCard
            key={f.id}
            flight={f}
            trip={trip}
            aiPick={rec?.id === f.id}
            highlighted={highlight === f.id}
            expanded={expanded.includes(f.id)}
            onToggleDetails={() => toggleDetails(f.id)}
            onSelect={() => select(f.id)}
          />
        ))}
        {visible.length === 0 && (
          <div className="empty">
            <p>No flights match all of these filters.</p>
            <button className="btn" onClick={() => { log('filter_clear'); setFilters([]); }}>Clear filters</button>
          </div>
        )}
      </div>
    </div>
  );
}
