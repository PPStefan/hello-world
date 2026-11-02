import { useRef, useState } from 'react';
import { MAX_TRACKS } from '../model/types';

export const ACCEPTED = '.wav,.mp3,.m4a,audio/wav,audio/x-wav,audio/mpeg,audio/mp4,audio/x-m4a,audio/aac';

interface Props {
  trackCount: number;
  busy: boolean;
  onFiles: (files: File[]) => void;
  onDemo: () => void;
}

export function AddTracks({ trackCount, busy, onFiles, onDemo }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const full = trackCount >= MAX_TRACKS;

  return (
    <section
      className={`add-tracks ${over ? 'drag-over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!full) onFiles([...e.dataTransfer.files]);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        multiple
        hidden
        onChange={(e) => {
          onFiles([...(e.target.files ?? [])]);
          e.target.value = '';
        }}
      />
      {full ? (
        <p>This song has the maximum of {MAX_TRACKS} tracks. Remove one to add another.</p>
      ) : (
        <>
          <p>
            <strong>Add tracks:</strong> drop audio files here (WAV, MP3 or M4A) or
          </p>
          <button className="btn primary" onClick={() => inputRef.current?.click()} disabled={busy}>
            Choose files…
          </button>
          <button className="btn" onClick={onDemo} disabled={busy} title="Five generated test recordings at 100 BPM">
            Load demo tracks
          </button>
          <span className="muted">
            {busy ? 'Reading audio…' : `${trackCount} of ${MAX_TRACKS} tracks`}
          </span>
        </>
      )}
    </section>
  );
}
