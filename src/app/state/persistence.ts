import { openDB, type IDBPDatabase } from "idb";
import { careerGraphSchema, type CareerGraph } from "../../domain/index.js";

const DB_NAME = "skill-tree";
const DB_VERSION = 1;
const STORE_NAME = "careerGraphs";
const CURRENT_KEY = "current";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Loads the persisted graph, defensively re-validated against the
 * current domain schema (data saved under an older schema version could
 * otherwise be silently treated as trustworthy). An invalid record is
 * treated the same as "nothing saved yet" rather than crashing the app.
 */
export async function loadPersistedGraph(): Promise<CareerGraph | null> {
  const db = await getDb();
  const value = await db.get(STORE_NAME, CURRENT_KEY);
  if (value === undefined) return null;
  const result = careerGraphSchema.safeParse(value);
  return result.success ? result.data : null;
}

export async function savePersistedGraph(graph: CareerGraph): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAME, graph, CURRENT_KEY);
}

export async function clearPersistedGraph(): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_NAME, CURRENT_KEY);
}
