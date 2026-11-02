// Storage interfaces. The app only talks to these, so the browser-only
// implementation can later be swapped for one backed by a server
// (e.g. REST API + cloud file storage) without changing the UI.

import type { Project } from '../model/types';

/** Stores the raw audio files, addressed by id. */
export interface AudioStore {
  put(file: Blob): Promise<string>;
  get(id: string): Promise<Blob | undefined>;
  delete(id: string): Promise<void>;
}

export interface ProjectSummary {
  id: string;
  name: string;
  bpm: number;
  trackCount: number;
  updatedAt: string;
}

/** Stores project settings (names, tempo, mix, offsets) – no audio. */
export interface ProjectRepository {
  list(): Promise<ProjectSummary[]>;
  get(id: string): Promise<Project | undefined>;
  save(project: Project): Promise<void>;
  delete(id: string): Promise<void>;
}
