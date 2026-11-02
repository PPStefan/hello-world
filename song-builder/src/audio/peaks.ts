// Waveform overview data. We keep min/max per block of samples for fast drawing
// when zoomed out, and fall back to the raw samples when zoomed far in.

export const SAMPLES_PER_BIN = 256;

export interface Peaks {
  sampleRate: number;
  length: number; // in samples
  min: Float32Array;
  max: Float32Array;
  /** Channel data, used when zoomed in further than one bin per pixel. */
  channels: Float32Array[];
}

export function computePeaks(buffer: AudioBuffer): Peaks {
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, c) => buffer.getChannelData(c));
  const bins = Math.ceil(buffer.length / SAMPLES_PER_BIN);
  const min = new Float32Array(bins);
  const max = new Float32Array(bins);
  for (let b = 0; b < bins; b++) {
    const start = b * SAMPLES_PER_BIN;
    const end = Math.min(start + SAMPLES_PER_BIN, buffer.length);
    let lo = 0;
    let hi = 0;
    for (const data of channels) {
      for (let i = start; i < end; i++) {
        const v = data[i];
        if (v < lo) lo = v;
        else if (v > hi) hi = v;
      }
    }
    min[b] = lo;
    max[b] = hi;
  }
  return { sampleRate: buffer.sampleRate, length: buffer.length, min, max, channels };
}

/** Min/max of the samples between two sample positions. */
export function rangeMinMax(p: Peaks, s0: number, s1: number): [number, number] {
  s0 = Math.max(0, Math.floor(s0));
  s1 = Math.min(p.length, Math.ceil(s1));
  if (s1 <= s0) return [0, 0];
  let lo = 0;
  let hi = 0;
  if (s1 - s0 < SAMPLES_PER_BIN * 2) {
    for (const data of p.channels) {
      for (let i = s0; i < s1; i++) {
        const v = data[i];
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    }
  } else {
    const b1 = Math.min(p.min.length, Math.ceil(s1 / SAMPLES_PER_BIN));
    for (let b = Math.floor(s0 / SAMPLES_PER_BIN); b < b1; b++) {
      if (p.min[b] < lo) lo = p.min[b];
      if (p.max[b] > hi) hi = p.max[b];
    }
  }
  return [lo, hi];
}
