import { useState, useCallback } from "react";

export interface HistoryEntry {
  id: string;
  timestamp: number;
  files: { name: string; size: number }[];
  targetFormat: string;
}

const STORAGE_KEY = "ac-history";
const MAX_ENTRIES = 20;

function load(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function save(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // storage full — ignore
  }
}

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>(load);

  const addEntry = useCallback(
    (files: { name: string; size: number }[], targetFormat: string) => {
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        files,
        targetFormat,
      };
      setEntries((prev) => {
        const next = [entry, ...prev].slice(0, MAX_ENTRIES);
        save(next);
        return next;
      });
    },
    []
  );

  const clearHistory = useCallback(() => {
    setEntries([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { entries, addEntry, clearHistory };
}
