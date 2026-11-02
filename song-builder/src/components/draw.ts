// Small canvas helpers shared by the ruler and the waveform lanes.

export const TRACK_COLORS = ['#e4572e', '#2e86ab', '#f3a712', '#4caf50', '#a05195', '#00a6a6', '#d45087', '#7a6c5d'];

/** Size a canvas for the screen's pixel density and return its 2D context. */
export function setupCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.round(width * dpr));
  const h = Math.max(1, Math.round(height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  return ctx;
}

export interface View {
  /** Song time at the left edge, seconds. */
  start: number;
  /** Zoom: pixels per second. */
  pps: number;
  width: number;
}

export function timeToX(view: View, t: number) {
  return (t - view.start) * view.pps;
}

/** Faint beat lines and stronger bar lines. */
export function drawBeatGrid(ctx: CanvasRenderingContext2D, view: View, height: number, bpm: number, beatsPerBar: number) {
  const beat = 60 / bpm;
  const beatPx = beat * view.pps;
  const showBeats = beatPx >= 8;
  const first = Math.max(0, Math.floor(view.start / beat));
  const last = Math.ceil((view.start + view.width / view.pps) / beat);
  for (let b = first; b <= last; b++) {
    const isBar = b % beatsPerBar === 0;
    if (!isBar && !showBeats) continue;
    if (isBar && !showBeats && beatPx * beatsPerBar < 6) continue;
    const x = Math.round(timeToX(view, b * beat)) + 0.5;
    ctx.fillStyle = isBar ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.05)';
    ctx.fillRect(x, 0, 1, height);
  }
}

/** Pick a "nice" step for time labels so they are at least `minPx` apart. */
export function niceTimeStep(pps: number, minPx = 70) {
  const steps = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 60];
  return steps.find((s) => s * pps >= minPx) ?? 120;
}

export function formatTime(sec: number, decimals = 3) {
  const sign = sec < 0 ? '-' : '';
  sec = Math.abs(sec);
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  const sStr = s.toFixed(decimals).padStart(decimals ? decimals + 3 : 2, '0');
  return `${sign}${m}:${sStr}`;
}
