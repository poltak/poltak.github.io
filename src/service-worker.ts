import { base, build, files, prerendered, version } from '$service-worker'

const CACHE_PREFIX = 'poltak-site'
const CACHE_NAME = `${CACHE_PREFIX}-${version}`
const APP_SHELL_URL = `${base}/`

function isBookUrl(url: string): boolean {
    try {
        return new URL(url, self.location.origin).pathname.toLowerCase().endsWith('.epub')
    } catch {
        return url.toLowerCase().endsWith('.epub')
    }
}

const precacheUrls = Array.from(
    new Set([APP_SHELL_URL, ...build, ...files, ...prerendered].filter((url) => !isBookUrl(url))),
)
const precachePaths = new Set(
    precacheUrls.map((url) => new URL(url, self.location.origin).pathname),
)

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => cache.addAll(precacheUrls))
            .then(() => self.skipWaiting()),
    )
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) =>
                Promise.all(
                    cacheNames
                        .filter((cacheName) => cacheName.startsWith(`${CACHE_PREFIX}-`))
                        .filter((cacheName) => cacheName !== CACHE_NAME)
                        .map((cacheName) => caches.delete(cacheName)),
                ),
            )
            .then(() => self.clients.claim()),
    )
})

self.addEventListener('fetch', (event) => {
    const request = event.request
    if (request.method !== 'GET') return

    const url = new URL(request.url)
    if (url.origin !== self.location.origin || isBookUrl(request.url)) return

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(async () => {
                const cachedPage = await caches.match(request, { ignoreSearch: true })
                return cachedPage ?? (await caches.match(APP_SHELL_URL)) ?? Response.error()
            }),
        )
        return
    }

    if (!precachePaths.has(url.pathname)) return

    event.respondWith(
        caches.match(request, { ignoreSearch: true }).then((cachedResponse) => {
            return cachedResponse ?? fetch(request)
        }),
    )
})
