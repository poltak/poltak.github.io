/// <reference lib="webworker" />

import { base, build, files, prerendered, version } from '$service-worker'

declare const self: ServiceWorkerGlobalScope

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
    new Set(
        [
            APP_SHELL_URL,
            ...build,
            ...files.filter(
                (url) =>
                    isReaderUrl(url) ||
                    url.startsWith(`${base}/icons/`) ||
                    url === `${base}/favicon.png`,
            ),
            ...prerendered.filter(isReaderUrl),
        ].filter((url) => !isBookUrl(url)),
    ),
)
const precachePaths = new Set(
    precacheUrls.map((url) => new URL(url, self.location.origin).pathname),
)
// Build files have a content hash in the name, so a copy from the HTTP cache is safe. Pages and
// static files have no version in the name. Fetch them from the network, or the new cache can
// hold a shell from the previous deployment that names chunks this cache does not have.
const immutableUrls = new Set(build)
const precacheRequests = precacheUrls.map((url) =>
    immutableUrls.has(url)
        ? url
        : new Request(new URL(url, self.location.origin), { cache: 'reload' }),
)
// After this time a reader navigation uses the cached shell, not a slow network.
const NAVIGATION_TIMEOUT_MS = 3000

async function readCachedPage(request: Request): Promise<Response | undefined> {
    const cache = await caches.open(CACHE_NAME)
    return (
        (await cache.match(request, { ignoreSearch: true })) ?? (await cache.match(APP_SHELL_URL))
    )
}

async function respondToNavigation(request: Request): Promise<Response> {
    const cached = readCachedPage(request)
    const network = fetch(request)
    // The cached shell can win the race. A later network failure then has no other handler.
    network.catch(() => undefined)

    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), NAVIGATION_TIMEOUT_MS)
    })
    try {
        const response = await Promise.race([network, timeout])
        if (response) return response
    } catch {
        // Offline. Use the cached shell below.
    } finally {
        clearTimeout(timer)
    }

    return (await cached) ?? network.catch(() => Response.error())
}

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
            .then((cache) => cache.addAll(precacheRequests))
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

        event.respondWith(respondToNavigation(request))
        return
    }

    if (!precachePaths.has(url.pathname)) return

    event.respondWith(
        (async () => {
            if (!isReaderUrl(request.url)) {
                const client = event.clientId ? await self.clients.get(event.clientId) : undefined
                if (!client || !isReaderUrl(client.url)) return fetch(request)
            }

            const cache = await caches.open(CACHE_NAME)
            const cachedResponse = await cache.match(request, { ignoreSearch: true })
            return cachedResponse ?? fetch(request)
        })(),
    )
})
