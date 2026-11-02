// Keeps decoded audio + waveform data for every track, loading missing files
// from the audio store, and keeps the playback engine in step with the project.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AudioEngine } from '../audio/engine';
import { computePeaks, type Peaks } from '../audio/peaks';
import { isAudible, type Track } from '../model/types';
import type { AudioStore } from '../storage/repository';

export type LoadedAudio =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; buffer: AudioBuffer; peaks: Peaks };

export function useTrackAudio(engine: AudioEngine, store: AudioStore, tracks: Track[]) {
  const [audio, setAudio] = useState<Record<string, LoadedAudio>>({});
  const requested = useRef(new Set<string>());

  const set = (audioId: string, value: LoadedAudio) => setAudio((prev) => ({ ...prev, [audioId]: value }));

  /** Decode a file; throws a friendly error if the browser can't read it. */
  const decode = useCallback(
    async (blob: Blob) => {
      try {
        const buffer = await engine.decode(await blob.arrayBuffer());
        return { status: 'ready', buffer, peaks: computePeaks(buffer) } as const;
      } catch {
        throw new Error('This browser could not read the audio file. Try WAV or MP3.');
      }
    },
    [engine],
  );

  /** Store and decode a new file. Returns the audio id. */
  const addFile = useCallback(
    async (file: Blob): Promise<string> => {
      const loaded = await decode(file);
      const audioId = await store.put(file);
      requested.current.add(audioId);
      set(audioId, loaded);
      return audioId;
    },
    [decode, store],
  );

  // Load audio for tracks we don't have yet (e.g. after reopening a project).
  useEffect(() => {
    for (const { audioId } of tracks) {
      if (requested.current.has(audioId)) continue;
      requested.current.add(audioId);
      set(audioId, { status: 'loading' });
      store
        .get(audioId)
        .then((blob) => {
          if (!blob) throw new Error('The audio file for this track is missing.');
          return decode(blob);
        })
        .then((loaded) => set(audioId, loaded))
        .catch((e: Error) => set(audioId, { status: 'error', message: e.message }));
    }
  }, [tracks, store, decode]);

  // Push tracks + mix settings to the engine.
  useEffect(() => {
    engine.setTracks(
      tracks.flatMap((t) => {
        const a = audio[t.audioId];
        if (a?.status !== 'ready') return [];
        return [{ id: t.id, buffer: a.buffer, offsetSec: t.offsetMs / 1000, gain: isAudible(t, tracks) ? t.volume : 0 }];
      }),
    );
  }, [engine, tracks, audio]);

  return { audio, addFile };
}
