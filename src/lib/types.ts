export type Attr = 'STR' | 'PRD' | 'SAF' | 'ENV' | 'LOY' | 'PRC';
export const ATTRS: Attr[] = ['STR', 'PRD', 'SAF', 'ENV', 'LOY', 'PRC'];

export type AttrLevels = Record<Attr, 0 | 1>;

export type AICondition = 'good' | 'poor' | 'none';

export interface Trip {
  id: string;
  city: string;
  airport: string;
  country: string;
  purpose: string;
  blurb: string; // one-line destination description (Destination Attractiveness context)
  baseDurMin: number; // direct block time
  tzOffsetH: number; // destination time minus origin time
  distanceKm: number;
  fareCap: number;
  hubs: string[];
}

export interface Flight {
  id: string; // e.g. "B3-O2" (booking position, option index within design set)
  optIdx: number; // index within the design set (0-3)
  attrs: AttrLevels;
  code: string; // e.g. "101101" in ATTRS order
  airline: string;
  flightNo: string;
  aircraft: string;
  depMin: number; // local departure, minutes after midnight
  durMin: number;
  arrMin: number; // local arrival, minutes after midnight on departure day (can exceed 1440)
  stops: 0 | 1;
  via: string | null;
  layoverMin: number;
  wifi: boolean;
  safety: number; // out of 7
  co2: number; // kg CO2e per passenger
  co2Pct: number; // % vs typical for route (signed)
  alliance: boolean;
  miles: number;
  price: number;
  withinPolicy: boolean;
}

export type LogEvent = [number, string, Record<string, unknown>?];

export interface BookingRecord {
  pos: number; // 0 = practice, 1..N scored
  practice: boolean;
  tripId: string;
  designSet: number; // 1-based design set id (0 for practice)
  ai: AICondition;
  recId: string | null;
  recOptIdx: number | null;
  recReasons: Attr[];
  displayOrder: string[]; // flight ids in default display order
  options: Flight[];
  choiceId: string;
  choiceOptIdx: number;
  choiceCode: string;
  followedAI: boolean | null;
  overPolicy: boolean;
  justification: string[];
  justificationText: string;
  addons: string[];
  addonSpend: number;
  bleisure: boolean;
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
  aiPlan: AICondition[];
  bookings: BookingRecord[]; // includes practice at index 0
}
