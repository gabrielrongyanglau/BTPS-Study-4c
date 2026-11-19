export type Benefit = 'STR' | 'ENV' | 'LOY';
export const BENEFITS: Benefit[] = ['STR', 'ENV', 'LOY'];

/** Reasons the AI can cite: a benefit, or a low fare (price level 0-1, within policy). */
export type Reason = Benefit | 'FARE';

export interface Levels {
  STR: 0 | 1;
  ENV: 0 | 1;
  LOY: 0 | 1;
  PRICE: 0 | 1 | 2 | 3; // 0 = cap -15%, 1 = cap -5%, 2 = cap +5%, 3 = cap +15%
}

export interface Trip {
  id: string;
  city: string;
  airport: string;
  country: string;
  purpose: string;
  baseDurMin: number; // direct block time
  tzOffsetH: number; // destination time minus origin time
  distanceKm: number;
  fareCap: number;
  hubs: string[];
}

export interface Flight {
  id: string; // e.g. "B3-O2" (booking position, option index within design set)
  optIdx: number; // index within the design set (0-3)
  levels: Levels;
  code: string; // STR ENV LOY PRICE, e.g. "1012"
  airline: string;
  flightNo: string;
  aircraft: string;
  depMin: number; // local departure, minutes after midnight
  durMin: number;
  arrMin: number; // local arrival, minutes after midnight on departure day (can exceed 1440)
  stops: 0 | 1;
  via: string | null;
  layoverMin: number;
  co2: number; // kg CO2e per passenger
  co2Pct: number; // % vs typical for route (signed)
  partner: boolean; // company rewards partner airline
  points: number; // company rewards points earned
  price: number;
  withinPolicy: boolean;
}

export type LogEvent = [number, string, Record<string, unknown>?];

export interface BookingRecord {
  pos: number; // 0 = practice, 1..N scored
  practice: boolean;
  tripId: string;
  designSet: number; // 1-based design set id (0 for practice)
  aiShown: boolean;
  recId: string | null;
  recOptIdx: number | null;
  recReasons: Reason[];
  displayOrder: string[]; // flight ids in default display order
  options: Flight[];
  choiceId: string;
  choiceOptIdx: number;
  choiceCode: string;
  choicePrice: number;
  followedAI: boolean | null;
  overPolicy: boolean;
  justification: string[];
  justificationText: string;
  changedFlight: number; // times participant went back from review to results
  rtMs: number; // results shown -> booking confirmed
  choiceRtMs: number; // results shown -> first flight selected
  events: LogEvent[];
}

export interface SessionData {
  version: string;
  pid: string;
  seed: number;
  embedded: boolean;
  startedAt: string;
  endedAt: string | null;
  durationMs: number | null;
  userAgent: string;
  viewport: string;
  checkAttempts: number;
  tripOrder: string[];
  aiPlan: boolean[];
  bookings: BookingRecord[]; // includes practice at index 0
}
