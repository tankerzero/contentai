const CACHE = 'contentai-v1'

const PRECACHE = [
  '/',
  '/login',
  '/signup',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  // Only cache same-origin GET requests; skip API, auth, and Stripe calls
  const { request } = e
  const url = new URL(request.url)
  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/data/')
  ) return

  e.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(res => {
        // Cache successful navigation responses and static assets
        if (
          res.ok &&
          (request.mode === 'navigate' || url.pathname.startsWith('/_next/static/'))
        ) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(request, clone))
        }
        return res
      })
      // Return cached version immediately if available, otherwise wait for network
      return cached ?? network
    })
  )
})
