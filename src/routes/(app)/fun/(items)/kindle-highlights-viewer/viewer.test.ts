import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MiniSearch from 'minisearch'
import Viewer from './+page.svelte'

const parse = vi.hoisted(() => vi.fn())
vi.mock('kindle-highlights-parser', () => ({ parseClippings: parse }))

describe('clippings viewer', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        vi.stubGlobal('indexedDB', undefined)
        parse.mockReturnValue({
            normalized: Array.from({ length: 80 }, (_, sourceIndex) => ({
                sourceIndex,
                title: 'Book',
                author: 'Author',
                type: sourceIndex < 50 ? 'Highlight' : 'Note',
                content: `entry ${sourceIndex}`,
            })),
        })
    })
    afterEach(() => {
        cleanup()
        vi.unstubAllGlobals()
    })

    async function upload() {
        await fireEvent.change(document.querySelector('input[type="file"]')!, {
            target: { files: [{ name: 'clippings.txt', text: async () => 'clippings' }] },
        })
        await waitFor(() => expect(document.querySelectorAll('.viewer-item')).toHaveLength(25))
    }

    it('changes pages without rerunning search and resets the page when filters change', async () => {
        const search = vi.spyOn(MiniSearch.prototype, 'search')
        render(Viewer)
        await upload()
        await fireEvent.input(screen.getByRole('searchbox'), { target: { value: 'entry' } })
        expect(search).toHaveBeenCalledOnce()
        await fireEvent.click(screen.getByRole('button', { name: 'Next', exact: true }))
        expect(screen.getByText('Page 2 of 4')).toBeTruthy()
        expect(search).toHaveBeenCalledOnce()
        await fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'Highlight' } })
        expect(screen.getByText('Page 1 of 2')).toBeTruthy()
    })

    it('renders highlighted markup as literal text', async () => {
        const content = '<img src=x onerror=bad()> amp &amp; &'
        parse.mockReturnValue({
            normalized: [{ sourceIndex: 0, title: 'Book', type: 'Highlight', content }],
        })
        const { container } = render(Viewer)
        await fireEvent.change(container.querySelector('input[type="file"]')!, {
            target: { files: [{ name: 'clippings.txt', text: async () => 'clippings' }] },
        })
        await fireEvent.input(screen.getByRole('searchbox'), { target: { value: 'amp' } })
        const displayed = container.querySelector('.viewer-content')!
        expect(displayed.textContent?.trim()).toBe(content)
        expect(displayed.querySelector('img')).toBeNull()
        expect(displayed.querySelectorAll('mark')).toHaveLength(2)
    })
})
