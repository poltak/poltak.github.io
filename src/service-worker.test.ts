import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = process.env.INIT_CWD ?? process.cwd()
const manifest = JSON.parse(
    readFileSync(resolve(projectRoot, 'static/manifest.webmanifest'), 'utf8'),
)
const appTemplate = readFileSync(resolve(projectRoot, 'src/app.html'), 'utf8')
const serviceWorker = readFileSync(resolve(projectRoot, 'src/service-worker.ts'), 'utf8')

function pngDimensions(path: string) {
    const bytes = readFileSync(resolve(projectRoot, path))
    expect(bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

describe('PWA shell', () => {
    it('declares a base-path-safe standalone manifest with install icons', () => {
        expect(manifest.name).toBe("Jon's EPUB Speed Reader")
        expect(manifest.short_name).toBe('Speed Reader')
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
        expect(pngDimensions('static/icons/icon-192.png')).toEqual({ width: 192, height: 192 })
        expect(pngDimensions('static/icons/icon-512.png')).toEqual({ width: 512, height: 512 })
    })

    it('exposes the manifest and accessible platform install metadata', () => {
        expect(appTemplate).toContain('rel="manifest"')
        expect(appTemplate).toContain('name="application-name"')
        expect(appTemplate).toContain('name="apple-mobile-web-app-title"')
        expect(appTemplate).toContain('name="theme-color"')
    })

    it('pre-caches generated assets and protects EPUBs from cache storage', () => {
        expect(serviceWorker).toContain("from '$service-worker'")
        expect(serviceWorker).toContain('cache.addAll(precacheUrls)')
        expect(serviceWorker).toContain("endsWith('.epub')")
        expect(serviceWorker).toContain('.filter((cacheName) =>')
        expect(serviceWorker).toContain('self.clients.claim()')
        expect(serviceWorker).not.toContain('cache.put(request')
    })
})
