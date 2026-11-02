import { useReducer } from 'react';
import { MAX_TRACKS, createProject, type Project, type Track } from '../model/types';

export type ProjectAction =
  | { type: 'load'; project: Project }
  | { type: 'setName'; name: string }
  | { type: 'setBpm'; bpm: number }
  | { type: 'addTrack'; track: Track }
  | { type: 'removeTrack'; id: string }
  | { type: 'updateTrack'; id: string; changes: Partial<Omit<Track, 'id'>> };

function reducer(state: Project, action: ProjectAction): Project {
  const next = apply(state, action);
  return next === state || action.type === 'load' ? next : { ...next, updatedAt: new Date().toISOString() };
}

function apply(state: Project, action: ProjectAction): Project {
  switch (action.type) {
    case 'load':
      return action.project;
    case 'setName':
      return { ...state, name: action.name };
    case 'setBpm':
      return { ...state, bpm: action.bpm };
    case 'addTrack':
      if (state.tracks.length >= MAX_TRACKS) return state;
      return { ...state, tracks: [...state.tracks, action.track] };
    case 'removeTrack':
      return { ...state, tracks: state.tracks.filter((t) => t.id !== action.id) };
    case 'updateTrack':
      return {
        ...state,
        tracks: state.tracks.map((t) => (t.id === action.id ? { ...t, ...action.changes } : t)),
      };
  }
}

export function useProjectStore() {
  return useReducer(reducer, undefined, () => createProject());
}
