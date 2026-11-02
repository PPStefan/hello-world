import { useEffect, useMemo, useState } from 'react';
import { AudioEngine } from './audio/engine';
import { AddTracks } from './components/AddTracks';
import { SongHeader } from './components/SongHeader';
import { Timeline } from './components/Timeline';
import { Transport } from './components/Transport';
import { MAX_TRACKS, createTrack } from './model/types';
import { useProjectStore } from './state/projectStore';
import { useTrackAudio } from './state/useTrackAudio';
import { MemoryAudioStore } from './storage/memory';

const DEMO_TRACKS = [
  { file: '1-drums.wav', name: 'Drums – Demo' },
  { file: '2-bass.wav', name: 'Bass – Demo' },
  { file: '3-guitar-37ms-late.wav', name: 'Guitar – Demo (37 ms late)' },
  { file: '4-keys.wav', name: 'Keys – Demo' },
  { file: '5-vocals.wav', name: 'Vocals – Demo' },
];

const AUDIO_EXT = /\.(wav|mp3|m4a|aac|mp4)$/i;

/** "03_drums-anna.wav" -> "Drums anna" */
function nameFromFile(fileName: string) {
  const base = fileName.replace(/\.[^.]+$/, '').replace(/^\d+[\s._-]*/, '').replace(/[_-]+/g, ' ').trim();
  return base ? base[0].toUpperCase() + base.slice(1) : fileName;
}

export default function App() {
  const [engine] = useState(() => new AudioEngine());
  const [audioStore] = useState(() => new MemoryAudioStore());
  const [project, dispatch] = useProjectStore();
  const { audio, addFile } = useTrackAudio(engine, audioStore, project.tracks);
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);

  const duration = useMemo(() => {
    let end = 0;
    for (const t of project.tracks) {
      const a = audio[t.audioId];
      if (a?.status === 'ready') end = Math.max(end, t.offsetMs / 1000 + a.buffer.duration);
    }
    return end;
  }, [project.tracks, audio]);

  async function addTracks(items: { file: File; name: string }[]) {
    const problems: string[] = [];
    const room = MAX_TRACKS - project.tracks.length;
    if (items.length > room) {
      problems.push(`A song can have at most ${MAX_TRACKS} tracks, so ${items.length - room} file(s) were skipped.`);
      items = items.slice(0, room);
    }
    setBusy(true);
    for (const { file, name } of items) {
      try {
        const audioId = await addFile(file);
        dispatch({ type: 'addTrack', track: createTrack(name, audioId, file.name) });
      } catch (e) {
        problems.push(`${file.name}: ${(e as Error).message}`);
      }
    }
    setBusy(false);
    setMessages(problems);
  }

  function onFiles(files: File[]) {
    const audioFiles = files.filter((f) => f.type.startsWith('audio/') || AUDIO_EXT.test(f.name));
    const skipped = files.length - audioFiles.length;
    addTracks(audioFiles.map((file) => ({ file, name: nameFromFile(file.name) }))).then(() => {
      if (skipped) setMessages((m) => [...m, `${skipped} file(s) skipped because they are not audio files.`]);
    });
  }

  async function onDemo() {
    try {
      const items = await Promise.all(
        DEMO_TRACKS.map(async ({ file, name }) => {
          const res = await fetch(`${import.meta.env.BASE_URL}samples/${file}`);
          if (!res.ok) throw new Error('Demo files not found. Run “npm run make-samples” first.');
          return { file: new File([await res.blob()], file, { type: 'audio/wav' }), name };
        }),
      );
      if (project.tracks.length === 0 && project.name === 'Untitled song') {
        dispatch({ type: 'setName', name: 'Demo song' });
        dispatch({ type: 'setBpm', bpm: 100 });
      }
      await addTracks(items);
    } catch (e) {
      setMessages([(e as Error).message]);
    }
  }

  // Space bar = play / pause (except while typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const el = e.target as HTMLElement;
      if (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return;
      if (el.tagName === 'INPUT' && (el as HTMLInputElement).type !== 'range') return;
      if (el.tagName === 'BUTTON') el.blur();
      e.preventDefault();
      if (engine.isPlaying) engine.pause();
      else if (engine.duration > 0) engine.play();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [engine]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          Remote Band Club <span className="brand-sub">Song Builder</span>
        </div>
      </header>
      <main>
        <SongHeader project={project} dispatch={dispatch} />
        <Transport engine={engine} bpm={project.bpm} beatsPerBar={project.beatsPerBar} duration={duration} />
        {messages.length > 0 && (
          <div className="messages" role="alert">
            {messages.map((m, i) => (
              <div key={i}>{m}</div>
            ))}
            <button className="icon-btn" onClick={() => setMessages([])} title="Dismiss">
              ×
            </button>
          </div>
        )}
        <Timeline engine={engine} project={project} audio={audio} duration={duration} dispatch={dispatch} />
        <AddTracks trackCount={project.tracks.length} busy={busy} onFiles={onFiles} onDemo={onDemo} />
      </main>
    </div>
  );
}
