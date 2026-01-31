const CACHE_NAME = 'journal-v2';
const STATIC_ASSETS = [
  '/',
  '/entry',
  '/signin',
];

// Open IndexedDB for API caching
const DB_NAME = 'journal-sw-cache';
const DB_VERSION = 1;

async function openSWDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('api-cache')) {
        db.createObjectStore('api-cache', { keyPath: 'url' });
      }
      if (!db.objectStoreNames.contains('pending-posts')) {
        const store = db.createObjectStore('pending-posts', { keyPath: 'id', autoIncrement: true });
        store.createIndex('by-timestamp', 'timestamp');
      }
    };
  });
}

// Store API response in IndexedDB
async function cacheAPIResponse(url, data) {
  try {
    const db = await openSWDB();
    const transaction = db.transaction('api-cache', 'readwrite');
    const store = transaction.objectStore('api-cache');
    await store.put({ url, data, timestamp: Date.now() });
  } catch (error) {
    console.error('Failed to cache API response:', error);
  }
}

// Get cached API response from IndexedDB
async function getCachedAPIResponse(url) {
  try {
    const db = await openSWDB();
    const transaction = db.transaction('api-cache', 'readonly');
    const store = transaction.objectStore('api-cache');
    const request = store.get(url);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result?.data || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get cached API response:', error);
    return null;
  }
}

// Store pending POST for background sync
async function queuePendingPost(url, method, body, headers) {
  try {
    const db = await openSWDB();
    const transaction = db.transaction('pending-posts', 'readwrite');
    const store = transaction.objectStore('pending-posts');
    await store.put({
      url,
      method,
      body,
      headers: Object.fromEntries(headers.entries()),
      timestamp: Date.now(),
    });
    
    // Register for background sync
    if (self.registration.sync) {
      await self.registration.sync.register('sync-entries');
    }
    
    return { queued: true, message: 'Request queued for sync when online' };
  } catch (error) {
    console.error('Failed to queue pending post:', error);
    throw error;
  }
}

// Get all pending posts
async function getPendingPosts() {
  try {
    const db = await openSWDB();
    const transaction = db.transaction('pending-posts', 'readonly');
    const store = transaction.objectStore('pending-posts');
    const index = store.index('by-timestamp');
    const request = index.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get pending posts:', error);
    return [];
  }
}

// Remove a pending post
async function removePendingPost(id) {
  try {
    const db = await openSWDB();
    const transaction = db.transaction('pending-posts', 'readwrite');
    const store = transaction.objectStore('pending-posts');
    await store.delete(id);
  } catch (error) {
    console.error('Failed to remove pending post:', error);
  }
}

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return clients.claim();
    })
  );
});

// Helper to check if request is for API
function isAPIRequest(url) {
  return url.includes('/api/');
}

// Helper to check if request is for a page navigation
function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

// Fetch event - sophisticated caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (except POSTs which we handle specially)
  if (request.method !== 'GET' && request.method !== 'POST') {
    return;
  }

  // Handle POST requests for offline support
  if (request.method === 'POST' && isAPIRequest(url.href)) {
    event.respondWith(handleOfflinePost(request));
    return;
  }

  // Skip non-GET for the rest
  if (request.method !== 'GET') {
    return;
  }

  // API requests: Network first, cache fallback
  if (isAPIRequest(url.href)) {
    event.respondWith(handleAPIRequest(request));
    return;
  }

  // Navigation requests: Cache first, network fallback
  if (isNavigationRequest(request)) {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request).then((fetchResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      }).catch(() => {
        // Fallback to cached index page if offline
        return caches.match('/');
      })
    );
    return;
  }

  // Static assets: Cache first, network fallback
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request).then((fetchResponse) => {
        // Cache successful responses
        if (fetchResponse.ok) {
          const clone = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
        }
        return fetchResponse;
      });
    })
  );
});

// Handle API requests with IndexedDB integration
async function handleAPIRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone and store in IndexedDB
      const clone = networkResponse.clone();
      const data = await clone.json();
      await cacheAPIResponse(request.url, data);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying IndexedDB:', error);
    
    // Try to get from IndexedDB
    const cached = await getCachedAPIResponse(request.url);
    if (cached) {
      console.log('Serving from IndexedDB cache:', request.url);
      return new Response(JSON.stringify(cached), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // No cached data available
    return new Response(
      JSON.stringify({ error: 'Network error and no cached data available' }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle offline POST requests
async function handleOfflinePost(request) {
  try {
    // Try network first
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log('POST failed, queuing for background sync:', error);
    
    // Clone request to read body
    const clone = request.clone();
    const body = await clone.json();
    
    // Queue for background sync
    const queued = await queuePendingPost(request.url, request.method, body, request.headers);
    
    return new Response(
      JSON.stringify(queued),
      { 
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Background sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-entries') {
    event.waitUntil(syncPendingEntries());
  }
});

// Sync pending entries
async function syncPendingEntries() {
  console.log('Syncing pending entries...');
  
  const pendingPosts = await getPendingPosts();
  console.log(`Found ${pendingPosts.length} pending posts to sync`);
  
  for (const post of pendingPosts) {
    try {
      const response = await fetch(post.url, {
        method: post.method,
        headers: {
          'Content-Type': 'application/json',
          ...post.headers,
        },
        body: JSON.stringify(post.body),
      });
      
      if (response.ok) {
        console.log('Successfully synced post:', post.url);
        await removePendingPost(post.id);
      } else {
        console.error('Failed to sync post:', post.url, response.status);
      }
    } catch (error) {
      console.error('Error syncing post:', post.url, error);
    }
  }
}

// Message handling for client communication
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Online/offline events
self.addEventListener('online', () => {
  console.log('Service worker is online');
  // Trigger background sync
  if (self.registration.sync) {
    self.registration.sync.register('sync-entries');
  }
});

self.addEventListener('offline', () => {
  console.log('Service worker is offline');
});
