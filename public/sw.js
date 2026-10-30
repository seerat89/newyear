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
// Media (the midnight recording) is big and does not change with the app, so it has its own
// cache that survives deploys. Rename it (media-2 ...) if the recording is ever replaced.
const MEDIA = 'media-1'
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

/** A cached file answered as audio elements ask for it: whole, or the byte range they want. */
function ranged(request, hit) {
  const range = /bytes=(\d*)-(\d*)/.exec(request.headers.get('range') || '')
  if (!range) return hit
  return hit.arrayBuffer().then((buffer) => {
    const size = buffer.byteLength
    const start = range[1] === '' ? Math.max(0, size - Number(range[2])) : Number(range[1])
    const end = range[1] !== '' && range[2] !== '' ? Math.min(Number(range[2]), size - 1) : size - 1
    return new Response(buffer.slice(start, end + 1), {
      status: 206,
      headers: {
        'Content-Type': hit.headers.get('Content-Type') || 'audio/mpeg',
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Content-Length': String(end - start + 1),
      },
    })
  })
}

/** Media: from its cache when there; a plain (whole-file) fetch is stored, ranged ones pass through. */
async function media(request) {
  const cache = await caches.open(MEDIA)
  const key = new URL(request.url).pathname
  const hit = await cache.match(key, { ignoreVary: true })
  if (hit) return ranged(request, hit)
  const response = await fetch(request)
  if (response.status === 200 && !request.headers.has('range')) cache.put(key, response.clone())
  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/audio/')) {
    event.respondWith(media(request))
    return
  }
  if (request.mode === 'navigate') {
    event.respondWith(page(request))
    return
  }
  event.respondWith(caches.match(request, { ignoreVary: true }).then((hit) => hit || fetch(request)))
})
