import design from '../data/design.json';
import { AIRCRAFT, AIRLINES, DEPARTURES, PRACTICE_TRIP, STUDY, TRIPS } from '../config';
import { between, mulberry32, pick, shuffle } from './rng';
import { ATTRS, type AICondition, type Attr, type AttrLevels, type Flight, type Trip } from './types';

export interface PlannedBooking {
  pos: number; // 0 = practice
  practice: boolean;
  trip: Trip;
  designSet: number; // 1-based, 0 for practice
  ai: AICondition;
  flights: Flight[]; // in design order (optIdx 0-3)
  displayOrder: string[]; // flight ids in randomised default order
  recOptIdx: number | null;
  recReasons: Attr[]; // favourable attributes of the recommended flight that the AI cites
}

const PRACTICE_PROFILES = ['010001', '101100', '100011', '011110'];

function toLevels(code: string): AttrLevels {
  const o = {} as AttrLevels;
  ATTRS.forEach((a, i) => (o[a] = code[i] === '1' ? 1 : 0));
  return o;
}

function codeOf(l: AttrLevels): string {
  return ATTRS.map((a) => l[a]).join('');
}

const round5 = (n: number) => Math.round(n / 5) * 5;

/** Build the four flights for one booking from their attribute profiles. */
export function buildFlights(trip: Trip, profiles: AttrLevels[], pos: number, rand: () => number): Flight[] {
  const comfortable = shuffle(DEPARTURES.comfortable, rand);
  const awkward = shuffle(DEPARTURES.awkward, rand);
  const hubs = shuffle(trip.hubs, rand);
  const usedAirlines = new Set<string>();
  const shortHaul = trip.distanceKm < 3000;
  const typicalCo2 = Math.round(trip.distanceKm * 0.078);

  return profiles.map((a, optIdx) => {
    const cell = `L${a.LOY}-S${a.SAF}`;
    const candidates = shuffle(AIRLINES[cell], rand).filter((x) => !usedAirlines.has(x.name));
    const airline = candidates[0] ?? AIRLINES[cell][0];
    usedAirlines.add(airline.name);

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

    const priceFactor = a.PRC === 1 ? between(0.78, 0.95, rand) : between(1.08, 1.22, rand);
    const price = round5(trip.fareCap * priceFactor);

    return {
      id: `B${pos}-O${optIdx}`,
      optIdx,
      attrs: a,
      code: codeOf(a),
      airline: airline.name,
      flightNo: `${airline.code} ${100 + Math.floor(rand() * 800)}`,
      aircraft,
      depMin,
      durMin,
      arrMin,
      stops: direct ? 0 : 1,
      via: direct ? null : hubs[optIdx % hubs.length],
      layoverMin,
      wifi: a.PRD === 1,
      safety: a.SAF === 1 ? 7 : 4,
      co2,
      co2Pct,
      alliance: a.LOY === 1,
      miles: a.LOY === 1 ? Math.round((trip.distanceKm * 0.9) / 10) * 10 : 0,
      price,
      withinPolicy: a.PRC === 1,
    } satisfies Flight;
  });
}

function reasonsFor(f: Flight | undefined, rand: () => number): Attr[] {
  if (!f) return [];
  const good = ATTRS.filter((a) => f.attrs[a] === 1);
  return shuffle(good, rand).slice(0, STUDY.aiReasonCount);
}

export interface Plan {
  seed: number;
  tripOrder: string[];
  aiPlan: AICondition[];
  bookings: PlannedBooking[];
}

/** Full per-participant randomisation: trip order, design-set-to-trip mapping, AI conditions, card order. */
export function makePlan(seed: number): Plan {
  const rand = mulberry32(seed);
  const trips = shuffle(TRIPS, rand);
  const sets = shuffle(design.sets, rand);

  const alloc = STUDY.aiAllocation;
  const aiPool: AICondition[] = [
    ...Array(alloc.good).fill('good'),
    ...Array(alloc.poor).fill('poor'),
    ...Array(alloc.none).fill('none'),
  ];
  if (aiPool.length !== trips.length) {
    throw new Error('STUDY.aiAllocation must sum to the number of trips');
  }
  const aiPlan = shuffle(aiPool, rand);

  // Practice: AI shown, recommending a middle option, so the assistant is familiar before scored trials.
  const practiceProfiles = PRACTICE_PROFILES.map(toLevels);
  const practiceFlights = buildFlights(PRACTICE_TRIP, practiceProfiles, 0, rand);
  const practice: PlannedBooking = {
    pos: 0,
    practice: true,
    trip: PRACTICE_TRIP,
    designSet: 0,
    ai: 'good',
    flights: practiceFlights,
    displayOrder: shuffle(practiceFlights.map((f) => f.id), rand),
    recOptIdx: null,
    recReasons: [],
  };
  practice.recOptIdx = PRACTICE_PROFILES.findIndex((c) => c.split('').filter((x) => x === '1').length === 3);
  practice.recReasons = reasonsFor(practiceFlights[practice.recOptIdx], rand);

  const scored: PlannedBooking[] = trips.map((trip, i) => {
    const set = sets[i];
    const profiles = set.options.map((o) => o as AttrLevels);
    const flights = buildFlights(trip, profiles, i + 1, rand);
    const ai = aiPlan[i];
    const recOptIdx = ai === 'good' ? set.best : ai === 'poor' ? set.worst : null;
    return {
      pos: i + 1,
      practice: false,
      trip,
      designSet: set.set,
      ai,
      flights,
      displayOrder: shuffle(flights.map((f) => f.id), rand),
      recOptIdx,
      recReasons: recOptIdx == null ? [] : reasonsFor(flights[recOptIdx], rand),
    };
  });

  return { seed, tripOrder: trips.map((t) => t.id), aiPlan, bookings: [practice, ...scored] };
}
