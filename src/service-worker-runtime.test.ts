import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type WorkerEvent =
    | { waitUntil: (promise: Promise<void>) => void }
    | {
          request: { method: string; mode: string; url: string }
          clientId?: string
          respondWith: (promise: Promise<Response>) => void
      }

vi.mock('$service-worker', () => ({
    base: '',
    version: 'test-version',
    build: ['/_app/immutable/app.js'],
    files: [
        '/My%20Clippings.txt',
        '/resume.pdf',
        '/astra-search-experiments.html',
        '/icons/icon-192.png',
        '/favicon.png',
        '/fun/speed-reader/manifest.webmanifest',
        '/fun/speed-reader/book.epub',
    ],
    prerendered: ['/', '/cv', '/fun/speed-reader/'],
}))

describe('reader service worker runtime', () => {
    const listeners = new Map<string, (event: WorkerEvent) => void>()
    const cache = { addAll: vi.fn(), match: vi.fn() }
    const cachesMock = { open: vi.fn(async () => cache), match: vi.fn() }

    beforeEach(async () => {
        vi.resetModules()
        vi.clearAllMocks()
        listeners.clear()
        vi.stubGlobal('self', {
            location: { origin: 'https://example.com' },
            registration: { scope: 'https://example.com/fun/speed-reader/' },
            clients: { get: async () => ({ url: 'https://example.com/fun/speed-reader/' }) },
            skipWaiting: vi.fn(),
            addEventListener: (type: string, handler: (event: WorkerEvent) => void) =>
                listeners.set(type, handler),
        })
        vi.stubGlobal('caches', cachesMock)
        await import('./service-worker')
    })
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('caches the reader shell without unrelated documents or EPUB files', async () => {
        let installed!: Promise<void>
        listeners.get('install')!({
            waitUntil: (promise: Promise<void>) => {
                installed = promise
            },
        })
        await installed
        expect(cache.addAll).toHaveBeenCalledExactlyOnceWith([
            '/fun/speed-reader/',
            '/_app/immutable/app.js',
            '/icons/icon-192.png',
            '/favicon.png',
            '/fun/speed-reader/manifest.webmanifest',
        ])
    })

    it('reads only the current build cache for reader assets', async () => {
        cache.match.mockResolvedValue(new Response('current build'))
        cachesMock.match.mockResolvedValue(new Response('old build'))
        let response!: Promise<Response>
        listeners.get('fetch')!({
            request: {
                method: 'GET',
                mode: 'cors',
                url: 'https://example.com/_app/immutable/app.js',
            },
            clientId: 'reader',
            respondWith: (promise: Promise<Response>) => {
                response = promise
            },
        })
        expect(await (await response).text()).toBe('current build')
        expect(cachesMock.open).toHaveBeenCalledWith('poltak-site-test-version')
        expect(cachesMock.match).not.toHaveBeenCalled()
    })

    it('falls back to the current reader shell during an offline navigation', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
        cache.match
            .mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce(new Response('reader shell'))
        let response!: Promise<Response>
        listeners.get('fetch')!({
            request: {
                method: 'GET',
                mode: 'navigate',
                url: 'https://example.com/fun/speed-reader/?offline',
            },
            respondWith: (promise: Promise<Response>) => {
                response = promise
            },
        })
        expect(await (await response).text()).toBe('reader shell')
        expect(cachesMock.match).not.toHaveBeenCalled()
    })
})
