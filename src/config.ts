import type { Trip } from './lib/types';

/**
 * Study 4c configuration. Everything a researcher is likely to change lives here.
 * Flight attribute levels come from src/data/design.json (see scripts/generate_design.py).
 */
export const STUDY = {
  version: '4c-0.2.0',
  company: 'Meridian Partners',
  platform: 'TravelDesk',
  origin: { city: 'Singapore', airport: 'SIN' },
  currency: 'S$',
  /** The organisation's corporate travel rewards scheme (Loyalty Rewards factor). */
  rewards: {
    name: 'Meridian Rewards',
    redeem: 'shopping vouchers, cabin upgrades and an extra day of annual leave',
    pointsPerKm: 0.25,
  },
  /** Number of scored bookings on which the Trip Assistant appears (the rest have no AI). */
  aiTrials: 6,
  /** Show the Trip Assistant on the practice booking so it is familiar before scored trials. */
  practiceShowsAI: true,
  /** Maximum number of reasons the AI gives for its pick. */
  aiReasonCount: 2,
  /** Persist progress in sessionStorage so an accidental reload resumes rather than restarts. */
  resumeOnReload: true,
};

export const PRACTICE_TRIP: Trip = {
  id: 'practice-hcm',
  city: 'Ho Chi Minh City',
  airport: 'SGN',
  country: 'Vietnam',
  purpose: 'Site visit at a supplier factory',
  baseDurMin: 125,
  tzOffsetH: -1,
  distanceKm: 1090,
  fareCap: 400,
  hubs: ['Kuala Lumpur', 'Bangkok'],
};

/** Eight scored trips. Order is randomised per participant; design sets are mapped to trips per participant too. */
export const TRIPS: Trip[] = [
  { id: 'tokyo', city: 'Tokyo', airport: 'HND', country: 'Japan', purpose: 'Contract negotiation with a logistics client',
    baseDurMin: 410, tzOffsetH: 1, distanceKm: 5320, fareCap: 1100, hubs: ['Hong Kong', 'Taipei', 'Manila'] },
  { id: 'sydney', city: 'Sydney', airport: 'SYD', country: 'Australia', purpose: 'Quarterly review with a banking client',
    baseDurMin: 475, tzOffsetH: 3, distanceKm: 6300, fareCap: 1200, hubs: ['Kuala Lumpur', 'Denpasar', 'Darwin'] },
  { id: 'shanghai', city: 'Shanghai', airport: 'PVG', country: 'China', purpose: 'Kick-off workshop for a retail project',
    baseDurMin: 325, tzOffsetH: 0, distanceKm: 3800, fareCap: 850, hubs: ['Hong Kong', 'Xiamen', 'Taipei'] },
  { id: 'seoul', city: 'Seoul', airport: 'ICN', country: 'South Korea', purpose: 'Presentation to a technology client',
    baseDurMin: 380, tzOffsetH: 1, distanceKm: 4620, fareCap: 950, hubs: ['Hong Kong', 'Taipei', 'Ho Chi Minh City'] },
  { id: 'mumbai', city: 'Mumbai', airport: 'BOM', country: 'India', purpose: 'Due-diligence interviews for an acquisition',
    baseDurMin: 335, tzOffsetH: -2.5, distanceKm: 3900, fareCap: 800, hubs: ['Kuala Lumpur', 'Colombo', 'Chennai'] },
  { id: 'dubai', city: 'Dubai', airport: 'DXB', country: 'United Arab Emirates', purpose: 'Regional strategy offsite',
    baseDurMin: 460, tzOffsetH: -4, distanceKm: 5840, fareCap: 1150, hubs: ['Colombo', 'Muscat', 'Kuala Lumpur'] },
  { id: 'bangkok', city: 'Bangkok', airport: 'BKK', country: 'Thailand', purpose: 'Training session for a client team',
    baseDurMin: 145, tzOffsetH: -1, distanceKm: 1430, fareCap: 450, hubs: ['Kuala Lumpur', 'Penang', 'Phuket'] },
  { id: 'hongkong', city: 'Hong Kong', airport: 'HKG', country: 'China (SAR)', purpose: 'Board meeting with an investment client',
    baseDurMin: 235, tzOffsetH: 0, distanceKm: 2590, fareCap: 650, hubs: ['Kuala Lumpur', 'Manila', 'Da Nang'] },
];

/** Price level (0-3) to fare as a proportion of the trip's fare cap, before small random jitter. */
export const PRICE_FACTORS = [0.85, 0.95, 1.05, 1.15];

/** Fictional airlines: rewards-scheme partners vs non-partners. */
export const AIRLINES = {
  partner: [
    { name: 'Aurelia Airways', code: 'AU' }, { name: 'Kestrova Air', code: 'KV' },
    { name: 'Lumenair', code: 'LM' }, { name: 'Soraya Pacific', code: 'SY' },
  ],
  other: [
    { name: 'Brightwing Air', code: 'BW' }, { name: 'Nordivo Airlines', code: 'ND' },
    { name: 'Coralto Jet', code: 'CJ' }, { name: 'Vantaro Air', code: 'VN' },
  ],
};

export const AIRCRAFT = {
  efficientLong: ['Airbus A350-900', 'Boeing 787-9'],
  efficientShort: ['Airbus A321neo', 'Boeing 737 MAX 8'],
  olderLong: ['Boeing 777-200ER', 'Airbus A330-200'],
  olderShort: ['Airbus A320ceo', 'Boeing 737-800'],
};

/** Departure-time pools (minutes after midnight). STR = 1 draws daytime, STR = 0 draws awkward hours. */
export const DEPARTURES = {
  comfortable: [8 * 60 + 10, 9 * 60 + 25, 10 * 60 + 40, 13 * 60 + 5],
  awkward: [5 * 60 + 50, 23 * 60 + 45, 0 * 60 + 55, 22 * 60 + 30],
};

/** Reasons offered when a participant books above the fare cap. Values map to factors for analysis. */
export const JUSTIFICATIONS = [
  { id: 'STR', label: 'Less tiring journey (timing, stops or duration)' },
  { id: 'ENV', label: 'Lower carbon emissions' },
  { id: 'LOY', label: `Earns ${STUDY.rewards.name} points` },
  { id: 'AI', label: 'The Trip Assistant recommended it' },
  { id: 'OTHER', label: 'Other reason' },
];

/** Text the AI uses for each favourable feature of the flight it recommends. {pct} is replaced. */
export const AI_REASON_TEXT: Record<string, string> = {
  STR: 'it is a direct, daytime flight, so the journey is less tiring',
  ENV: 'it emits about {pct}% less CO₂ than a typical flight on this route',
  LOY: 'it earns Meridian Rewards points',
  FARE: 'the fare is below the company policy cap',
};
