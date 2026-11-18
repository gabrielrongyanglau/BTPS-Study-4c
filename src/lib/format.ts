import { STUDY } from '../config';

export function clock(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** Day offset label for an arrival time relative to the departure day. */
export function dayOffset(min: number): string {
  const d = Math.floor(min / 1440);
  if (d === 0) return '';
  return d > 0 ? `+${d}` : `${d}`;
}

export function duration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${String(m).padStart(2, '0')}m`;
}

export function money(n: number): string {
  return `${STUDY.currency}${n.toLocaleString('en-GB')}`;
}
