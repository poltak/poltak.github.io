export type ColorMode = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'theme'
export const COLOR_MODE_STORAGE_KEY = 'color-mode'
export const DEFAULT_THEME = 'cyan'

/**
 * The inline script in `src/app.html` applies these ids before first paint.
 * Keep its id list the same as this one.
 */
export const THEMES = [
    { id: 'cyan', label: 'Cyan', color: '#00d4ff' },
    { id: 'acid', label: 'Acid', color: '#2cff8e' },
    { id: 'amber', label: 'Amber', color: '#f0a01e' },
    { id: 'magenta', label: 'Magenta', color: '#ff6fe9' },
    { id: 'red', label: 'Red', color: '#ff6a4f' },
    { id: 'teal', label: 'Teal', color: '#2bd3c3' },
    { id: 'violet', label: 'Violet', color: '#7c5cff' },
] as const

export function isThemeId(value: unknown): value is (typeof THEMES)[number]['id'] {
    return THEMES.some((theme) => theme.id === value)
}
