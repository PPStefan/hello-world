// Generates five short test recordings for the Song Builder in public/samples/.
//
//   npm run make-samples          (always regenerate)
//   node scripts/make-samples.mjs --if-missing
//
// Song: 100 BPM, 4/4, chords C – Am – F – G (twice).
// Every file starts with a clap on beat 3 of bar 1 (t = 1.2 s), like a band
// member clapping before they play. The music starts at bar 2 (t = 2.4 s).
// The guitar file is deliberately 37 ms late, so you can test the timing tools.

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 44100;
const BPM = 100;
const BEAT = 60 / BPM; // 0.6 s
const BAR = BEAT * 4; // 2.4 s
const MUSIC_START = BAR; // bar 2
const BARS = 8;
const LENGTH = MUSIC_START + BARS * BAR + 1.5; // seconds
const CLAP_AT = BEAT * 2; // beat 3 of bar 1

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'samples');

const FILES = {
  '1-drums.wav': drums,
  '2-bass.wav': bass,
  '3-guitar-37ms-late.wav': () => delay(guitar(), 0.037),
  '4-keys.wav': keys,
  '5-vocals.wav': vocals,
};

// ---------- instruments ----------

const CHORDS = ['C', 'Am', 'F', 'G'];
const BASS_ROOT = { C: 65.41, Am: 55.0, F: 43.65, G: 49.0 };
const GUITAR = {
  C: [130.81, 164.81, 196.0, 261.63, 329.63],
  Am: [110.0, 164.81, 220.0, 261.63, 329.63],
  F: [87.31, 130.81, 174.61, 220.0, 261.63],
  G: [98.0, 123.47, 146.83, 196.0, 246.94],
};
const KEYS = {
  C: [261.63, 329.63, 392.0],
  Am: [220.0, 261.63, 329.63],
  F: [174.61, 220.0, 261.63],
  G: [196.0, 246.94, 293.66],
};
const MELODY = {
  C: [329.63, 392.0],
  Am: [523.25, 440.0],
  F: [440.0, 349.23],
  G: [392.0, 293.66],
};

function eachBar(fn) {
  for (let bar = 0; bar < BARS; bar++) fn(MUSIC_START + bar * BAR, CHORDS[bar % 4], bar);
}

function drums() {
  const out = empty();
  eachBar((t) => {
    for (const b of [0, 2, 2.5]) kick(out, t + b * BEAT);
    for (const b of [1, 3]) snare(out, t + b * BEAT);
    for (let e = 0; e < 8; e++) hat(out, t + e * BEAT * 0.5, e % 2 ? 0.12 : 0.2);
  });
  return out;
}

function bass() {
  const out = empty();
  eachBar((t, chord) => {
    for (let e = 0; e < 8; e++) {
      const f = BASS_ROOT[chord] * (e === 7 ? 1.5 : 1);
      tone(out, t + e * BEAT * 0.5, BEAT * 0.45, f, [1, 0.35, 0.15], { attack: 0.005, decay: 0.6 });
    }
  });
  return out;
}

function guitar() {
  const out = empty();
  eachBar((t, chord) => {
    for (const b of [0, 1.5, 2, 3]) {
      GUITAR[chord].forEach((f, i) => pluck(out, t + b * BEAT + i * 0.012, f, 0.25));
    }
  });
  return out;
}

function keys() {
  const out = empty();
  eachBar((t, chord) => {
    for (const b of [0, 2]) {
      for (const f of KEYS[chord]) tone(out, t + b * BEAT, BEAT * 2, f, [1, 0.2], { attack: 0.01, decay: 1.2, gain: 0.25 });
    }
  });
  return out;
}

function vocals() {
  const out = empty();
  eachBar((t, chord, bar) => {
    if (bar < 2) return; // the singer comes in at bar 4
    MELODY[chord].forEach((f, i) =>
      tone(out, t + i * BEAT * 2, BEAT * 1.9, f, [1, 0.3, 0.15], { attack: 0.06, decay: 3, vibrato: true }),
    );
  });
  return out;
}

