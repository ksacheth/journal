import useSWR, { SWRConfiguration, mutate as globalMutate } from 'swr';
import { fetchClient } from './api';
import { 
  getMonthlyCache, 
  saveMonthlyCache, 
  getEntryOffline, 
  saveEntryOffline,
  isOnline,
} from './offlineStorage';

interface Entry {
  date: string;
  mood: string;
  title?: string;
  text?: string;
  tags?: string[];
  todos?: Array<{ id: string; text: string; completed: boolean }>;
}

interface MonthlyEntriesResponse {
  entries: Array<{ date: string; mood: string }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// Default SWR config with offline-first strategy
const defaultSWRConfig: SWRConfiguration = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 5000, // 5 seconds
  errorRetryCount: 3,
  shouldRetryOnError: true,
};

/**
 * Fetcher function for SWR that integrates with offline storage
 */
async function monthlyEntriesFetcher(
  year: number, 
  month: number
): Promise<MonthlyEntriesResponse> {
  const monthStr = String(month + 1).padStart(2, '0');
  
  try {
    // Try network first
    if (isOnline()) {
      const data = await fetchClient(`/api/entries/${year}-${monthStr}`);
      
      // Cache the result for offline use
      await saveMonthlyCache(year, month, data.entries || []);
      
      return data;
    }
  } catch (error) {
    console.warn('Network fetch failed, falling back to cache:', error);
  }

  // Fallback to offline cache
  const cached = await getMonthlyCache(year, month);
  if (cached) {
    return {
      entries: cached,
      pagination: { page: 1, limit: 31, total: cached.length },
    };
  }

  throw new Error('No data available offline');
}

/**
 * Fetcher for single entry
 */
async function entryFetcher(dateStr: string): Promise<Entry | null> {
  try {
    if (isOnline()) {
      const data = await fetchClient(`/api/entry/${dateStr}`);
      await saveEntryOffline(dateStr, data);
      return data;
    }
  } catch (error) {
    if (error instanceof Error && error.message?.includes('404')) {
      return null;
    }
    console.warn('Network fetch failed, falling back to cache:', error);
  }

  // Fallback to offline cache
  const cached = await getEntryOffline(dateStr);
  return cached || null;
}

/**
 * Hook for fetching monthly entries with SWR
 * Provides caching, revalidation, and offline support
 */
export function useMonthlyEntries(
  year: number | null, 
  month: number | null,
  config?: SWRConfiguration
) {
  const key = year !== null && month !== null 
    ? ['monthly-entries', year, month] 
    : null;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => monthlyEntriesFetcher(year!, month!),
    {
      ...defaultSWRConfig,
      ...config,
    }
  );

  return {
    entries: data?.entries || [],
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
    // Helper to optimistically update the cache
    optimisticUpdate: (newEntries: Array<{ date: string; mood: string }>) => {
      if (!key) return;
      
      // Optimistically update the SWR cache
      const optimisticData: MonthlyEntriesResponse = {
        entries: newEntries,
        pagination: data?.pagination || { page: 1, limit: 31, total: newEntries.length },
      };
      
      mutate(optimisticData, false);
      
      // Also update offline storage
      if (year !== null && month !== null) {
        saveMonthlyCache(year, month, newEntries);
      }
    },
  };
}

/**
 * Hook for fetching a single entry
 */
export function useEntry(dateStr: string | null, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    dateStr ? ['entry', dateStr] : null,
    () => entryFetcher(dateStr!),
    {
      ...defaultSWRConfig,
      ...config,
    }
  );

  return {
    entry: data,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Save an entry with optimistic update support
 */
export async function saveEntry(
  dateStr: string,
  entryData: {
    mood: string;
    text?: string;
    tags?: string[];
    todos?: Array<{ id: string; text: string; completed: boolean }>;
  }
): Promise<Entry> {
  // Optimistically update the entry cache
  const optimisticEntry: Entry = {
    date: dateStr,
    ...entryData,
  };
  
  const entryKey = ['entry', dateStr];
  await globalMutate(entryKey, optimisticEntry, false);
  
  // Save to offline storage
  await saveEntryOffline(dateStr, optimisticEntry);
  
  // Make the actual API request
  const result = await fetchClient(`/api/entry/${dateStr}`, {
    method: 'POST',
    body: JSON.stringify(entryData),
  });
  
  // Update cache with server response
  await globalMutate(entryKey, result, false);
  
  // Also update the monthly entries cache if it exists
  const [year, month] = dateStr.split('-').map(Number);
  const monthlyKey = ['monthly-entries', year, month - 1];
  
  await globalMutate(
    monthlyKey,
    async (currentData: MonthlyEntriesResponse | undefined) => {
      if (!currentData) return currentData;
      
      const existingIndex = currentData.entries.findIndex(e => e.date === dateStr);
      const newEntryItem = { date: dateStr, mood: entryData.mood };
      
      let newEntries;
      if (existingIndex >= 0) {
        // Update existing
        newEntries = [...currentData.entries];
        newEntries[existingIndex] = newEntryItem;
      } else {
        // Add new
        newEntries = [...currentData.entries, newEntryItem];
      }
      
      // Sort by date
      newEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      return {
        ...currentData,
        entries: newEntries,
      };
    },
    false
  );
  
  return result;
}

/**
 * Trigger a revalidation of monthly entries
 */
export function revalidateMonthlyEntries(year: number, month: number) {
  const key = ['monthly-entries', year, month];
  return globalMutate(key);
}
