import type { Track } from '../model/types';
import type { ProjectAction } from '../state/projectStore';
import type { LoadedAudio } from '../state/useTrackAudio';

interface Props {
  track: Track;
  color: string;
  audio?: LoadedAudio;
  dispatch: React.Dispatch<ProjectAction>;
}

export function TrackHeader({ track, color, audio, dispatch }: Props) {
  const update = (changes: Partial<Track>) => dispatch({ type: 'updateTrack', id: track.id, changes });

  return (
    <div className="tl-head track-head" style={{ borderLeftColor: color }}>
      <div className="track-title">
        <input
          className="track-name"
          value={track.name}
          onChange={(e) => update({ name: e.target.value })}
          aria-label="Track name"
          placeholder="Instrument – Name"
        />
        <button
          className="icon-btn"
          title="Remove track"
          onClick={() => {
            if (confirm(`Remove “${track.name}” from this song?`)) dispatch({ type: 'removeTrack', id: track.id });
          }}
        >
          ×
        </button>
      </div>
      <div className="track-file" title={track.fileName}>
        {audio?.status === 'loading' && 'Loading…'}
        {audio?.status === 'error' && <span className="error-text">{audio.message}</span>}
        {audio?.status === 'ready' && `${track.fileName} · ${audio.buffer.duration.toFixed(1)} s`}
      </div>
    </div>
  );
}
