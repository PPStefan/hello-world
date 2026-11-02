import { useEffect, useRef } from 'react';
import { formatTime, niceTimeStep, setupCanvas, timeToX, type View } from './draw';

interface Props {
  view: View;
  height: number;
  bpm: number;
  beatsPerBar: number;
  onSeek: (seconds: number) => void;
}

/** Bar numbers on top, clock time below. Click or drag to move the playhead. */
export function Ruler({ view, height, bpm, beatsPerBar, onSeek }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || view.width <= 0) return;
    const ctx = setupCanvas(canvas, view.width, height);
    const end = view.start + view.width / view.pps;
    ctx.font = '11px system-ui, sans-serif';
    ctx.textBaseline = 'top';

    // bars
    const barSec = (60 / bpm) * beatsPerBar;
    const barPx = barSec * view.pps;
    const every = barPx >= 28 ? 1 : Math.ceil(28 / barPx / 4) * 4;
    ctx.fillStyle = '#333';
    for (let b = Math.max(0, Math.floor(view.start / barSec)); b * barSec <= end; b++) {
      if (b % every) continue;
      const x = Math.round(timeToX(view, b * barSec)) + 0.5;
      ctx.fillRect(x, 0, 1, height / 2);
      ctx.fillText(String(b + 1), x + 3, 3);
    }

    // clock time
    const step = niceTimeStep(view.pps);
    const decimals = step < 0.01 ? 3 : step < 0.1 ? 2 : step < 1 ? 1 : 0;
    ctx.fillStyle = '#888';
    for (let i = Math.max(0, Math.floor(view.start / step)); i * step <= end; i++) {
      const t = i * step;
      const x = Math.round(timeToX(view, t)) + 0.5;
      ctx.fillRect(x, height - 6, 1, 6);
      ctx.fillText(formatTime(t, decimals), x + 3, height / 2 + 2);
    }
  }, [view, height, bpm, beatsPerBar]);

  const seekAt = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek(view.start + (e.clientX - rect.left) / view.pps);
  };

  return (
    <canvas
      ref={ref}
      className="ruler"
      title="Click or drag to move the playhead"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        seekAt(e);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) seekAt(e);
      }}
    />
  );
}
