import { base, build, files, prerendered, version } from '$service-worker'

const CACHE_PREFIX = 'poltak-site'
const CACHE_NAME = `${CACHE_PREFIX}-${version}`
const READER_SCOPE_URL = `${base}/fun/speed-reader/`
const READER_SCOPE_PATH = new URL(READER_SCOPE_URL, self.location.origin).pathname
const READER_ROUTE_PATH = READER_SCOPE_PATH.endsWith('/')
    ? READER_SCOPE_PATH.slice(0, -1)
    : READER_SCOPE_PATH
const APP_SHELL_URL = READER_SCOPE_URL

function isReaderUrl(url: string): boolean {
    try {
        const pathname = new URL(url, self.location.origin).pathname
        return pathname === READER_ROUTE_PATH || pathname.startsWith(READER_SCOPE_PATH)
    } catch {
        return url === READER_ROUTE_PATH || url.startsWith(READER_SCOPE_PATH)
    }
}

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

function hasReaderScope(): boolean {
    return new URL(self.registration.scope).pathname === READER_SCOPE_PATH
}

self.addEventListener('install', (event) => {
    if (!hasReaderScope()) {
        event.waitUntil(self.skipWaiting())
        return
    }

    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => cache.addAll(precacheUrls))
            .then(() => self.skipWaiting()),
    )
})

self.addEventListener('activate', (event) => {
    if (!hasReaderScope()) {
        event.waitUntil(self.registration.unregister())
        return
    }

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
        if (!isReaderUrl(request.url)) return

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
        (async () => {
            if (!isReaderUrl(request.url)) {
                const client = event.clientId ? await self.clients.get(event.clientId) : undefined
                if (!client || !isReaderUrl(client.url)) return fetch(request)
            }

            const cachedResponse = await caches.match(request, { ignoreSearch: true })
            return cachedResponse ?? fetch(request)
        })(),
    )
})
