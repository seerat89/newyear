// Service worker: makes the app launch offline after one online visit.
//
// The build (vite.config.ts) fills in BUILD and PRECACHE, so every deploy gets its own
// cache holding exactly that build's files (page, scripts, styles, fonts, icons).
// Pages are fetched network-first, so an online visit always gets the newest build and
// is never held on a stale one; the cache is only the offline fallback. Everything else
// is the build's own files, served from the cache. A new build installs next to the old
// one, takes over at once and deletes the old cache. No push and no background sync.

const BUILD = '__BUILD__'
const PRECACHE = '__PRECACHE__'
const CACHE = `newyear-${BUILD}`
/** How long a page may wait for the network before the cached copy is used. */
const NETWORK_WAIT_MS = 4000

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('newyear-') && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

// Responses vary on Origin (script tags send it, the precache does not), so ignore Vary.
const cachedPage = () => caches.match('/', { ignoreSearch: true, ignoreVary: true })

/** The page: the network first (so it is always current), the cached copy when offline or slow. */
function page(request) {
  return new Promise((resolve) => {
    const slow = setTimeout(() => cachedPage().then((hit) => hit && resolve(hit)), NETWORK_WAIT_MS)
    fetch(request)
      .then((response) => {
        clearTimeout(slow)
        resolve(response)
      })
      .catch(() => {
        clearTimeout(slow)
        cachedPage().then((hit) => resolve(hit || Response.error()))
      })
  })
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return
  if (request.mode === 'navigate') {
    event.respondWith(page(request))
    return
  }
  event.respondWith(caches.match(request, { ignoreVary: true }).then((hit) => hit || fetch(request)))
})
