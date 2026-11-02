import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { AudioEngine } from '../audio/engine';
import { isAudible, type Project } from '../model/types';
import type { ProjectAction } from '../state/projectStore';
import type { LoadedAudio } from '../state/useTrackAudio';
import { TRACK_COLORS, type View } from './draw';
import { Ruler } from './Ruler';
import { ScrollBar } from './ScrollBar';
import { TrackHeader } from './TrackHeader';
import { Waveform } from './Waveform';

const RULER_HEIGHT = 40;
const LANE_HEIGHT = 84;
const MAX_PPS = 20000; // 1 ms = 20 px
const MIN_VISIBLE_SEC = 10;

interface Props {
  engine: AudioEngine;
  project: Project;
  audio: Record<string, LoadedAudio>;
  duration: number;
  dispatch: React.Dispatch<ProjectAction>;
}

export function Timeline({ engine, project, audio, duration, dispatch }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const laneRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [zoom, setZoom] = useState<number | null>(null); // null = fit whole song
  const [rawStart, setStart] = useState(0);

  useLayoutEffect(() => {
    const el = laneRef.current!;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const fitPps = width / Math.max(duration * 1.02, MIN_VISIBLE_SEC);
  const pps = Math.max(zoom ?? fitPps, fitPps) || 1;
  const visible = width / pps;
  const total = Math.max(duration * 1.02, visible);
  const start = Math.max(0, Math.min(rawStart, total - visible));
  const view: View = useMemo(() => ({ start, pps, width }), [start, pps, width]);
  const viewRef = useRef(view);
  viewRef.current = view;

  const zoomBy = useCallback(
    (factor: number, anchor?: number) => {
      const v = viewRef.current;
      const next = Math.min(MAX_PPS, v.pps * factor);
      if (next <= fitPps * 1.001) {
        setZoom(null);
        setStart(0);
        return;
      }
      const pos = engine.position;
      const visibleSec = v.width / v.pps;
      const a = anchor ?? (pos >= v.start && pos <= v.start + visibleSec ? pos : v.start + visibleSec / 2);
      setZoom(next);
      setStart(a - ((a - v.start) * v.pps) / next);
    },
    [engine, fitPps],
  );

  // Move the playhead every frame, and keep it in view while playing.
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const v = viewRef.current;
      const pos = engine.position;
      const x = (pos - v.start) * v.pps;
      const el = playheadRef.current;
      if (el) {
        el.style.transform = `translateX(${x}px)`;
        el.style.visibility = x >= 0 && x <= v.width ? 'visible' : 'hidden';
      }
      if (engine.isPlaying && (x > v.width * 0.95 || x < 0)) setStart(pos - (v.width / v.pps) * 0.05);
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [engine]);

  // Trackpad / mouse wheel: horizontal scroll, Ctrl/Cmd + wheel to zoom.
  useEffect(() => {
    const el = rootRef.current!;
    const onWheel = (e: WheelEvent) => {
      const v = viewRef.current;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = laneRef.current!.getBoundingClientRect();
        zoomBy(Math.exp(-e.deltaY * 0.01), v.start + (e.clientX - rect.left) / v.pps);
      } else if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        setStart(v.start + (e.shiftKey ? e.deltaY : e.deltaX) / v.pps);
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomBy]);

  const seek = (t: number) => engine.seek(t);
  const seekFromLane = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    seek(view.start + (e.clientX - rect.left) / view.pps);
  };

  const { tracks, bpm, beatsPerBar } = project;

  return (
    <section className="timeline" ref={rootRef}>
      <div className="tl-row" style={{ height: RULER_HEIGHT }}>
        <div className="tl-head ruler-head">
          <span className="muted">Zoom</span>
          <button className="small-btn" onClick={() => zoomBy(1 / 1.6)} title="Zoom out (Ctrl + scroll)">
            −
          </button>
          <button
            className="small-btn"
            onClick={() => {
              setZoom(null);
              setStart(0);
            }}
            title="Show the whole song"
          >
            Fit
          </button>
          <button className="small-btn" onClick={() => zoomBy(1.6)} title="Zoom in (Ctrl + scroll)">
            +
          </button>
        </div>
        <div className="tl-lane" ref={laneRef}>
          <Ruler view={view} height={RULER_HEIGHT} bpm={bpm} beatsPerBar={beatsPerBar} onSeek={seek} />
        </div>
      </div>

      {tracks.map((track, i) => {
        const a = audio[track.audioId];
        const color = TRACK_COLORS[i % TRACK_COLORS.length];
        return (
          <div className="tl-row" key={track.id} style={{ height: LANE_HEIGHT }}>
            <TrackHeader track={track} color={color} audio={a} dispatch={dispatch} />
            <div className="tl-lane" onPointerDown={seekFromLane}>
              <Waveform
                peaks={a?.status === 'ready' ? a.peaks : undefined}
                offsetSec={track.offsetMs / 1000}
                view={view}
                height={LANE_HEIGHT}
                color={color}
                dimmed={!isAudible(track, tracks)}
                bpm={bpm}
                beatsPerBar={beatsPerBar}
              />
            </div>
          </div>
        );
      })}

      {tracks.length === 0 && (
        <div className="tl-row empty-row">
          <div className="tl-head" />
          <div className="tl-lane empty-lane">No tracks yet – add audio files below.</div>
        </div>
      )}

      <div className="tl-row">
        <div className="tl-head" />
        <div className="tl-lane">
          <ScrollBar start={start} visible={visible} total={total} onChange={setStart} />
        </div>
      </div>

      <div className="playhead-layer">
        <div className="playhead" ref={playheadRef} />
      </div>
    </section>
  );
}
