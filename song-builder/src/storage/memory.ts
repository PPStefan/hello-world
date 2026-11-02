// In-memory audio store, used until saving to the browser is added.

import { newId } from '../model/types';
import type { AudioStore } from './repository';

export class MemoryAudioStore implements AudioStore {
  private files = new Map<string, Blob>();

  async put(file: Blob): Promise<string> {
    const id = newId();
    this.files.set(id, file);
    return id;
  }

  async get(id: string): Promise<Blob | undefined> {
    return this.files.get(id);
  }

  async delete(id: string): Promise<void> {
    this.files.delete(id);
  }
}
