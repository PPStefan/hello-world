import { useEffect, useRef } from 'react';
import { rangeMinMax, type Peaks } from '../audio/peaks';
import { drawBeatGrid, setupCanvas, timeToX, type View } from './draw';

interface Props {
  peaks?: Peaks;
  offsetSec: number;
  view: View;
  height: number;
  color: string;
  dimmed: boolean;
  bpm: number;
  beatsPerBar: number;
}

export function Waveform({ peaks, offsetSec, view, height, color, dimmed, bpm, beatsPerBar }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || view.width <= 0) return;
    const ctx = setupCanvas(canvas, view.width, height);
    drawBeatGrid(ctx, view, height, bpm, beatsPerBar);
    if (!peaks) return;

    const duration = peaks.length / peaks.sampleRate;
    const x0 = timeToX(view, offsetSec);
    const x1 = timeToX(view, offsetSec + duration);
    const from = Math.max(0, Math.floor(x0));
    const to = Math.min(view.width, Math.ceil(x1));
    if (to <= from) return;

    const fill = dimmed ? '#9aa0a6' : color;
    // clip background
    ctx.globalAlpha = 0.13;
    ctx.fillStyle = fill;
    ctx.fillRect(x0, 2, x1 - x0, height - 4);
    ctx.globalAlpha = 1;
    // waveform, one vertical line per pixel
    const mid = height / 2;
    const scale = mid - 4;
    const sr = peaks.sampleRate;
    for (let x = from; x < to; x++) {
      const t0 = view.start + x / view.pps - offsetSec;
      const [lo, hi] = rangeMinMax(peaks, t0 * sr, (t0 + 1 / view.pps) * sr);
      const y1 = mid - hi * scale;
      const y2 = mid - lo * scale;
      ctx.fillRect(x, y1, 1, Math.max(1, y2 - y1));
    }
    // clip edges
    ctx.fillStyle = fill;
    if (x0 >= 0) ctx.fillRect(Math.round(x0), 2, 2, height - 4);
    if (x1 <= view.width) ctx.fillRect(Math.round(x1) - 2, 2, 2, height - 4);
  }, [peaks, offsetSec, view, height, color, dimmed, bpm, beatsPerBar]);

  return <canvas ref={ref} className="waveform" />;
}
