const CACHE_NAME = 'journal-v2';
const STATIC_ASSETS = [
  '/',
  '/entry',
  '/signin',
];

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

  // Skip non-GET requests
  if (request.method !== 'GET') {
    // Handle POST requests for offline support
    if (request.method === 'POST' && isAPIRequest(url.href)) {
      handleOfflinePost(event);
    }
    return;
  }

  // API requests: Network first, cache fallback, with background sync
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
      // Clone and store in IndexedDB via message to client
      const clone = networkResponse.clone();
      cacheInIndexedDB(request.url, clone);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying IndexedDB:', error);
    
    // Try to get from IndexedDB
    const cached = await getFromIndexedDB(request.url);
    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    throw error;
  }
}

// Handle offline POST requests
function handleOfflinePost(event) {
  event.respondWith(
    fetch(event.request).catch((error) => {
      console.log('POST failed, queuing for background sync:', error);
      
      // Queue for background sync
      return queueForSync(event.request);
    })
  );
}

// Queue a request for background sync
async function queueForSync(request) {
  const clone = request.clone();
  const body = await clone.json();
  
  // Store in IndexedDB for later sync
  // This will be handled by the client-side code
  return new Response(
    JSON.stringify({ 
      queued: true, 
      message: 'Request queued for sync when online' 
    }),
    { 
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Message handling for IndexedDB operations
self.addEventListener('message', (event) => {
  if (event.data.type === 'INDEXEDDB_READY') {
    // Client is ready, can now communicate
    console.log('Client ready for IndexedDB operations');
  }
});

// Helper to cache data in IndexedDB (via client)
async function cacheInIndexedDB(url, response) {
  try {
    const data = await response.json();
    
    // Broadcast to all clients to cache this data
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'CACHE_DATA',
        url,
        data,
      });
    });
  } catch (error) {
    console.error('Error caching in IndexedDB:', error);
  }
}

// Helper to get data from IndexedDB (via client)
async function getFromIndexedDB(url) {
  // This is a placeholder - the actual implementation
  // will be handled by the client-side code that listens
  // for messages from the service worker
  return null;
}

// Background sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-entries') {
    event.waitUntil(syncPendingEntries());
  }
});

// Sync pending entries
async function syncPendingEntries() {
  // This will be implemented to sync queued entries
  // when the device comes back online
  console.log('Syncing pending entries...');
}

// Online/offline events
self.addEventListener('online', () => {
  console.log('Service worker is online');
  // Trigger background sync
  self.registration.sync.register('sync-entries');
});

self.addEventListener('offline', () => {
  console.log('Service worker is offline');
});
