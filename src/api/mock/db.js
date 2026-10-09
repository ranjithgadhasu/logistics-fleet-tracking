import { createSeed } from "./seed";

const STORAGE_KEY = "fleetops.db.v1";

function persist(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* storage might be full or disabled – the app still works in memory */
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* corrupted storage – fall through to a fresh seed */
  }
  const seed = createSeed();
  persist(seed);
  return seed;
}

let db = load();

export const getDb = () => db;
export const commit = () => persist(db);
export function resetDb() {
  db = createSeed();
  persist(db);
}
