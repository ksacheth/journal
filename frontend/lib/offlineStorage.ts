import { openDB, DBSchema, IDBPDatabase } from 'idb';

const DB_NAME = 'journal-offline';
const DB_VERSION = 1;

interface JournalDB extends DBSchema {
  entries: {
    key: string;
    value: {
      date: string;
      mood: string;
      title?: string;
      text?: string;
      tags?: string[];
      todos?: Array<{ id: string; text: string; completed: boolean }>;
      updatedAt: number;
    };
    indexes: {
      'by-date': string;
    };
  };
  monthlyCache: {
    key: string;
    value: {
      monthKey: string;
      entries: Array<{ date: string; mood: string }>;
      timestamp: number;
    };
    indexes: {
      'by-timestamp': number;
    };
  };
  pendingSync: {
    key: string;
    value: {
      date: string;
      entry: unknown;
      operation: 'create' | 'update';
      timestamp: number;
    };
    indexes: {
      'by-timestamp': number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<JournalDB>> | null = null;

function getDB(): Promise<IDBPDatabase<JournalDB>> {
  if (!dbPromise) {
    dbPromise = openDB<JournalDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Entries store
        if (!db.objectStoreNames.contains('entries')) {
          const entriesStore = db.createObjectStore('entries', { keyPath: 'date' });
          entriesStore.createIndex('by-date', 'date');
        }

        // Monthly cache store
        if (!db.objectStoreNames.contains('monthlyCache')) {
          const monthlyStore = db.createObjectStore('monthlyCache', { keyPath: 'monthKey' });
          monthlyStore.createIndex('by-timestamp', 'timestamp');
        }

        // Pending sync store for offline writes
        if (!db.objectStoreNames.contains('pendingSync')) {
          const pendingStore = db.createObjectStore('pendingSync', { keyPath: 'date' });
          pendingStore.createIndex('by-timestamp', 'timestamp');
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Save an entry to IndexedDB for offline access
 */
export async function saveEntryOffline(date: string, entry: unknown): Promise<void> {
  const db = await getDB();
  await db.put('entries', {
    date,
    ...(entry as object),
    updatedAt: Date.now(),
  } as JournalDB['entries']['value']);
}

/**
 * Get an entry from IndexedDB (offline)
 */
export async function getEntryOffline(date: string): Promise<JournalDB['entries']['value'] | undefined> {
  const db = await getDB();
  return db.get('entries', date);
}

/**
 * Save monthly entries cache to IndexedDB
 */
export async function saveMonthlyCache(
  year: number,
  month: number,
  entries: Array<{ date: string; mood: string }>
): Promise<void> {
  const db = await getDB();
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  await db.put('monthlyCache', {
    monthKey,
    entries,
    timestamp: Date.now(),
  });
}

/**
 * Get monthly entries from IndexedDB cache
 */
export async function getMonthlyCache(
  year: number,
  month: number
): Promise<Array<{ date: string; mood: string }> | undefined> {
  const db = await getDB();
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const cached = await db.get('monthlyCache', monthKey);
  return cached?.entries;
}

/**
 * Queue an entry for sync when back online
 */
export async function queuePendingSync(
  date: string,
  entry: unknown,
  operation: 'create' | 'update' = 'update'
): Promise<void> {
  const db = await getDB();
  await db.put('pendingSync', {
    date,
    entry,
    operation,
    timestamp: Date.now(),
  });
}

/**
 * Get all pending sync items
 */
export async function getPendingSync(): Promise<JournalDB['pendingSync']['value'][]> {
  const db = await getDB();
  return db.getAll('pendingSync');
}

/**
 * Remove a pending sync item
 */
export async function removePendingSync(date: string): Promise<void> {
  const db = await getDB();
  await db.delete('pendingSync', date);
}

/**
 * Clear all data (useful for logout)
 */
export async function clearOfflineData(): Promise<void> {
  const db = await getDB();
  await Promise.all([
    db.clear('entries'),
    db.clear('monthlyCache'),
    db.clear('pendingSync'),
  ]);
}

/**
 * Check if we're online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}
