// Blake UK Homes service worker — offline shell + web push.
const CACHE = 'blake-uk-homes-v1'
const APP_SHELL = ['/', '/dashboard', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_SHELL)).catch(() => {}))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Network-first for HTML; cache-first for static assets.
self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match(req).then((r) => r || caches.match('/')))
    )
    return
  }
  if (/\.(?:png|jpg|jpeg|svg|webp|ico|css|js|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then((cached) =>
        cached ||
        fetch(req).then((r) => {
          const copy = r.clone()
          caches.open(CACHE).then((c) => c.put(req, copy))
          return r
        })
      )
    )
  }
})

self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch {}
  const title = data.title || 'Blake UK Homes'
  const body  = data.body  || 'You have a new update.'
  const url   = data.url   || '/dashboard'
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag || 'blake-uk-homes',
      data: { url },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/dashboard'
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((wins) => {
      const focused = wins.find((w) => w.url.includes(url))
      if (focused) return focused.focus()
      return self.clients.openWindow(url)
    })
  )
})
