import type { AICondition, Trip } from './lib/types';

/**
 * Study 4c configuration. Everything a researcher is likely to change lives here.
 * Flight attribute levels come from src/data/design.json (see scripts/generate_design.py).
 */
export const STUDY = {
  version: '4c-0.1.0',
  company: 'Meridian Partners',
  platform: 'TravelDesk',
  origin: { city: 'Singapore', airport: 'SIN' },
  currency: 'S$',
  allianceName: 'SkyCircle',
  memberTier: 'Gold',
  addonAllowance: 60,
  /** Number of good / poor / none AI trials across the scored bookings (must sum to trips.length). */
  aiAllocation: { good: 3, poor: 3, none: 2 } as Record<AICondition, number>,
  /** Number of reasons the AI gives for its pick (same for good and poor picks). */
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
  blurb: 'Busy riverside city known for street food, markets and French-colonial architecture.',
  baseDurMin: 125,
  tzOffsetH: -1,
  distanceKm: 1090,
  fareCap: 400,
  hubs: ['Kuala Lumpur', 'Bangkok'],
};

/** Eight scored trips. Order is randomised per participant; design sets are mapped to trips per participant too. */
export const TRIPS: Trip[] = [
  {
    id: 'tokyo', city: 'Tokyo', airport: 'HND', country: 'Japan',
    purpose: 'Contract negotiation with a logistics client',
    blurb: 'Vast, very safe megacity with an outstanding food scene, shrines and seasonal gardens.',
    baseDurMin: 410, tzOffsetH: 1, distanceKm: 5320, fareCap: 1100, hubs: ['Hong Kong', 'Taipei', 'Manila'],
  },
  {
    id: 'sydney', city: 'Sydney', airport: 'SYD', country: 'Australia',
    purpose: 'Quarterly review with a banking client',
    blurb: 'Harbour city with beaches, coastal walks and a lively waterfront.',
    baseDurMin: 475, tzOffsetH: 3, distanceKm: 6300, fareCap: 1200, hubs: ['Kuala Lumpur', 'Denpasar', 'Darwin'],
  },
  {
    id: 'shanghai', city: 'Shanghai', airport: 'PVG', country: 'China',
    purpose: 'Kick-off workshop for a retail project',
    blurb: 'Fast-paced financial centre with the historic Bund, water towns nearby and a famous skyline.',
    baseDurMin: 325, tzOffsetH: 0, distanceKm: 3800, fareCap: 850, hubs: ['Hong Kong', 'Xiamen', 'Taipei'],
  },
  {
    id: 'seoul', city: 'Seoul', airport: 'ICN', country: 'South Korea',
    purpose: 'Presentation to a technology client',
    blurb: 'Energetic capital mixing palaces, mountain hikes, design districts and night markets.',
    baseDurMin: 380, tzOffsetH: 1, distanceKm: 4620, fareCap: 950, hubs: ['Hong Kong', 'Taipei', 'Ho Chi Minh City'],
  },
  {
    id: 'mumbai', city: 'Mumbai', airport: 'BOM', country: 'India',
    purpose: 'Due-diligence interviews for an acquisition',
    blurb: 'Coastal commercial capital with colonial-era landmarks, seafront promenades and a strong film culture.',
    baseDurMin: 335, tzOffsetH: -2.5, distanceKm: 3900, fareCap: 800, hubs: ['Kuala Lumpur', 'Colombo', 'Chennai'],
  },
  {
    id: 'dubai', city: 'Dubai', airport: 'DXB', country: 'United Arab Emirates',
    purpose: 'Regional strategy offsite',
    blurb: 'Desert city of modern architecture, souks, beaches and large-scale attractions.',
    baseDurMin: 460, tzOffsetH: -4, distanceKm: 5840, fareCap: 1150, hubs: ['Colombo', 'Muscat', 'Kuala Lumpur'],
  },
  {
    id: 'bangkok', city: 'Bangkok', airport: 'BKK', country: 'Thailand',
    purpose: 'Training session for a client team',
    blurb: 'Lively capital known for temples, river life, markets and street food.',
    baseDurMin: 145, tzOffsetH: -1, distanceKm: 1430, fareCap: 450, hubs: ['Kuala Lumpur', 'Penang', 'Phuket'],
  },
  {
    id: 'hongkong', city: 'Hong Kong', airport: 'HKG', country: 'China (SAR)',
    purpose: 'Board meeting with an investment client',
    blurb: 'Dense harbour city with dramatic skyline views, island hikes and dim sum.',
    baseDurMin: 235, tzOffsetH: 0, distanceKm: 2590, fareCap: 650, hubs: ['Kuala Lumpur', 'Manila', 'Da Nang'],
  },
];

/** Fictional airlines, keyed by alliance membership (LOY) and safety level (SAF). Two per cell. */
export const AIRLINES: Record<string, { name: string; code: string }[]> = {
  'L1-S1': [{ name: 'Aurelia Airways', code: 'AU' }, { name: 'Kestrova Air', code: 'KV' }],
  'L1-S0': [{ name: 'Lumenair', code: 'LM' }, { name: 'Soraya Pacific', code: 'SY' }],
  'L0-S1': [{ name: 'Brightwing Air', code: 'BW' }, { name: 'Nordivo Airlines', code: 'ND' }],
  'L0-S0': [{ name: 'Coralto Jet', code: 'CJ' }, { name: 'Vantaro Air', code: 'VN' }],
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

/** Add-ons draw on a shared per-trip allowance, so participants must prioritise. Each maps to one factor. */
export const ADDONS = [
  { id: 'legroom', factor: 'STR', price: 30, title: 'Extra-legroom seat', desc: 'More space to rest and stretch during the flight.' },
  { id: 'lounge', factor: 'PRD', price: 35, title: 'Lounge with quiet work pods', desc: 'Desk, fast Wi-Fi and printing before departure.' },
  { id: 'safety', factor: 'SAF', price: 25, title: 'Enhanced travel safety cover', desc: 'Medical evacuation, 24/7 security helpline and incident support.' },
  { id: 'offset', factor: 'ENV', price: 20, title: 'Carbon offset and SAF contribution', desc: 'Offsets this flight and funds sustainable aviation fuel.' },
  { id: 'miles', factor: 'LOY', price: 25, title: 'SkyCircle miles top-up', desc: 'Adds 2,000 miles to your SkyCircle account.' },
] as const;

/** Reasons offered when a participant books above the fare cap. Values map to factors for analysis. */
export const JUSTIFICATIONS = [
  { id: 'STR', label: 'Less tiring journey (timing, stops or duration)' },
  { id: 'PRD', label: 'Better for working on the way' },
  { id: 'SAF', label: 'Safer airline' },
  { id: 'ENV', label: 'Lower carbon emissions' },
  { id: 'LOY', label: 'Earns miles or status on my membership' },
  { id: 'AI', label: 'The Trip Assistant recommended it' },
  { id: 'OTHER', label: 'Other reason' },
];

/** Text the AI uses for each favourable attribute of the flight it recommends. {pct} is replaced. */
export const AI_REASON_TEXT: Record<string, string> = {
  STR: 'it is a direct, daytime flight, so the journey is less tiring',
  PRD: 'it has Wi-Fi, power and a work-friendly seat, so you can work on board',
  SAF: 'the airline has the top independent safety rating (7/7)',
  ENV: 'it emits about {pct}% less CO₂ than a typical flight on this route',
  LOY: 'it earns SkyCircle miles and status credits on your membership',
  PRC: 'the fare is within the company policy cap',
};
