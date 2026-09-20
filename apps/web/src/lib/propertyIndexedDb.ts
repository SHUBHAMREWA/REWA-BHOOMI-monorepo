import { PropertyCardData } from '@/features/properties/PropertyCard';

const DB_NAME = 'rewa_bhoomi_cache_db';
const DB_VERSION = 1;
const STORE_QUERIES = 'queries';
const STORE_PROPERTIES = 'properties';

export interface CachedQueryResult {
  key: string;
  data: PropertyCardData[];
  hasMore: boolean;
  cursor: string | null;
  updatedAt: number;
}

/**
 * Check if current page load was triggered by a user reload / hard refresh.
 */
export function isHardRefreshOrReload(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries && navEntries.length > 0) {
      const nav = navEntries[0] as PerformanceNavigationTiming;
      return nav.type === 'reload';
    }
    return (performance as unknown as { navigation?: { type?: number } })?.navigation?.type === 1;
  } catch {
    return false;
  }
}

/**
 * Open or upgrade the IndexedDB database.
 */
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_QUERIES)) {
        db.createObjectStore(STORE_QUERIES, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORE_PROPERTIES)) {
        db.createObjectStore(STORE_PROPERTIES, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get cached query result from IndexedDB.
 */
export async function getCachedQuery(key: string): Promise<CachedQueryResult | null> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_QUERIES, 'readonly');
      const store = transaction.objectStore(STORE_QUERIES);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] getCachedQuery error:', err);
    return null;
  }
}

/**
 * Save query result and individual properties into IndexedDB.
 */
export async function setCachedQuery(
  key: string,
  data: PropertyCardData[],
  hasMore: boolean,
  cursor: string | null
): Promise<void> {
  try {
    const db = await openDb();
    const now = Date.now();

    const transaction = db.transaction([STORE_QUERIES, STORE_PROPERTIES], 'readwrite');
    const queryStore = transaction.objectStore(STORE_QUERIES);
    const propStore = transaction.objectStore(STORE_PROPERTIES);

    const record: CachedQueryResult = {
      key,
      data,
      hasMore,
      cursor,
      updatedAt: now,
    };
    queryStore.put(record);

    for (const prop of data) {
      if (prop?.id) {
        propStore.put({ ...prop, updatedAt: now });
      }
    }

    return new Promise((resolve) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('[IndexedDB] setCachedQuery error:', err);
  }
}

/**
 * Clear property caches from IndexedDB.
 */
export async function clearPropertyCache(): Promise<void> {
  try {
    const db = await openDb();
    const transaction = db.transaction([STORE_QUERIES, STORE_PROPERTIES], 'readwrite');
    transaction.objectStore(STORE_QUERIES).clear();
    transaction.objectStore(STORE_PROPERTIES).clear();
    return new Promise((resolve) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('[IndexedDB] clearPropertyCache error:', err);
  }
}
