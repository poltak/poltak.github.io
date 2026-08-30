import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ImmersiveReader from './ImmersiveReader.svelte'
import { READER_SETTINGS_STORAGE_KEY } from '$lib/speed-reader/immersive-settings'

const projectRoot = process.env.INIT_CWD ?? process.cwd()
const componentSource = readFileSync(
    resolve(projectRoot, 'src/lib/components/speed-reader/ImmersiveReader.svelte'),
    'utf8',
)
const componentStyles = componentSource.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? ''

const chapter = {
    id: 'chapter-2',
    title: 'A Test Chapter',
    content: 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.',
    order: 1,
    wordStartIndex: 100,
    wordCount: 6,
}

const baseProps = {
    chapter,
    chapterIndex: 1,
    chapterCount: 3,
    progressPercentage: 25,
    totalWords: 400,
    onPrevious: vi.fn(),
    onNext: vi.fn(),
}

let activeFullscreenElement: Element | null
let storedReaderSettings: string | null = null
let originalLocalStorageDescriptor: PropertyDescriptor | undefined

const readerStorage = {
    getItem: () => storedReaderSettings,
    setItem: (_key: string, value: string) => {
        storedReaderSettings = value
    },
    removeItem: () => {
        storedReaderSettings = null
    },
}

function installFullscreenMocks() {
    Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        get: () => activeFullscreenElement,
    })
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
        configurable: true,
        value: vi.fn(async function (this: HTMLElement) {
            activeFullscreenElement = this
            document.dispatchEvent(new Event('fullscreenchange'))
        }),
    })
    Object.defineProperty(document, 'exitFullscreen', {
        configurable: true,
        value: vi.fn(async () => {
            activeFullscreenElement = null
            document.dispatchEvent(new Event('fullscreenchange'))
        }),
    })
}

async function enterFullscreen() {
    await fireEvent.click(screen.getByRole('button', { name: 'Full screen' }))
    return screen.findByRole('group', { name: /Paged chapter/i })
}

function setPagedMeasurements(container: HTMLElement, viewport: HTMLElement) {
    const content = container.querySelector('.paged-content')
    if (!(content instanceof HTMLElement)) throw new Error('Paged content was not rendered')

    let scrollWidth = 1500
    const scrollTo = vi.fn()
    Object.defineProperty(viewport, 'clientWidth', { configurable: true, value: 500 })
    Object.defineProperty(content, 'scrollWidth', {
        configurable: true,
        get: () => scrollWidth,
    })
    Object.defineProperty(viewport, 'scrollTo', {
        configurable: true,
        value: scrollTo,
    })
    Object.defineProperty(viewport, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({
            x: 0,
            y: 0,
            top: 0,
            right: 500,
            bottom: 700,
            left: 0,
            width: 500,
            height: 700,
            toJSON: () => ({}),
        }),
    })
    window.dispatchEvent(new Event('resize'))

    return {
        scrollTo,
        setScrollWidth: (nextWidth: number) => {
            scrollWidth = nextWidth
        },
    }
}