// ---------- sound building blocks ----------

function empty() {
  return new Float32Array(Math.ceil(LENGTH * SR));
}

function add(out, start, i, v) {
  const n = Math.round(start * SR) + i;
  if (n >= 0 && n < out.length) out[n] += v;
}

function tone(out, start, dur, freq, harmonics, { attack, decay, gain = 0.5, vibrato = false }) {
  const len = Math.round((dur + 0.05) * SR);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const f = vibrato ? freq * (1 + 0.006 * Math.sin(2 * Math.PI * 5.5 * t) * Math.min(1, t / 0.3)) : freq;
    phase += (2 * Math.PI * f) / SR;
    let env = Math.min(1, t / attack) * Math.exp(-t / decay);
    if (t > dur) env *= Math.max(0, 1 - (t - dur) / 0.05);
    let v = 0;
    harmonics.forEach((h, k) => (v += h * Math.sin(phase * (k + 1))));
    add(out, start, i, v * env * gain);
  }
}

function kick(out, start) {
  let phase = 0;
  for (let i = 0; i < 0.4 * SR; i++) {
    const t = i / SR;
    const f = 45 + 105 * Math.exp(-t / 0.03);
    phase += (2 * Math.PI * f) / SR;
    add(out, start, i, Math.sin(phase) * Math.exp(-t / 0.12) * 0.9);
  }
}

function snare(out, start) {
  for (let i = 0; i < 0.25 * SR; i++) {
    const t = i / SR;
    const noise = (Math.random() * 2 - 1) * Math.exp(-t / 0.06) * 0.45;
    const body = Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t / 0.04) * 0.4;
    add(out, start, i, noise + body);
  }
}

function hat(out, start, gain) {
  let prev = 0;
  for (let i = 0; i < 0.06 * SR; i++) {
    const n = Math.random() * 2 - 1;
    add(out, start, i, (n - prev) * Math.exp(-i / SR / 0.015) * gain);
    prev = n;
  }
}

function clap(out, start) {
  // three quick bursts and a short tail, like a real hand clap
  for (let i = 0; i < 0.15 * SR; i++) {
    const t = i / SR;
    const burst = t < 0.03 ? Math.exp(-(t % 0.01) / 0.002) : Math.exp(-(t - 0.03) / 0.03);
    add(out, start, i, (Math.random() * 2 - 1) * burst * 0.9);
  }
}

function pluck(out, start, freq, gain) {
  // Karplus–Strong string
  const n = Math.round(SR / freq);
  const buf = Float32Array.from({ length: n }, () => Math.random() * 2 - 1);
  let idx = 0;
  for (let i = 0; i < 1.4 * SR; i++) {
    const next = (idx + 1) % n;
    const v = buf[idx];
    buf[idx] = 0.498 * (v + buf[next]);
    idx = next;
    add(out, start, i, v * gain);
  }
}

function delay(track, seconds) {
  const shift = Math.round(seconds * SR);
  const out = new Float32Array(track.length + shift);
  out.set(track, shift);
  return out;
}

function normalize(track, peak) {
  let max = 0;
  for (const v of track) max = Math.max(max, Math.abs(v));
  if (max > 0) for (let i = 0; i < track.length; i++) track[i] *= peak / max;
}

function encodeWav(samples) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + samples.length * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((v, i) => buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2));
  return buf;
}

// ---------- main ----------

if (process.argv.includes('--if-missing') && Object.keys(FILES).every((f) => existsSync(join(outDir, f)))) {
  process.exit(0);
}

mkdirSync(outDir, { recursive: true });
for (const [name, make] of Object.entries(FILES)) {
  const track = make();
  clap(track, CLAP_AT);
  normalize(track, 0.8);
  writeFileSync(join(outDir, name), encodeWav(track));
  console.log(`made public/samples/${name}`);
}
