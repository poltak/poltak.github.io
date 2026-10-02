import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { COLOR_MODE_STORAGE_KEY, THEMES, THEME_STORAGE_KEY } from './theme'

const projectRoot = process.env.INIT_CWD ?? process.cwd()
const appHtml = readFileSync(resolve(projectRoot, 'src/app.html'), 'utf8')
const inlineScript = appHtml.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? ''

function runInlineScript() {
    new Function(inlineScript)()
}

function stubColorPreference(prefersDark: boolean) {
    vi.stubGlobal(
        'matchMedia',
        vi.fn(() => ({ matches: prefersDark })),
    )
}

describe('theme script in app.html', () => {
    beforeEach(() => {
        localStorage.clear()
        delete document.documentElement.dataset.theme
        document.documentElement.classList.remove('dark')
        stubColorPreference(false)
    })
    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    it('runs before the application head content', () => {
        expect(inlineScript).not.toBe('')
        expect(appHtml.indexOf('<script>')).toBeLessThan(appHtml.indexOf('%sveltekit.head%'))
    })

    it('applies each theme the layout can save', () => {
        for (const theme of THEMES) {
            localStorage.setItem(THEME_STORAGE_KEY, theme.id)
            runInlineScript()
            expect(document.documentElement.dataset.theme).toBe(theme.id)
        }
    })

    it('applies the saved color mode before the system preference', () => {
        stubColorPreference(false)
        localStorage.setItem(COLOR_MODE_STORAGE_KEY, 'dark')
        runInlineScript()
        expect(document.documentElement.classList.contains('dark')).toBe(true)

        stubColorPreference(true)
        localStorage.setItem(COLOR_MODE_STORAGE_KEY, 'light')
        runInlineScript()
        expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('uses the defaults for unknown values and blocked storage', () => {
        localStorage.setItem(THEME_STORAGE_KEY, 'not-a-theme')
        stubColorPreference(true)
        runInlineScript()
        expect(document.documentElement.dataset.theme).toBe('cyan')
        expect(document.documentElement.classList.contains('dark')).toBe(true)

        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('Storage blocked')
        })
        stubColorPreference(false)
        runInlineScript()
        expect(document.documentElement.dataset.theme).toBe('cyan')
        expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
})