describe('ImmersiveReader fullscreen', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        activeFullscreenElement = null
        storedReaderSettings = null
        originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage')
        Object.defineProperty(window, 'localStorage', {
            configurable: true,
            value: readerStorage,
        })
        window.localStorage.removeItem(READER_SETTINGS_STORAGE_KEY)
        installFullscreenMocks()
    })

    afterEach(() => {
        cleanup()
        Reflect.deleteProperty(HTMLElement.prototype, 'requestFullscreen')
        Reflect.deleteProperty(document, 'exitFullscreen')
        Reflect.deleteProperty(document, 'fullscreenElement')
        if (originalLocalStorageDescriptor) {
            Object.defineProperty(window, 'localStorage', originalLocalStorageDescriptor)
        } else {
            Reflect.deleteProperty(window, 'localStorage')
        }
    })

    it('requests fullscreen and switches to continuous chapter flow', async () => {
        const { container } = render(ImmersiveReader, baseProps)

        await enterFullscreen()
        expect(HTMLElement.prototype.requestFullscreen).toHaveBeenCalledOnce()
        expect(await screen.findByText('Page 1 of 1')).not.toBeNull()

        await fireEvent.click(screen.getByRole('button', { name: 'Continuous flow' }))

        expect(container.querySelector('.continuous-viewport')).not.toBeNull()
        expect(container.querySelector('.paged-viewport')).toBeNull()
        expect(screen.getByText('First paragraph.')).not.toBeNull()
        expect(screen.getByText('Third paragraph.')).not.toBeNull()

        await fireEvent.click(screen.getByRole('button', { name: 'Page by page' }))
        expect(await screen.findByText('Page 1 of 1')).not.toBeNull()

        await fireEvent.click(screen.getByRole('button', { name: 'Exit fullscreen' }))
        expect(document.exitFullscreen).toHaveBeenCalledOnce()
        expect(screen.getByRole('button', { name: 'Full screen' })).not.toBeNull()
    })

    it('changes and persists reading settings in the normal reader', async () => {
        const { container } = render(ImmersiveReader, baseProps)

        const settingsToggle = screen.getByRole('button', { name: 'Reading settings' })
        await fireEvent.click(settingsToggle)
        expect(settingsToggle.getAttribute('aria-controls')).toBe('immersive-reading-settings')
        expect(document.getElementById('immersive-reading-settings')).not.toBeNull()
        expect((screen.getByRole('slider', { name: 'Text size' }) as HTMLInputElement).value).toBe(
            '100',
        )
        expect((screen.getByRole('combobox', { name: 'Font' }) as HTMLSelectElement).value).toBe(
            'serif',
        )

        await fireEvent.click(screen.getByRole('button', { name: 'Center' }))
        await fireEvent.input(screen.getByRole('slider', { name: 'Text size' }), {
            target: { value: '150' },
        })
        await fireEvent.change(screen.getByRole('combobox', { name: 'Font' }), {
            target: { value: 'sans' },
        })
        await fireEvent.click(screen.getByRole('button', { name: 'Sepia' }))

        const reader = container.querySelector('.immersive-reader')
        expect(reader).not.toBeNull()
        expect(reader?.getAttribute('data-reading-theme')).toBe('sepia')
        expect(reader?.classList.contains('reading-align-center')).toBe(true)
        expect(reader?.getAttribute('style')).toContain('--reader-text-scale: 150%')
        expect(reader?.getAttribute('style')).toContain('--reader-font-family: ui-sans-serif')
        expect(JSON.parse(window.localStorage.getItem(READER_SETTINGS_STORAGE_KEY) ?? '')).toEqual({
            textAlign: 'center',
            textScale: 150,
            font: 'sans',
            theme: 'sepia',
        })
    })

    it('refreshes fullscreen pagination when the settings panel opens and closes', async () => {
        const { container } = render(ImmersiveReader, baseProps)
        const viewport = await enterFullscreen()
        const measurement = setPagedMeasurements(container, viewport)
        await waitFor(() => expect(screen.getByText('Page 1 of 3')).not.toBeNull())

        const settingsToggle = screen.getByRole('button', { name: 'Reading settings' })
        measurement.scrollTo.mockClear()
        await fireEvent.click(settingsToggle)
        await waitFor(() => expect(measurement.scrollTo).toHaveBeenCalled())

        measurement.scrollTo.mockClear()
        await fireEvent.click(settingsToggle)
        await waitFor(() => expect(measurement.scrollTo).toHaveBeenCalled())
    })

    it('keeps every fullscreen reading setting available when the panel is open', async () => {
        const { container } = render(ImmersiveReader, baseProps)

        await enterFullscreen()
        await fireEvent.click(screen.getByRole('button', { name: 'Reading settings' }))

        const panel = container.querySelector('.fullscreen-reader > .reading-settings')
        expect(panel).not.toBeNull()
        expect(screen.getByText('Text alignment')).not.toBeNull()
        expect(screen.getByText('Text size')).not.toBeNull()
        expect(screen.getByRole('combobox', { name: 'Font' })).not.toBeNull()
        expect(screen.getByText('Viewing theme')).not.toBeNull()
    })

    it('does not render the obsolete page cues or gesture instructions', async () => {
        const { container } = render(ImmersiveReader, baseProps)

        await enterFullscreen()

        expect(container.querySelector('.page-cue')).toBeNull()
        expect(container.querySelector('.paged-instructions')).toBeNull()
        expect(screen.queryByText(/Tap left or right/)).toBeNull()
    })

    it('refreshes fullscreen pagination when font or text size changes', async () => {
        const { container } = render(ImmersiveReader, baseProps)
        const viewport = await enterFullscreen()
        const measurement = setPagedMeasurements(container, viewport)
        await waitFor(() => expect(screen.getByText('Page 1 of 3')).not.toBeNull())

        measurement.scrollTo.mockClear()
        await fireEvent.click(screen.getByRole('button', { name: 'Reading settings' }))
        await waitFor(() => expect(measurement.scrollTo).toHaveBeenCalled())

        measurement.setScrollWidth(2000)
        await fireEvent.change(screen.getByRole('combobox', { name: 'Font' }), {
            target: { value: 'mono' },
        })

        await waitFor(() => expect(screen.getByText('Page 1 of 4')).not.toBeNull())
        expect(measurement.scrollTo).toHaveBeenCalled()
    })

    it('keeps reader surfaces within narrow viewports in its CSS contract', () => {
        expect(componentStyles).toMatch(/\.immersive-reader\s*\{[^}]*box-sizing:\s*border-box;/)
        expect(componentStyles).toMatch(/\.continuous-content\s*\{[^}]*box-sizing:\s*border-box;/)
        expect(componentStyles).toMatch(/\.immersive-content\s*\{[^}]*overflow-wrap:\s*anywhere;/)
        expect(componentStyles).toMatch(
            /\.fullscreen-reader\s*>\s*\.reading-settings\s*\{[^}]*flex:\s*0 0 auto;/,
        )
        expect(componentStyles).toMatch(
            /\.fullscreen-reader\s*>\s*\.reading-settings\s*\{[^}]*overflow-y:\s*auto;/,
        )
        expect(componentStyles).toMatch(
            /\.fullscreen-reader\s*>\s*\.reading-settings\s*\{[^}]*max-height:\s*min\(55dvh, 28rem\);/,
        )
        expect(componentStyles).toMatch(
            /\.immersive-content p\s*\{[^}]*font-family:\s*var\(--reader-font-family\);/,
        )
        expect(componentStyles).toMatch(
            /\.immersive-content p\s*\{[^}]*color:\s*var\(--reader-text\);/,
        )
        expect(componentStyles).toMatch(
            /\.immersive-header h2\s*\{[^}]*color:\s*var\(--reader-text\);/,
        )
        expect(componentStyles).toMatch(
            /\.immersive-reader\[data-reading-theme='oled-dark'\]\s*\{[^}]*--reader-text:\s*#8a9b95;[^}]*--reader-muted:\s*#64736e;/,
        )
        expect(componentStyles).toMatch(
            /\.immersive-reader\[data-reading-theme='oled-day'\]\s*\{[^}]*--reader-text:\s*#f4f6f5;[^}]*--reader-muted:\s*#b9c5c1;/,
        )
        expect(componentStyles).toMatch(
            /@media screen and \(max-width: 576px\)[\s\S]*?\.immersive-reader\s*\{[^}]*padding:\s*0\.75rem;/,
        )
        expect(componentStyles).toMatch(
            /@media screen and \(max-width: 576px\)[\s\S]*?\.continuous-content\s*\{[^}]*padding:\s*1rem 0\.75rem;/,
        )
    })

    it('turns measured pages with taps, swipes, and keyboard controls', async () => {
        const { container } = render(ImmersiveReader, baseProps)
        const viewport = await enterFullscreen()
        setPagedMeasurements(container, viewport)
        await waitFor(() => expect(screen.getByText('Page 1 of 3')).not.toBeNull())

        await fireEvent.pointerDown(viewport, {
            pointerId: 1,
            isPrimary: true,
            clientX: 400,
            clientY: 100,
        })
        await fireEvent.pointerUp(viewport, {
            pointerId: 1,
            isPrimary: true,
            clientX: 402,
            clientY: 102,
        })
        expect(screen.getByText('Page 2 of 3')).not.toBeNull()

        await fireEvent.pointerDown(viewport, {
            pointerId: 2,
            isPrimary: true,
            clientX: 400,
            clientY: 100,
        })
        await fireEvent.pointerUp(viewport, {
            pointerId: 2,
            isPrimary: true,
            clientX: 300,
            clientY: 105,
        })
        expect(screen.getByText('Page 3 of 3')).not.toBeNull()

        await fireEvent.keyDown(viewport, { key: 'ArrowLeft' })
        expect(screen.getByText('Page 2 of 3')).not.toBeNull()
        await fireEvent.keyDown(viewport, { key: 'PageDown' })
        expect(screen.getByText('Page 3 of 3')).not.toBeNull()

        await fireEvent.keyDown(viewport, { key: 'ArrowRight' })
        expect(baseProps.onNext).toHaveBeenCalledOnce()
    })

    it('follows a horizontal touch drag and commits the page on release', async () => {
        const { container } = render(ImmersiveReader, baseProps)
        const viewport = await enterFullscreen()
        setPagedMeasurements(container, viewport)
        await waitFor(() => expect(screen.getByText('Page 1 of 3')).not.toBeNull())

        await fireEvent.pointerDown(viewport, {
            pointerId: 3,
            pointerType: 'touch',
            isPrimary: true,
            clientX: 400,
            clientY: 100,
        })
        await fireEvent.pointerMove(viewport, {
            pointerId: 3,
            pointerType: 'touch',
            isPrimary: true,
            clientX: 260,
            clientY: 105,
        })

        expect(viewport.scrollLeft).toBe(140)

        await fireEvent.pointerUp(viewport, {
            pointerId: 3,
            pointerType: 'touch',
            isPrimary: true,
            clientX: 260,
            clientY: 105,
        })

        expect(screen.getByText('Page 2 of 3')).not.toBeNull()
    })

    it('snaps back after an incomplete drag and ignores vertical or mouse drags', async () => {
        const { container } = render(ImmersiveReader, baseProps)
        const viewport = await enterFullscreen()
        const measurement = setPagedMeasurements(container, viewport)
        await waitFor(() => expect(screen.getByText('Page 1 of 3')).not.toBeNull())

        measurement.scrollTo.mockClear()
        await fireEvent.pointerDown(viewport, {
            pointerId: 4,
            pointerType: 'touch',
            isPrimary: true,
            clientX: 400,
            clientY: 100,
        })
        await fireEvent.pointerMove(viewport, {
            pointerId: 4,
            pointerType: 'touch',
            isPrimary: true,
            clientX: 350,
            clientY: 102,
        })
        await fireEvent.pointerUp(viewport, {
            pointerId: 4,
            pointerType: 'touch',
            isPrimary: true,
            clientX: 375,
            clientY: 102,
        })

        expect(screen.getByText('Page 1 of 3')).not.toBeNull()
        expect(measurement.scrollTo).toHaveBeenLastCalledWith({
            left: 0,
            top: 0,
            behavior: 'smooth',
        })

        measurement.scrollTo.mockClear()
        await fireEvent.pointerDown(viewport, {
            pointerId: 7,
            pointerType: 'touch',
            isPrimary: true,
            clientX: 400,
            clientY: 100,
        })
        await fireEvent.pointerMove(viewport, {
            pointerId: 7,
            pointerType: 'touch',
            isPrimary: true,
            clientX: 320,
            clientY: 100,
        })
        await fireEvent.pointerCancel(viewport, {
            pointerId: 7,
            pointerType: 'touch',
            isPrimary: true,
        })

        expect(measurement.scrollTo).toHaveBeenLastCalledWith({
            left: 0,
            top: 0,
            behavior: 'smooth',
        })

        const scrollLeftAfterCancel = viewport.scrollLeft

        await fireEvent.pointerDown(viewport, {
            pointerId: 5,
            pointerType: 'touch',
            isPrimary: true,
            clientX: 200,
            clientY: 100,
        })
        await fireEvent.pointerMove(viewport, {
            pointerId: 5,
            pointerType: 'touch',
            isPrimary: true,
            clientX: 205,
            clientY: 180,
        })
        await fireEvent.pointerUp(viewport, {
            pointerId: 5,
            pointerType: 'touch',
            isPrimary: true,
            clientX: 205,
            clientY: 180,
        })

        expect(screen.getByText('Page 1 of 3')).not.toBeNull()

        await fireEvent.pointerDown(viewport, {
            pointerId: 6,
            pointerType: 'mouse',
            isPrimary: true,
            clientX: 400,
            clientY: 100,
        })
        await fireEvent.pointerMove(viewport, {
            pointerId: 6,
            pointerType: 'mouse',
            isPrimary: true,
            clientX: 200,
            clientY: 100,
        })
        await fireEvent.pointerUp(viewport, {
            pointerId: 6,
            pointerType: 'mouse',
            isPrimary: true,
            clientX: 200,
            clientY: 100,
        })

        expect(screen.getByText('Page 1 of 3')).not.toBeNull()
        expect(viewport.scrollLeft).toBe(scrollLeftAfterCancel)
    })

    it('uses an instant snap-back when reduced motion is enabled', async () => {
        const originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia')
        Object.defineProperty(window, 'matchMedia', {
            configurable: true,
            value: vi.fn((query: string) => ({
                matches: query === '(prefers-reduced-motion: reduce)',
            })),
        })

        try {
            const { container } = render(ImmersiveReader, baseProps)
            const viewport = await enterFullscreen()
            const measurement = setPagedMeasurements(container, viewport)
            await waitFor(() => expect(screen.getByText('Page 1 of 3')).not.toBeNull())

            measurement.scrollTo.mockClear()
            await fireEvent.pointerDown(viewport, {
                pointerId: 8,
                pointerType: 'touch',
                isPrimary: true,
                clientX: 400,
                clientY: 100,
            })
            await fireEvent.pointerMove(viewport, {
                pointerId: 8,
                pointerType: 'touch',
                isPrimary: true,
                clientX: 350,
                clientY: 102,
            })
            await fireEvent.pointerUp(viewport, {
                pointerId: 8,
                pointerType: 'touch',
                isPrimary: true,
                clientX: 375,
                clientY: 102,
            })

            expect(measurement.scrollTo).toHaveBeenLastCalledWith({
                left: 0,
                top: 0,
                behavior: 'auto',
            })
        } finally {
            if (originalMatchMedia) {
                Object.defineProperty(window, 'matchMedia', originalMatchMedia)
            } else {
                Reflect.deleteProperty(window, 'matchMedia')
            }
        }
    })

    it('uses chapter callbacks at the first page boundary', async () => {
        const { container, rerender } = render(ImmersiveReader, baseProps)
        const viewport = await enterFullscreen()
        setPagedMeasurements(container, viewport)
        await waitFor(() => expect(screen.getByText('Page 1 of 3')).not.toBeNull())

        await fireEvent.keyDown(viewport, { key: 'ArrowLeft' })
        expect(baseProps.onPrevious).toHaveBeenCalledOnce()

        await rerender({
            ...baseProps,
            chapter: { ...chapter, id: 'chapter-1', title: 'Previous Chapter' },
            chapterIndex: 0,
        })

        await waitFor(() => expect(screen.getByText('Page 3 of 3')).not.toBeNull())
    })

    it('uses a full-window fallback when the fullscreen API is unavailable', async () => {
        Reflect.deleteProperty(HTMLElement.prototype, 'requestFullscreen')
        Reflect.deleteProperty(document, 'exitFullscreen')
        const { container } = render(ImmersiveReader, baseProps)

        await fireEvent.click(screen.getByRole('button', { name: 'Full screen' }))

        expect(await screen.findByRole('group', { name: /Paged chapter/i })).not.toBeNull()
        expect(container.querySelector('.immersive-reader.fullscreen-active')).not.toBeNull()
        expect(document.documentElement.style.overflow).toBe('hidden')

        await fireEvent.click(screen.getByRole('button', { name: 'Exit fullscreen' }))
        expect(screen.getByRole('button', { name: 'Full screen' })).not.toBeNull()
        expect(document.documentElement.style.overflow).toBe('')
    })
})
