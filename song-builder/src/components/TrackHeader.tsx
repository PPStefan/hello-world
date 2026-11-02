import { FADER_MAX_DB, FADER_OFF, faderToGain, formatDb, gainToFader } from '../audio/volume';
import type { Track } from '../model/types';
import type { ProjectAction } from '../state/projectStore';
import type { LoadedAudio } from '../state/useTrackAudio';

interface Props {
  track: Track;
  color: string;
  audio?: LoadedAudio;
  /** False when muted, or when another track is soloed. */
  audible: boolean;
  dispatch: React.Dispatch<ProjectAction>;
}

export function TrackHeader({ track, color, audio, audible, dispatch }: Props) {
  const update = (changes: Partial<Track>) => dispatch({ type: 'updateTrack', id: track.id, changes });

  const fileInfo =
    audio?.status === 'ready' ? `${track.fileName} · ${audio.buffer.duration.toFixed(1)} s` : track.fileName;

  return (
    <div className={`tl-head track-head ${audible ? '' : 'silent'}`} style={{ borderLeftColor: color }}>
      <div className="track-title">
        <input
          className="track-name"
          value={track.name}
          onChange={(e) => update({ name: e.target.value })}
          aria-label="Track name"
          placeholder="Instrument – Name"
          title={fileInfo}
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

      <div className="track-mix">
        <button
          className={`toggle mute ${track.muted ? 'on' : ''}`}
          aria-pressed={track.muted}
          title="Mute: silence this track"
          onClick={() => update({ muted: !track.muted })}
        >
          M
        </button>
        <button
          className={`toggle solo ${track.solo ? 'on' : ''}`}
          aria-pressed={track.solo}
          title="Solo: hear only soloed tracks (Alt-click: solo only this one)"
          onClick={(e) => {
            if (e.altKey) {
              dispatch({ type: 'soloOnly', id: track.id });
            } else {
              update({ solo: !track.solo });
            }
          }}
        >
          S
        </button>
        <input
          className="fader"
          type="range"
          min={FADER_OFF}
          max={FADER_MAX_DB}
          step={0.5}
          value={gainToFader(track.volume)}
          onChange={(e) => update({ volume: faderToGain(Number(e.target.value)) })}
          onDoubleClick={() => update({ volume: 1 })}
          aria-label={`Volume of ${track.name}`}
          title="Volume (double-click to reset to 0 dB)"
          style={{ accentColor: color }}
        />
        <span className="db">{formatDb(track.volume)}</span>
      </div>

      <div className="track-file">
        {audio?.status === 'loading' && 'Loading…'}
        {audio?.status === 'error' && <span className="error-text">{audio.message}</span>}
        {audio?.status === 'ready' && fileInfo}
      </div>
    </div>
  );
}
