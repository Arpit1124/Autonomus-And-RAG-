import { GeneratedFile } from '../src/types.js';
import { getDynamicSeedFiles } from '../src/data/seedFiles.js';

let filesStore: GeneratedFile[] = getDynamicSeedFiles();

export function getGeneratedFiles(): GeneratedFile[] {
  if (filesStore.length === 0) {
    filesStore = getDynamicSeedFiles();
  }
  return filesStore;
}

export function refreshDailyFiles(date: Date = new Date()): GeneratedFile[] {
  filesStore = getDynamicSeedFiles(date);
  return filesStore;
}

export function getFileById(id: string): GeneratedFile | undefined {
  return filesStore.find(f => f.id === id);
}

export function saveGeneratedFile(file: Omit<GeneratedFile, 'id' | 'createdAt'>): GeneratedFile {
  const newFile: GeneratedFile = {
    ...file,
    id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString()
  };
  filesStore.unshift(newFile);
  return newFile;
}

export function deleteGeneratedFile(id: string): boolean {
  const initial = filesStore.length;
  filesStore = filesStore.filter(f => f.id !== id);
  return filesStore.length < initial;
}

