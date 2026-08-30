import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = process.env.INIT_CWD ?? process.cwd()
const manifest = JSON.parse(
    readFileSync(resolve(projectRoot, 'static/fun/speed-reader/manifest.webmanifest'), 'utf8'),
)
const appTemplate = readFileSync(resolve(projectRoot, 'src/app.html'), 'utf8')
const speedReaderRoute = readFileSync(
    resolve(projectRoot, 'src/routes/(app)/fun/(items)/speed-reader/+page.svelte'),
    'utf8',
)
const speedReaderRouteConfig = readFileSync(
    resolve(projectRoot, 'src/routes/(app)/fun/(items)/speed-reader/+page.ts'),
    'utf8',
)
const serviceWorker = readFileSync(resolve(projectRoot, 'src/service-worker.ts'), 'utf8')
const svelteConfig = readFileSync(resolve(projectRoot, 'svelte.config.js'), 'utf8')

function pngDimensions(path: string) {
    const bytes = readFileSync(resolve(projectRoot, path))
    expect(bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

describe('PWA shell', () => {
    it('declares a route-scoped standalone manifest with install icons', () => {
        expect(manifest.name).toBe("Jon's EPUB Speed Reader")
        expect(manifest.short_name).toBe('Speed Reader')
        expect(manifest.id).toBe('./')
        expect(manifest.start_url).toBe('./')
        expect(manifest.scope).toBe('./')
        expect(manifest.display).toBe('standalone')
        expect(manifest.theme_color).toBe('#21e27a')
        expect(manifest.background_color).toBe('#070d0d')
        expect(manifest.icons).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ sizes: '192x192', type: 'image/png' }),
                expect.objectContaining({ sizes: '512x512', type: 'image/png' }),
            ]),
        )
        const manifestUrl = 'https://example.com/fun/speed-reader/manifest.webmanifest'
        expect(new URL(manifest.id, manifestUrl).pathname).toBe('/fun/speed-reader/')
        expect(new URL(manifest.start_url, manifestUrl).pathname).toBe('/fun/speed-reader/')
        expect(new URL(manifest.scope, manifestUrl).pathname).toBe('/fun/speed-reader/')
        expect(
            manifest.icons.map((icon: { src: string }) => new URL(icon.src, manifestUrl).pathname),
        ).toEqual(['/icons/icon-192.png', '/icons/icon-512.png'])
        expect(pngDimensions('static/icons/icon-192.png')).toEqual({ width: 192, height: 192 })
        expect(pngDimensions('static/icons/icon-512.png')).toEqual({ width: 512, height: 512 })
    })

    it('keeps install metadata off the root template and on the speed reader route', () => {
        expect(appTemplate).not.toContain('rel="manifest"')
        expect(appTemplate).not.toContain('name="application-name"')
        expect(appTemplate).not.toContain('name="mobile-web-app-capable"')
        expect(appTemplate).not.toContain('name="apple-mobile-web-app-capable"')
        expect(speedReaderRoute).toContain('manifest.webmanifest')
        expect(speedReaderRoute).toContain('name="application-name"')
        expect(speedReaderRoute).toContain('name="mobile-web-app-capable"')
        expect(speedReaderRoute).toContain('name="apple-mobile-web-app-capable"')
        expect(speedReaderRoute).toContain('import.meta.env.DEV')
        expect(speedReaderRoute).toContain('register(`${base}/service-worker.js`')
        expect(speedReaderRoute).toContain('scope: speedReaderScope')
        expect(speedReaderRoute).not.toContain('type:')
        expect(speedReaderRouteConfig).toContain("trailingSlash = 'always'")
        expect(svelteConfig).toContain('serviceWorker:')
        expect(svelteConfig).toContain('register: false')
    })

    it('limits service-worker behavior to the speed reader scope', () => {
        expect(serviceWorker).toContain("from '$service-worker'")
        expect(serviceWorker).toContain('READER_SCOPE_URL')
        expect(serviceWorker).toContain('hasReaderScope')
        expect(serviceWorker).toContain('self.registration.unregister()')
        expect(serviceWorker).toContain('if (!isReaderUrl(request.url)) return')
        expect(serviceWorker).toContain('cache.addAll(precacheUrls)')
        expect(serviceWorker).toContain("endsWith('.epub')")
        expect(serviceWorker).toContain('.filter((cacheName) =>')
        expect(serviceWorker).toContain('self.clients.claim()')
        expect(serviceWorker).not.toContain('cache.put(request')
    })
})
