/**
 * Utility for managing optimistic UI updates
 * Allows immediate UI feedback before server confirmation
 */

interface OptimisticEntry {
  date: string;
  mood: string;
  isOptimistic?: boolean;
}

class OptimisticUpdates {
  private pendingUpdates: Map<string, OptimisticEntry> = new Map();
  private listeners: Set<() => void> = new Set();

  /**
   * Add a pending optimistic update
   */
  add(date: string, mood: string): void {
    this.pendingUpdates.set(date, {
      date,
      mood,
      isOptimistic: true,
    });
    this.notifyListeners();
  }

  /**
   * Remove a pending update (when server confirms)
   */
  remove(date: string): void {
    this.pendingUpdates.delete(date);
    this.notifyListeners();
  }

  /**
   * Get all pending optimistic updates
   */
  getAll(): OptimisticEntry[] {
    return Array.from(this.pendingUpdates.values());
  }

  /**
   * Check if a date has a pending optimistic update
   */
  has(date: string): boolean {
    return this.pendingUpdates.has(date);
  }

  /**
   * Get the optimistic mood for a specific date
   */
  getMood(date: string): string | undefined {
    return this.pendingUpdates.get(date)?.mood;
  }

  /**
   * Clear all pending updates
   */
  clear(): void {
    this.pendingUpdates.clear();
    this.notifyListeners();
  }

  /**
   * Subscribe to updates
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }
}

// Singleton instance
export const optimisticUpdates = new OptimisticUpdates();

/**
 * Helper to merge server entries with optimistic updates
 */
export function mergeWithOptimisticUpdates(
  serverEntries: Array<{ date: string; mood: string }>,
  optimisticEntries: OptimisticEntry[]
): Array<{ date: string; mood: string; isOptimistic?: boolean }> {
  const merged = new Map<string, { date: string; mood: string; isOptimistic?: boolean }>();

  // Add server entries first
  serverEntries.forEach((entry) => {
    merged.set(entry.date, entry);
  });

  // Override with optimistic updates
  optimisticEntries.forEach((entry) => {
    merged.set(entry.date, entry);
  });

  // Sort by date
  return Array.from(merged.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

/**
 * Store a pending mood update in sessionStorage for cross-page persistence
 */
export function storePendingMood(date: string, mood: string): void {
  if (typeof window === 'undefined') return;
  
  const pending = JSON.parse(sessionStorage.getItem('pendingMoods') || '{}');
  pending[date] = { mood, timestamp: Date.now() };
  sessionStorage.setItem('pendingMoods', JSON.stringify(pending));
}

/**
 * Get pending mood from sessionStorage
 */
export function getPendingMood(date: string): string | undefined {
  if (typeof window === 'undefined') return undefined;
  
  const pending = JSON.parse(sessionStorage.getItem('pendingMoods') || '{}');
  const entry = pending[date];
  
  // Only use if less than 5 minutes old
  if (entry && Date.now() - entry.timestamp < 5 * 60 * 1000) {
    return entry.mood;
  }
  
  return undefined;
}

/**
 * Clear pending mood from sessionStorage
 */
export function clearPendingMood(date: string): void {
  if (typeof window === 'undefined') return;
  
  const pending = JSON.parse(sessionStorage.getItem('pendingMoods') || '{}');
  delete pending[date];
  sessionStorage.setItem('pendingMoods', JSON.stringify(pending));
}
