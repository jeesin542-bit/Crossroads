import { DecideResponse, DecisionInput } from "./schemas";

export interface SavedDeliberation {
  id: string;
  savedAt: string; // ISO timestamp
  input: DecisionInput;
  result: DecideResponse;
}

const STORAGE_KEY = "crossroads:saved:v1";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadSaved(): SavedDeliberation[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SavedDeliberation[];
  } catch {
    return [];
  }
}

export function saveDeliberation(input: DecisionInput, result: DecideResponse): SavedDeliberation {
  const entry: SavedDeliberation = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    savedAt: new Date().toISOString(),
    input,
    result,
  };
  if (isBrowser()) {
    try {
      const existing = loadSaved();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...existing]));
    } catch {
      // storage full or unavailable — the entry is still returned for this session
    }
  }
  return entry;
}

export function deleteDeliberation(id: string): SavedDeliberation[] {
  if (!isBrowser()) return [];
  const remaining = loadSaved().filter((s) => s.id !== id);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  } catch {
    // ignore
  }
  return remaining;
}
