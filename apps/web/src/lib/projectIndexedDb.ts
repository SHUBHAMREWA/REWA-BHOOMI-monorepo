/**
 * IndexedDB Caching Engine for Projects, Map Layouts, and Plot Details.
 * Database: rewa_bhoomi_project_cache_db
 * Stores:
 *  - project_details: Keyed by project slug (Header & overview metadata)
 *  - project_maps: Keyed by project slug (Phases, MapObjects, Plot coordinates & status)
 *  - project_plots: Keyed by `${slug}_${plotId}` (Detailed plot specifications)
 *  - projects_list: Keyed by 'all_projects' (Compact project cards for listing)
 */

const DB_NAME = 'rewa_bhoomi_project_cache_db';
const DB_VERSION = 1;

const STORE_PROJECT_DETAILS = 'project_details';
const STORE_PROJECT_MAPS = 'project_maps';
const STORE_PROJECT_PLOTS = 'project_plots';
const STORE_PROJECTS_LIST = 'projects_list';

export interface CachedProjectMapRecord {
  slug: string;
  data: any;
  updatedAt: number;
}

export interface CachedProjectDetailsRecord {
  slug: string;
  data: any;
  updatedAt: number;
}

export interface CachedPlotRecord {
  key: string; // `${slug}_${plotId}`
  slug: string;
  plotId: string;
  data: any;
  updatedAt: number;
}

export interface CachedProjectsListRecord {
  key: string; // e.g. 'all_projects'
  data: any[];
  updatedAt: number;
}

/**
 * Check if current page load was triggered by user browser reload / hard refresh.
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
 * Open or upgrade the project IndexedDB database.
 */
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_PROJECT_DETAILS)) {
        db.createObjectStore(STORE_PROJECT_DETAILS, { keyPath: 'slug' });
      }
      if (!db.objectStoreNames.contains(STORE_PROJECT_MAPS)) {
        db.createObjectStore(STORE_PROJECT_MAPS, { keyPath: 'slug' });
      }
      if (!db.objectStoreNames.contains(STORE_PROJECT_PLOTS)) {
        db.createObjectStore(STORE_PROJECT_PLOTS, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORE_PROJECTS_LIST)) {
        db.createObjectStore(STORE_PROJECTS_LIST, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ─── PROJECT DETAILS (Metadata, developer, location, overview) ──────────────────

export async function getCachedProjectDetails(slug: string): Promise<any | null> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_PROJECT_DETAILS, 'readonly');
      const store = transaction.objectStore(STORE_PROJECT_DETAILS);
      const request = store.get(slug);

      request.onsuccess = () => {
        const record = request.result as CachedProjectDetailsRecord | undefined;
        resolve(record?.data || null);
      };
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('[IndexedDB] getCachedProjectDetails error:', err);
    return null;
  }
}

export async function setCachedProjectDetails(slug: string, data: any): Promise<void> {
  try {
    if (!slug || !data) return;
    const db = await openDb();
    const transaction = db.transaction(STORE_PROJECT_DETAILS, 'readwrite');
    const store = transaction.objectStore(STORE_PROJECT_DETAILS);
    const record: CachedProjectDetailsRecord = {
      slug,
      data,
      updatedAt: Date.now(),
    };
    store.put(record);
  } catch (err) {
    console.warn('[IndexedDB] setCachedProjectDetails error:', err);
  }
}

// ─── PROJECT MAPS (Phases, MapObjects, Plot layout coordinates) ──────────────────

export async function getCachedProjectMap(slug: string): Promise<any | null> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_PROJECT_MAPS, 'readonly');
      const store = transaction.objectStore(STORE_PROJECT_MAPS);
      const request = store.get(slug);

      request.onsuccess = () => {
        const record = request.result as CachedProjectMapRecord | undefined;
        resolve(record?.data || null);
      };
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('[IndexedDB] getCachedProjectMap error:', err);
    return null;
  }
}

