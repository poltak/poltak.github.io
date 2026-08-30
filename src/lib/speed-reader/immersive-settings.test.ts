import { describe, expect, it } from 'vitest'
import {
    DEFAULT_READER_SETTINGS,
    READER_FONT_OPTIONS,
    READER_THEME_OPTIONS,
    getReaderFontStack,
    loadReaderSettings,
    normalizeReaderSettings,
    saveReaderSettings,
} from './immersive-settings'

function createStorage(initialValue: string | null = null) {
    let value = initialValue

    return {
        getItem: () => value,
        setItem: (_key: string, nextValue: string) => {
            value = nextValue
        },
        read: () => value,
    }
}

describe('immersive reader settings', () => {
    it('provides stable defaults and only uses local font stacks', () => {
        expect(DEFAULT_READER_SETTINGS).toEqual({
            textAlign: 'left',
            textScale: 100,
            font: 'serif',
            theme: 'light',
        })
        expect(getReaderFontStack('serif')).toContain('ui-serif')
        for (const option of READER_FONT_OPTIONS) {
            expect(option.stack).not.toMatch(/url\(|https?:/i)
        }
    })

    it('normalizes invalid persisted values to safe settings', () => {
        expect(
            normalizeReaderSettings({
                textAlign: 'diagonal',
                textScale: Number.POSITIVE_INFINITY,
                font: 'downloaded-font',
                theme: 'neon',
            }),
        ).toEqual(DEFAULT_READER_SETTINGS)

        expect(normalizeReaderSettings({ textScale: 25 })).toMatchObject({ textScale: 50 })
        expect(normalizeReaderSettings({ textScale: 250.4 })).toMatchObject({ textScale: 200 })
    })

    it('supports separate OLED modes and migrates the old OLED value', () => {
        expect(READER_THEME_OPTIONS.map((option) => option.id)).toEqual([
            'light',
            'sepia',
            'oled-dark',
            'oled-day',
        ])
        expect(normalizeReaderSettings({ theme: 'oled-dark' })).toMatchObject({
            theme: 'oled-dark',
        })
        expect(normalizeReaderSettings({ theme: 'oled-day' })).toMatchObject({
            theme: 'oled-day',
        })
        expect(normalizeReaderSettings({ theme: 'oled' })).toMatchObject({ theme: 'oled-dark' })

        const legacyStorage = createStorage(
            JSON.stringify({ ...DEFAULT_READER_SETTINGS, theme: 'oled' }),
        )
        expect(loadReaderSettings(legacyStorage)).toMatchObject({ theme: 'oled-dark' })
    })

    it('persists valid settings and ignores malformed storage', () => {
        const storage = createStorage()
        const settings = {
            textAlign: 'justify' as const,
            textScale: 135,
            font: 'sans' as const,
            theme: 'sepia' as const,
        }

        saveReaderSettings(settings, storage)
        expect(storage.read()).not.toBeNull()
        expect(JSON.parse(storage.read() ?? '')).toEqual(settings)
        expect(loadReaderSettings(storage)).toEqual(settings)

        const malformedStorage = createStorage('{not-json')
        expect(loadReaderSettings(malformedStorage)).toEqual(DEFAULT_READER_SETTINGS)
    })
})
