import { MemoryItem } from '../src/types.js';
import { INITIAL_MEMORIES } from '../src/data/initialData.js';

let memoriesStore: MemoryItem[] = JSON.parse(JSON.stringify(INITIAL_MEMORIES));

export function getMemories(): MemoryItem[] {
  return memoriesStore;
}

export function addMemory(item: Omit<MemoryItem, 'id' | 'createdAt'>): MemoryItem {
  const newMemory: MemoryItem = {
    ...item,
    id: `mem-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  memoriesStore.unshift(newMemory);
  return newMemory;
}

export function updateMemory(id: string, updates: Partial<MemoryItem>): MemoryItem | undefined {
  const idx = memoriesStore.findIndex(m => m.id === id);
  if (idx === -1) return undefined;
  memoriesStore[idx] = { ...memoriesStore[idx], ...updates };
  return memoriesStore[idx];
}

export function deleteMemory(id: string): boolean {
  const initial = memoriesStore.length;
  memoriesStore = memoriesStore.filter(m => m.id !== id);
  return memoriesStore.length < initial;
}

export function getActiveMemoryContext(): string {
  const enabled = memoriesStore.filter(m => m.enabled);
  if (enabled.length === 0) return '';
  return `User Long-Term Memory & Guidelines:\n` + enabled.map(m => `- [${m.type.toUpperCase()}] ${m.key}: ${m.value}`).join('\n');
}
