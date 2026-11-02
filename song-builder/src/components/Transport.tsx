import { useEffect, useRef, useSyncExternalStore } from 'react';
import type { AudioEngine } from '../audio/engine';
import { formatTime } from './draw';

interface Props {
  engine: AudioEngine;
  bpm: number;
  beatsPerBar: number;
  duration: number;
}

export function useIsPlaying(engine: AudioEngine) {
  return useSyncExternalStore(
    (fn) => engine.subscribe(fn),
    () => engine.isPlaying,
  );
}

export function Transport({ engine, bpm, beatsPerBar, duration }: Props) {
  const playing = useIsPlaying(engine);
  const timeRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const pos = engine.position;
      const beat = Math.floor(pos / (60 / bpm));
      if (timeRef.current) timeRef.current.textContent = formatTime(pos);
      if (barRef.current)
        barRef.current.textContent = `Bar ${Math.floor(beat / beatsPerBar) + 1} · Beat ${(beat % beatsPerBar) + 1}`;
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [engine, bpm, beatsPerBar]);

  const empty = duration === 0;

  return (
    <div className="transport">
      <button className="transport-btn" onClick={() => engine.stop()} disabled={empty} title="Stop and go to start">
        <span aria-hidden>■</span> Stop
      </button>
      <button
        className="transport-btn primary"
        onClick={() => (playing ? engine.pause() : engine.play())}
        disabled={empty}
        title="Play / pause (space bar)"
      >
        {playing ? (
          <>
            <span aria-hidden>❚❚</span> Pause
          </>
        ) : (
          <>
            <span aria-hidden>▶</span> Play
          </>
        )}
      </button>
      <div className="clock">
        <span className="clock-time" ref={timeRef} />
        <span className="clock-bar" ref={barRef} />
      </div>
      <div className="muted song-length">Length {formatTime(duration, 1)}</div>
    </div>
  );
}
