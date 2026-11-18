import type { BookingRecord, SessionData } from './types';

/**
 * Communication with the parent Qualtrics page (the app runs inside an iframe).
 * Messages: btps4c-ready, btps4c-resize, btps4c-progress, btps4c-complete.
 * The Qualtrics question JavaScript (see README) listens for btps4c-complete and writes Embedded Data.
 */
export const embedded = typeof window !== 'undefined' && window.parent !== window;

function parentOrigin(): string {
  const p = new URLSearchParams(window.location.search).get('origin');
  return p || '*';
}

export function post(type: string, payload?: unknown) {
  if (!embedded) return;
  try {
    window.parent.postMessage({ type, payload }, parentOrigin());
  } catch {
    /* ignore */
  }
}

/** One flat row of summary fields per scored booking, for Qualtrics Embedded Data. */
export function flatten(data: SessionData): Record<string, string> {
  const out: Record<string, string> = {
    b4c_version: data.version,
    b4c_seed: String(data.seed),
    b4c_duration_s: data.durationMs != null ? String(Math.round(data.durationMs / 1000)) : '',
    b4c_check_attempts: String(data.checkAttempts),
  };
  data.bookings
    .filter((b) => !b.practice)
    .forEach((b: BookingRecord) => {
      const k = `b4c_${b.pos}_`;
      out[k + 'trip'] = b.tripId;
      out[k + 'set'] = String(b.designSet);
      out[k + 'ai'] = b.ai;
      out[k + 'rec'] = b.recOptIdx == null ? '' : String(b.recOptIdx);
      out[k + 'choice'] = String(b.choiceOptIdx);
      out[k + 'code'] = b.choiceCode;
      out[k + 'follow'] = b.followedAI == null ? '' : b.followedAI ? '1' : '0';
      out[k + 'over'] = b.overPolicy ? '1' : '0';
      out[k + 'just'] = b.justification.join('|');
      out[k + 'addons'] = b.addons.join('|');
      out[k + 'bleisure'] = b.bleisure ? '1' : '0';
      out[k + 'rt'] = String(b.rtMs);
    });
  return out;
}

export function startAutoResize() {
  if (!embedded) return;
  const send = () => post('btps4c-resize', { height: document.documentElement.scrollHeight });
  const ro = new ResizeObserver(send);
  ro.observe(document.body);
  send();
}
