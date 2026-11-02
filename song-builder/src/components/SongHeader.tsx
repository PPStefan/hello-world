import { useEffect, useState } from 'react';
import type { Project } from '../model/types';
import type { ProjectAction } from '../state/projectStore';

interface Props {
  project: Project;
  dispatch: React.Dispatch<ProjectAction>;
}

export function SongHeader({ project, dispatch }: Props) {
  // Keep the BPM field editable as free text; only valid numbers reach the project.
  const [bpmText, setBpmText] = useState(String(project.bpm));
  useEffect(() => setBpmText(String(project.bpm)), [project.bpm]);

  const commitBpm = () => {
    const bpm = Math.round(Number(bpmText) * 10) / 10;
    if (bpm >= 30 && bpm <= 300) dispatch({ type: 'setBpm', bpm });
    else setBpmText(String(project.bpm));
  };

  return (
    <div className="song-header">
      <label className="field grow">
        <span>Song name</span>
        <input
          className="song-name"
          value={project.name}
          onChange={(e) => dispatch({ type: 'setName', name: e.target.value })}
        />
      </label>
      <label className="field">
        <span>Tempo (BPM)</span>
        <input
          className="bpm"
          type="number"
          min={30}
          max={300}
          step={1}
          value={bpmText}
          onChange={(e) => setBpmText(e.target.value)}
          onBlur={commitBpm}
          onKeyDown={(e) => e.key === 'Enter' && commitBpm()}
        />
      </label>
    </div>
  );
}
