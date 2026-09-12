import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { createRawSnippet } from 'svelte'
import { writable } from 'svelte/store'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Layout from './+layout.svelte'

vi.mock('$app/stores', () => ({ page: writable({ url: new URL('https://example.com/') }) }))

describe('theme controls', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        localStorage.clear()
        vi.stubGlobal(
            'matchMedia',
            vi.fn(() => ({
                matches: false,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            })),
        )
    })
    afterEach(() => {
        cleanup()
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    function mount() {
        return render(Layout, {
            children: createRawSnippet(() => ({ render: () => '<p>Content</p>' })),
        })
    }

    it('opens once for a touch and closes on the first outside pointer', async () => {
        mount()
        const toggle = screen.getByRole('button', { name: 'Open theme picker' })
        expect(screen.queryByRole('button', { name: 'Switch to Cyan theme' })).toBeNull()
        await fireEvent.touchStart(toggle)
        await fireEvent.click(toggle)
        expect(toggle.getAttribute('aria-expanded')).toBe('true')
        await fireEvent.pointerDown(document.body)
        expect(toggle.getAttribute('aria-expanded')).toBe('false')
    })

    it('keeps controls usable when storage reads and writes fail', async () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('Storage blocked')
        })
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('Storage blocked')
        })
        mount()
        const toggle = screen.getByRole('button', { name: 'Open theme picker' })
        await fireEvent.click(toggle)
        await fireEvent.click(screen.getByRole('button', { name: 'Switch to Amber theme' }))
        expect(document.documentElement.dataset.theme).toBe('amber')
        await fireEvent.keyDown(document, { key: 'Escape' })
        expect(toggle.getAttribute('aria-expanded')).toBe('false')
        expect(document.activeElement).toBe(toggle)
    })
})
