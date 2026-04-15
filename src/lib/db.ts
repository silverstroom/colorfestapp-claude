import { Strategy } from './types';

const STORAGE_KEY = 'sp_strategies';

function isClient(): boolean {
  return typeof window !== 'undefined';
}

function readAll(): Strategy[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Strategy[];
  } catch {
    return [];
  }
}

function writeAll(strategies: Strategy[]): void {
  if (!isClient()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(strategies));
}

export function getAllStrategies(): Strategy[] {
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getStrategy(id: string): Strategy | undefined {
  return readAll().find(s => s.id === id);
}

export function saveStrategy(strategy: Strategy): void {
  const all = readAll();
  strategy.updatedAt = new Date().toISOString();
  const idx = all.findIndex(s => s.id === strategy.id);
  if (idx >= 0) {
    all[idx] = strategy;
  } else {
    all.push(strategy);
  }
  writeAll(all);
}

export function deleteStrategy(id: string): void {
  const all = readAll().filter(s => s.id !== id);
  writeAll(all);
}

export function duplicateStrategy(id: string, newName: string): string | null {
  const original = readAll().find(s => s.id === id);
  if (!original) return null;
  const newId = generateId();
  const copy: Strategy = {
    ...original,
    id: newId,
    name: newName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sections: original.sections.map(s => ({ ...s, id: generateId() })),
  };
  const all = readAll();
  all.push(copy);
  writeAll(all);
  return newId;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}
