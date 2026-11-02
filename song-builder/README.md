# Remote Band Club – Song Builder

A browser prototype for layering separately recorded parts (drums, bass,
guitar, keys, vocals…) into one song. Everything runs in the browser; no server.

## Run it

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
cd song-builder
npm install
npm run dev
```

Open the address it prints (usually http://localhost:5173) in Chrome, Safari
or Firefox on a desktop computer.

## Test audio

`npm run dev` creates five test recordings in `public/samples/` the first time
(or run `npm run make-samples` to recreate them). They are a short song at
**100 BPM**, chords C – Am – F – G:

| File | Notes |
| --- | --- |
| `1-drums.wav` | kick, snare, hi-hat |
| `2-bass.wav` | eighth-note bass |
| `3-guitar-37ms-late.wav` | strummed guitar, **deliberately 37 ms late** |
| `4-keys.wav` | soft piano chords |
| `5-vocals.wav` | "sung" melody from bar 4 |

Every file starts with a hand clap on beat 3 of bar 1, and the music starts at
bar 2. Click **Load demo tracks** in the app to add all five at once, or upload
them with **Choose files…** like real recordings.

## Progress

- [x] **Step 1 – Upload and synced playback**: song name and BPM, up to 8 tracks,
      waveforms on a shared timeline, play / pause / stop / seek, zoom
- [ ] Step 2 – Mixing: volume, mute, solo
- [ ] Step 3 – Timing alignment: drag, ±10 / ±1 ms, offset in ms
- [ ] Step 4 – Click track with count-in
- [ ] Step 5 – Export mix to WAV
- [ ] Step 6 – Save and reopen projects (IndexedDB)

### How to test step 1

1. Click **Load demo tracks**. Five coloured waveforms appear.
2. Press **Play** (or the space bar). All five play together and the red
   playhead moves. The clock shows time plus bar and beat.
3. **Pause** and **Play** again: it continues where it stopped. **Stop** goes
   back to the start.
4. Click or drag in the ruler (the bar numbers at the top), or click in a
   track lane, to jump. This also works while playing.
5. Zoom with **+ / − / Fit**, or Ctrl/Cmd + scroll. Scroll sideways with a
   trackpad, Shift + scroll, or the bar below the tracks. Zoom far in around
   0:01.2 (the clap) and you can see the guitar is a little late.
6. Rename a track by clicking its name. Remove it with ×.
7. Drop your own WAV / MP3 / M4A files on the dashed box at the bottom.

## How it works

- **Sync**: all tracks play through one Web Audio `AudioContext`. On play, every
  track is started against the same moment on its clock, so they are
  sample-accurate. Seeking restarts every track against that clock again.
- **Waveforms** are drawn on canvases from the decoded audio (no waveform
  library), only for the visible part, so zooming in to single milliseconds is fast.
- **Offset**: a positive offset moves a track later; a negative one cuts the
  start of the recording.

```
src/
  model/types.ts          Project and Track data (plain JSON, no audio)
  audio/engine.ts         playback engine: shared clock, sources, gain
  audio/peaks.ts          waveform data
  storage/repository.ts   storage interfaces (AudioStore, ProjectRepository)
  storage/memory.ts       in-memory audio store (until step 6)
  state/projectStore.ts   project state and actions
  state/useTrackAudio.ts  loading / decoding audio, keeping the engine in step
  components/             UI: SongHeader, Transport, Timeline, Ruler, Waveform…
scripts/make-samples.mjs  generates the test recordings
```

Storage goes through the interfaces in `storage/repository.ts`, so a later
server version (accounts, sharing, cloud files) can replace the browser storage
without changing the UI.