export async function setCachedProjectMap(slug: string, data: any): Promise<void> {
  try {
    if (!slug || !data) return;
    const db = await openDb();
    const transaction = db.transaction([STORE_PROJECT_MAPS, STORE_PROJECT_PLOTS], 'readwrite');
    const mapStore = transaction.objectStore(STORE_PROJECT_MAPS);
    const plotStore = transaction.objectStore(STORE_PROJECT_PLOTS);

    const record: CachedProjectMapRecord = {
      slug,
      data,
      updatedAt: Date.now(),
    };
    mapStore.put(record);

    // Also populate individual plots store so clicking plots is instantaneous
    if (Array.isArray(data?.plots)) {
      for (const plot of data.plots) {
        if (plot?.id) {
          const plotRecord: CachedPlotRecord = {
            key: `${slug}_${plot.id}`,
            slug,
            plotId: String(plot.id),
            data: plot,
            updatedAt: Date.now(),
          };
          plotStore.put(plotRecord);
        }
      }
    }
  } catch (err) {
    console.warn('[IndexedDB] setCachedProjectMap error:', err);
  }
}

// ─── INDIVIDUAL PLOTS (Detailed specs, description, pricing) ───────────────────

export async function getCachedPlotDetails(slug: string, plotId: string): Promise<any | null> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_PROJECT_PLOTS, 'readonly');
      const store = transaction.objectStore(STORE_PROJECT_PLOTS);
      const request = store.get(`${slug}_${plotId}`);

      request.onsuccess = () => {
        const record = request.result as CachedPlotRecord | undefined;
        resolve(record?.data || null);
      };
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('[IndexedDB] getCachedPlotDetails error:', err);
    return null;
  }
}

export async function setCachedPlotDetails(slug: string, plotId: string, data: any): Promise<void> {
  try {
    if (!slug || !plotId || !data) return;
    const db = await openDb();
    const transaction = db.transaction(STORE_PROJECT_PLOTS, 'readwrite');
    const store = transaction.objectStore(STORE_PROJECT_PLOTS);
    const record: CachedPlotRecord = {
      key: `${slug}_${plotId}`,
      slug,
      plotId: String(plotId),
      data,
      updatedAt: Date.now(),
    };
    store.put(record);
  } catch (err) {
    console.warn('[IndexedDB] setCachedPlotDetails error:', err);
  }
}

// ─── PROJECTS LIST (Card summaries for instant list rendering) ─────────────────

export async function getCachedProjectsList(key: string = 'all_projects'): Promise<any[] | null> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_PROJECTS_LIST, 'readonly');
      const store = transaction.objectStore(STORE_PROJECTS_LIST);
      const request = store.get(key);

      request.onsuccess = () => {
        const record = request.result as CachedProjectsListRecord | undefined;
        resolve(record?.data || null);
      };
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('[IndexedDB] getCachedProjectsList error:', err);
    return null;
  }
}

export async function setCachedProjectsList(data: any[], key: string = 'all_projects'): Promise<void> {
  try {
    if (!Array.isArray(data)) return;
    const db = await openDb();
    const transaction = db.transaction([STORE_PROJECTS_LIST, STORE_PROJECT_DETAILS], 'readwrite');
    const listStore = transaction.objectStore(STORE_PROJECTS_LIST);
    const detailsStore = transaction.objectStore(STORE_PROJECT_DETAILS);

    const record: CachedProjectsListRecord = {
      key,
      data,
      updatedAt: Date.now(),
    };
    listStore.put(record);

    // Also pre-populate project_details for each card in the list
    for (const proj of data) {
      if (proj?.slug) {
        detailsStore.put({
          slug: proj.slug,
          data: proj,
          updatedAt: Date.now(),
        });
      }
    }
  } catch (err) {
    console.warn('[IndexedDB] setCachedProjectsList error:', err);
  }
}

// ─── CACHE CLEAR UTILITY ───────────────────────────────────────────────────────

export async function clearProjectCache(): Promise<void> {
  try {
    const db = await openDb();
    const transaction = db.transaction(
      [STORE_PROJECT_DETAILS, STORE_PROJECT_MAPS, STORE_PROJECT_PLOTS, STORE_PROJECTS_LIST],
      'readwrite'
    );
    transaction.objectStore(STORE_PROJECT_DETAILS).clear();
    transaction.objectStore(STORE_PROJECT_MAPS).clear();
    transaction.objectStore(STORE_PROJECT_PLOTS).clear();
    transaction.objectStore(STORE_PROJECTS_LIST).clear();
  } catch (err) {
    console.warn('[IndexedDB] clearProjectCache error:', err);
  }
}
