import { useRef } from 'react';

interface Props {
  /** Seconds at the left edge of the view. */
  start: number;
  /** Seconds visible at once. */
  visible: number;
  /** Total scrollable length in seconds. */
  total: number;
  onChange: (start: number) => void;
}

/** A always-visible horizontal scrollbar for the timeline. */
export function ScrollBar({ start, visible, total, onChange }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; start: number } | null>(null);
  if (total <= visible) return <div className="scrollbar" />;

  const thumbFrac = visible / total;
  const posFrac = start / total;

  const secPerPx = () => total / (trackRef.current?.clientWidth || 1);

  return (
    <div
      className="scrollbar"
      ref={trackRef}
      onPointerDown={(e) => {
        if (e.target !== e.currentTarget) return;
        // click on the empty track: jump there
        const rect = e.currentTarget.getBoundingClientRect();
        onChange((e.clientX - rect.left) * secPerPx() - visible / 2);
      }}
    >
      <div
        className="scrollbar-thumb"
        style={{ left: `${posFrac * 100}%`, width: `${thumbFrac * 100}%` }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, start };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          onChange(drag.current.start + (e.clientX - drag.current.x) * secPerPx());
        }}
        onPointerUp={() => (drag.current = null)}
      />
    </div>
  );
}
