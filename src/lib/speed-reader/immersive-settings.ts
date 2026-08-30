export type ReaderTextAlign = 'left' | 'center' | 'justify'
export type ReaderFontId = 'serif' | 'sans' | 'mono'
export type ReaderTheme = 'light' | 'sepia' | 'oled-dark' | 'oled-day'

export interface ReaderSettings {
    textAlign: ReaderTextAlign
    textScale: number
    font: ReaderFontId
    theme: ReaderTheme
}

export interface ReaderFontOption {
    id: ReaderFontId
    label: string
    stack: string
}

export interface ReaderSettingsStorage {
    getItem: (key: string) => string | null
    setItem: (key: string, value: string) => void
}

export const READER_SETTINGS_STORAGE_KEY = 'poltak-immersive-reader-settings'
export const READER_TEXT_SCALE_MIN = 50
export const READER_TEXT_SCALE_MAX = 200

export const READER_FONT_OPTIONS: readonly ReaderFontOption[] = [
    {
        id: 'serif',
        label: 'System serif',
        stack: "ui-serif, Georgia, 'Times New Roman', serif",
    },
    {
        id: 'sans',
        label: 'System sans serif',
        stack: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    {
        id: 'mono',
        label: 'System monospace',
        stack: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    },
]

export const READER_TEXT_ALIGN_OPTIONS: readonly {
    id: ReaderTextAlign
    label: string
}[] = [
    { id: 'left', label: 'Left' },
    { id: 'center', label: 'Center' },
    { id: 'justify', label: 'Justified' },
]

export const READER_THEME_OPTIONS: readonly {
    id: ReaderTheme
    label: string
}[] = [
    { id: 'light', label: 'Light' },
    { id: 'sepia', label: 'Sepia' },
    { id: 'oled-dark', label: 'OLED black dark room' },
    { id: 'oled-day', label: 'OLED black daytime' },
]

export const DEFAULT_READER_SETTINGS: Readonly<ReaderSettings> = Object.freeze({
    textAlign: 'left',
    textScale: 100,
    font: 'serif',
    theme: 'light',
})

function getBrowserStorage(): ReaderSettingsStorage | null {
    if (typeof window === 'undefined') return null

    try {
        return window.localStorage
    } catch {
        return null
    }
}

function isTextAlign(value: unknown): value is ReaderTextAlign {
    return value === 'left' || value === 'center' || value === 'justify'
}

function isFontId(value: unknown): value is ReaderFontId {
    return value === 'serif' || value === 'sans' || value === 'mono'
}

function isReaderTheme(value: unknown): value is ReaderTheme {
    return value === 'light' || value === 'sepia' || value === 'oled-dark' || value === 'oled-day'
}

function normalizeReaderTheme(value: unknown): ReaderTheme {
    if (value === 'oled') return 'oled-dark'
    return isReaderTheme(value) ? value : DEFAULT_READER_SETTINGS.theme
}

function normalizeTextScale(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return DEFAULT_READER_SETTINGS.textScale
    }

    return Math.min(READER_TEXT_SCALE_MAX, Math.max(READER_TEXT_SCALE_MIN, Math.round(value)))
}

export function normalizeReaderSettings(value: unknown): ReaderSettings {
    if (!value || typeof value !== 'object') {
        return { ...DEFAULT_READER_SETTINGS }
    }

    const candidate = value as Partial<ReaderSettings>
    return {
        textAlign: isTextAlign(candidate.textAlign)
            ? candidate.textAlign
            : DEFAULT_READER_SETTINGS.textAlign,
        textScale: normalizeTextScale(candidate.textScale),
        font: isFontId(candidate.font) ? candidate.font : DEFAULT_READER_SETTINGS.font,
        theme: normalizeReaderTheme(candidate.theme),
    }
}

export function getReaderFontStack(font: ReaderFontId): string {
    return (
        READER_FONT_OPTIONS.find((option) => option.id === font)?.stack ??
        READER_FONT_OPTIONS[0].stack
    )
}

export function loadReaderSettings(storage?: ReaderSettingsStorage | null): ReaderSettings {
    const source = storage === undefined ? getBrowserStorage() : storage
    if (!source) return { ...DEFAULT_READER_SETTINGS }

    try {
        const raw = source.getItem(READER_SETTINGS_STORAGE_KEY)
        return raw ? normalizeReaderSettings(JSON.parse(raw)) : { ...DEFAULT_READER_SETTINGS }
    } catch {
        return { ...DEFAULT_READER_SETTINGS }
    }
}

export function saveReaderSettings(
    settings: ReaderSettings,
    storage?: ReaderSettingsStorage | null,
): void {
    const source = storage === undefined ? getBrowserStorage() : storage
    if (!source) return

    try {
        source.setItem(
            READER_SETTINGS_STORAGE_KEY,
            JSON.stringify(normalizeReaderSettings(settings)),
        )
    } catch {
        // Local storage may be blocked or full. Reading still works with in-memory settings.
    }
}
