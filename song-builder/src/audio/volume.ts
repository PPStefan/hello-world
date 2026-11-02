// Volume faders work in decibels (like a mixing desk); the project stores linear gain.

export const FADER_MIN_DB = -40; // anything below this position is "off"
export const FADER_MAX_DB = 6;
export const FADER_OFF = FADER_MIN_DB - 1;

export function gainToFader(gain: number): number {
  if (gain <= 0) return FADER_OFF;
  return Math.max(FADER_MIN_DB, Math.min(FADER_MAX_DB, 20 * Math.log10(gain)));
}

export function faderToGain(db: number): number {
  return db <= FADER_OFF ? 0 : 10 ** (db / 20);
}

export function formatDb(gain: number): string {
  if (gain <= 0) return 'off';
  const db = 20 * Math.log10(gain);
  if (Math.abs(db) < 0.05) return '0.0 dB';
  return `${db > 0 ? '+' : '−'}${Math.abs(db).toFixed(1)} dB`;
}
