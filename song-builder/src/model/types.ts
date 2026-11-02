// Plain, serializable project data. No audio data or browser objects live here,
// so the same shapes can later be sent to / loaded from a server API.

export const MAX_TRACKS = 8;
export const SCHEMA_VERSION = 1;

export interface Track {
  id: string;
  /** e.g. "Drums – Anna" */
  name: string;
  /** Reference to the stored audio file (see storage/). */
  audioId: string;
  fileName: string;
  /** Linear gain, 0 … 1.5 (1 = unchanged). */
  volume: number;
  muted: boolean;
  solo: boolean;
  /** Positive = track starts later, negative = start of the recording is cut. */
  offsetMs: number;
}

export interface Project {
  schemaVersion: number;
  id: string;
  name: string;
  bpm: number;
  beatsPerBar: number;
  tracks: Track[];
  createdAt: string;
  updatedAt: string;
}

export function newId(): string {
  return crypto.randomUUID();
}

export function createProject(name = 'Untitled song', bpm = 100): Project {
  const now = new Date().toISOString();
  return {
    schemaVersion: SCHEMA_VERSION,
    id: newId(),
    name,
    bpm,
    beatsPerBar: 4,
    tracks: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createTrack(name: string, audioId: string, fileName: string): Track {
  return { id: newId(), name, audioId, fileName, volume: 1, muted: false, solo: false, offsetMs: 0 };
}

/** Whether a track should be heard, taking mute and solo of all tracks into account. */
export function isAudible(track: Track, tracks: Track[]): boolean {
  if (track.muted) return false;
  const anySolo = tracks.some((t) => t.solo);
  return !anySolo || track.solo;
}
