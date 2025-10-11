// Service Worker for Restaurant Management PWA
// Version: 1.0.0
// Provides offline support and caching strategies

const CACHE_VERSION = 'v1.0.0'
const STATIC_CACHE = `static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`
const IMAGE_CACHE = `images-${CACHE_VERSION}`

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...', CACHE_VERSION)
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...', CACHE_VERSION)
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old versions
              return cacheName.startsWith('static-') ||
                     cacheName.startsWith('dynamic-') ||
                     cacheName.startsWith('images-')
            })
            .filter((cacheName) => {
              return cacheName !== STATIC_CACHE &&
                     cacheName !== DYNAMIC_CACHE &&
                     cacheName !== IMAGE_CACHE
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            })
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other schemes
  if (!url.protocol.startsWith('http')) {
    return
  }

  // API requests - Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request))
    return
  }

  // Images - Cache first with stale-while-revalidate
  if (request.destination === 'image') {
    event.respondWith(cacheFirstRevalidate(request, IMAGE_CACHE))
    return
  }

  // Static assets - Cache first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(js|css|woff2?)$/)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // HTML pages - Network first with offline fallback
  if (request.destination === 'document' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithOffline(request))
    return
  }

  // Default - Network first
  event.respondWith(networkFirst(request))
})

// Strategy: Network first, fallback to cache
async function networkFirst(request) {
  try {
    const response = await fetch(request)
    
    // Cache successful responses
    if (response && response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url)
    const cached = await caches.match(request)
    
    if (cached) {
      return cached
    }
    
    throw error
  }
}

// Strategy: Network first with offline page fallback
async function networkFirstWithOffline(request) {
  try {
    const response = await fetch(request)
    
    if (response && response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url)
    const cached = await caches.match(request)
    
    if (cached) {
      return cached
    }
    
    // Return offline page
    const offlineResponse = await caches.match('/offline')
    if (offlineResponse) {
      return offlineResponse
    }
    
    // Fallback response if offline page not cached
    return new Response(
      '<html><body><h1>Sin conexión</h1><p>Por favor verifica tu conexión a internet.</p></body></html>',
      {
        headers: { 'Content-Type': 'text/html' }
      }
    )
  }
}

// Strategy: Cache first
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  
  if (cached) {
    return cached
  }
  
  try {
    const response = await fetch(request)
    
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    console.error('[SW] Fetch failed:', error)
    throw error
  }
}

// Strategy: Cache first with stale-while-revalidate
async function cacheFirstRevalidate(request, cacheName) {
  const cached = await caches.match(request)
  
  // Fetch in background to update cache
  const fetchPromise = fetch(request).then((response) => {
    if (response && response.status === 200) {
      const cache = caches.open(cacheName)
      cache.then((c) => c.put(request, response.clone()))
    }
    return response
  }).catch(() => {
    // Silently fail background fetch
    return null
  })
  
  // Return cached immediately if available
  if (cached) {
    return cached
  }
  
  // Otherwise wait for network
  return fetchPromise
}

// Message handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.addAll(event.data.urls)
      })
    )
  }
})
