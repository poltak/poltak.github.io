import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ImmersiveReader from './ImmersiveReader.svelte'

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

    Object.defineProperty(viewport, 'clientWidth', { configurable: true, value: 500 })
    Object.defineProperty(content, 'scrollWidth', { configurable: true, value: 1500 })
    Object.defineProperty(viewport, 'scrollTo', {
        configurable: true,
        value: vi.fn(),
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
}

describe('ImmersiveReader fullscreen', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        activeFullscreenElement = null
        installFullscreenMocks()
    })

    afterEach(() => {
        cleanup()
        Reflect.deleteProperty(HTMLElement.prototype, 'requestFullscreen')
        Reflect.deleteProperty(document, 'exitFullscreen')
        Reflect.deleteProperty(document, 'fullscreenElement')
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
