// Multitrack playback on one Web Audio clock.
//
// All tracks are started against the same AudioContext time, so they stay
// sample-accurate in sync. Any jump (seek, offset change) stops the affected
// sources and restarts them against that same clock.

export interface EngineTrack {
  id: string;
  buffer: AudioBuffer;
  /** Where the recording starts on the song timeline, in seconds (may be negative). */
  offsetSec: number;
  /** Final linear gain, mute/solo already applied. */
  gain: number;
}

interface Voice {
  track: EngineTrack;
  gainNode: GainNode;
  source?: AudioBufferSourceNode;
}

const START_DELAY = 0.1; // seconds between pressing play and the first sample

export class AudioEngine {
  readonly ctx: AudioContext;
  private master: GainNode;
  private voices = new Map<string, Voice>();
  private listeners = new Set<() => void>();

  private playing = false;
  /** While playing: the context time at which timeline position `startPos` sounds. */
  private startCtxTime = 0;
  private startPos = 0;
  /** While stopped/paused: the playhead position. */
  private pausedPos = 0;
  private endTimer?: number;

  constructor() {
    this.ctx = new AudioContext({ latencyHint: 'interactive' });
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
  }

  decode(data: ArrayBuffer): Promise<AudioBuffer> {
    return this.ctx.decodeAudioData(data);
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  get isPlaying(): boolean {
    return this.playing;
  }

  /** End of the last track on the timeline, in seconds. */
  get duration(): number {
    let end = 0;
    for (const { track } of this.voices.values()) end = Math.max(end, track.offsetSec + track.buffer.duration);
    return end;
  }

  /** Current playhead position on the song timeline, in seconds (what you hear now). */
  get position(): number {
    if (!this.playing) return this.pausedPos;
    const latency = this.ctx.outputLatency || 0;
    return Math.max(this.startPos, this.timelineAt(this.ctx.currentTime - latency));
  }

  private timelineAt(ctxTime: number): number {
    return this.startPos + (ctxTime - this.startCtxTime);
  }

  /** Add, update or remove tracks. Safe to call while playing. */
  setTracks(tracks: EngineTrack[]) {
    const ids = new Set(tracks.map((t) => t.id));
    for (const [id, voice] of this.voices) {
      if (!ids.has(id)) {
        this.stopVoice(voice);
        voice.gainNode.disconnect();
        this.voices.delete(id);
      }
    }
    for (const track of tracks) {
      let voice = this.voices.get(track.id);
      if (!voice) {
        const gainNode = this.ctx.createGain();
        gainNode.gain.value = track.gain;
        gainNode.connect(this.master);
        voice = { track, gainNode };
        this.voices.set(track.id, voice);
        if (this.playing) this.restartVoice(voice);
        continue;
      }
      const moved = voice.track.buffer !== track.buffer || voice.track.offsetSec !== track.offsetSec;
      if (voice.track.gain !== track.gain) {
        voice.gainNode.gain.setTargetAtTime(track.gain, this.ctx.currentTime, 0.01);
      }
      voice.track = track;
      if (moved && this.playing) this.restartVoice(voice);
    }
  }

  async play() {
    if (this.playing) return;
    await this.ctx.resume();
    let from = this.pausedPos;
    if (from >= this.duration) from = 0;
    this.startAll(from);
    this.playing = true;
    this.watchForEnd();
    this.emit();
  }

  pause() {
    if (!this.playing) return;
    this.pausedPos = Math.min(this.position, this.duration);
    this.halt();
  }

  stop() {
    this.pausedPos = 0;
    if (this.playing) this.halt();
    else this.emit();
  }

  seek(seconds: number) {
    const t = Math.max(0, Math.min(seconds, this.duration));
    if (this.playing) {
      this.voices.forEach((v) => this.stopVoice(v));
      this.startAll(t);
    } else {
      this.pausedPos = t;
    }
    this.emit();
  }

  private startAll(from: number) {
    this.startPos = from;
    this.startCtxTime = this.ctx.currentTime + START_DELAY;
    this.voices.forEach((v) => this.schedule(v, this.startCtxTime, from));
  }

  private halt() {
    this.voices.forEach((v) => this.stopVoice(v));
    this.playing = false;
    clearInterval(this.endTimer);
    this.emit();
  }

  /** Restart one track mid-playback, locked to the shared clock. */
  private restartVoice(voice: Voice) {
    this.stopVoice(voice);
    const when = Math.max(this.ctx.currentTime + 0.03, this.startCtxTime);
    this.schedule(voice, when, this.timelineAt(when));
  }

  /** Start `voice` so that timeline position `timelinePos` sounds at context time `when`. */
  private schedule(voice: Voice, when: number, timelinePos: number) {
    const { buffer, offsetSec } = voice.track;
    let offsetInBuffer = timelinePos - offsetSec;
    if (offsetInBuffer < 0) {
      // the recording starts later on the timeline: wait for it
      when -= offsetInBuffer;
      offsetInBuffer = 0;
    }
    if (offsetInBuffer >= buffer.duration) return;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(voice.gainNode);
    source.start(when, offsetInBuffer);
    voice.source = source;
  }

  private stopVoice(voice: Voice) {
    if (!voice.source) return;
    try {
      voice.source.stop();
    } catch {
      /* already stopped */
    }
    voice.source.disconnect();
    voice.source = undefined;
  }

  private watchForEnd() {
    clearInterval(this.endTimer);
    this.endTimer = window.setInterval(() => {
      if (this.playing && this.position >= this.duration) this.stop();
    }, 50);
  }
}
