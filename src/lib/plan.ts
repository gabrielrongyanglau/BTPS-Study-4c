import design from '../data/design.json';
import { AIRCRAFT, AIRLINES, DEPARTURES, PRACTICE_TRIP, PRICE_FACTORS, STUDY, TRIPS } from '../config';
import { between, mulberry32, pick, shuffle } from './rng';
import { BENEFITS, type Flight, type Levels, type Reason, type Trip } from './types';

export interface PlannedBooking {
  pos: number; // 0 = practice
  practice: boolean;
  trip: Trip;
  designSet: number; // 1-based, 0 for practice
  aiShown: boolean;
  flights: Flight[]; // in design order (optIdx 0-3)
  displayOrder: string[]; // flight ids in randomised default order
  recOptIdx: number | null; // random option when the AI is shown
  recReasons: Reason[]; // favourable features of the recommended flight that the AI cites
}

/** Practice set: a valid set that is not among the 8 scored sets. */
const PRACTICE_SET: Levels[] = [
  { STR: 0, ENV: 0, LOY: 0, PRICE: 0 },
  { STR: 0, ENV: 0, LOY: 1, PRICE: 1 },
  { STR: 1, ENV: 1, LOY: 0, PRICE: 2 },
  { STR: 1, ENV: 1, LOY: 1, PRICE: 3 },
];

const round5 = (n: number) => Math.round(n / 5) * 5;
const codeOf = (l: Levels) => `${l.STR}${l.ENV}${l.LOY}${l.PRICE}`;

/** Build the four flights for one booking from their attribute levels. */
export function buildFlights(trip: Trip, levels: Levels[], pos: number, rand: () => number): Flight[] {
  const comfortable = shuffle(DEPARTURES.comfortable, rand);
  const awkward = shuffle(DEPARTURES.awkward, rand);
  const hubs = shuffle(trip.hubs, rand);
  const partners = shuffle(AIRLINES.partner, rand);
  const others = shuffle(AIRLINES.other, rand);
  const shortHaul = trip.distanceKm < 3000;
  const typicalCo2 = Math.round(trip.distanceKm * 0.078);
  let hubIdx = 0;

  return levels.map((a, optIdx) => {
    const airline = a.LOY === 1 ? partners.pop()! : others.pop()!;
    const direct = a.STR === 1;
    const depMin = direct ? comfortable.pop()! : awkward.pop()!;
    const layoverMin = direct ? 0 : round5(between(200, 285, rand));
    const durMin = direct
      ? round5(trip.baseDurMin + between(-10, 10, rand))
      : round5(trip.baseDurMin * 1.12 + 45 + layoverMin);
    const arrMin = depMin + durMin + trip.tzOffsetH * 60;

    const co2Factor = a.ENV === 1 ? between(0.8, 0.86, rand) : between(1.14, 1.2, rand);
    const co2 = Math.round(typicalCo2 * co2Factor);
    const co2Pct = Math.round((co2Factor - 1) * 100);
    const aircraft = pick(
      a.ENV === 1
        ? shortHaul ? AIRCRAFT.efficientShort : AIRCRAFT.efficientLong
        : shortHaul ? AIRCRAFT.olderShort : AIRCRAFT.olderLong,
      rand,
    );

    // Small jitter (±2% of cap) keeps prices realistic without letting levels overlap.
    const price = round5(trip.fareCap * (PRICE_FACTORS[a.PRICE] + between(-0.02, 0.02, rand)));

    return {
      id: `B${pos}-O${optIdx}`,
      optIdx,
      levels: a,
      code: codeOf(a),
      airline: airline.name,
      flightNo: `${airline.code} ${100 + Math.floor(rand() * 800)}`,
      aircraft,
      depMin,
      durMin,
      arrMin,
      stops: direct ? 0 : 1,
      via: direct ? null : hubs[hubIdx++ % hubs.length],
      layoverMin,
      co2,
      co2Pct,
      partner: a.LOY === 1,
      points: a.LOY === 1 ? Math.round((trip.distanceKm * STUDY.rewards.pointsPerKm) / 10) * 10 : 0,
      price,
      withinPolicy: price <= trip.fareCap,
    } satisfies Flight;
  });
}

function reasonsFor(f: Flight, rand: () => number): Reason[] {
  const good: Reason[] = BENEFITS.filter((b) => f.levels[b] === 1);
  if (f.withinPolicy) good.push('FARE');
  return shuffle(good, rand).slice(0, STUDY.aiReasonCount);
}

export interface Plan {
  seed: number;
  tripOrder: string[];
  aiPlan: boolean[];
  bookings: PlannedBooking[];
}

function planBooking(
  pos: number, trip: Trip, designSet: number, levels: Levels[], aiShown: boolean, rand: () => number,
): PlannedBooking {
  const flights = buildFlights(trip, levels, pos, rand);
  const recOptIdx = aiShown ? Math.floor(rand() * flights.length) : null;
  return {
    pos,
    practice: pos === 0,
    trip,
    designSet,
    aiShown,
    flights,
    displayOrder: shuffle(flights.map((f) => f.id), rand),
    recOptIdx,
    recReasons: recOptIdx == null ? [] : reasonsFor(flights[recOptIdx], rand),
  };
}

/**
 * Full per-participant randomisation: trip order, design-set-to-trip mapping, which bookings show
 * the AI, which flight the AI picks (uniformly at random), and default card order.
 */
export function makePlan(seed: number): Plan {
  const rand = mulberry32(seed);
  const trips = shuffle(TRIPS, rand);
  const sets = shuffle(design.sets, rand);
  if (STUDY.aiTrials > trips.length) throw new Error('STUDY.aiTrials exceeds the number of trips');
  const aiPlan = shuffle(trips.map((_, i) => i < STUDY.aiTrials), rand);

  const practice = planBooking(0, PRACTICE_TRIP, 0, PRACTICE_SET, STUDY.practiceShowsAI, rand);
  const scored = trips.map((trip, i) =>
    planBooking(i + 1, trip, sets[i].set, sets[i].options as Levels[], aiPlan[i], rand),
  );
  return { seed, tripOrder: trips.map((t) => t.id), aiPlan, bookings: [practice, ...scored] };
}
