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
        History.prototype.replaceState.call(window.history, {}, '', '/')
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
        await fireEvent.click(screen.getByRole('button', { name: 'Next' }))
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

    it('uses the requested site source without racing saved clippings', async () => {
        const open = vi.fn()
        vi.stubGlobal('indexedDB', { open })
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => 'site' }))
        History.prototype.replaceState.call(window.history, {}, '', '?source=site')
        render(Viewer)
        await screen.findByText('Selected: Jon\'s "My Clippings.txt"')
        expect(open).not.toHaveBeenCalled()
    })

    it('keeps the latest upload when file reads finish out of order', async () => {
        let finishFirst!: (text: string) => void
        parse.mockImplementation((text) => ({
            normalized: [{ sourceIndex: 0, title: 'Book', type: 'Highlight', content: text }],
        }))
        const { container } = render(Viewer)
        const input = container.querySelector('input[type="file"]')!
        await fireEvent.change(input, {
            target: {
                files: [
                    {
                        name: 'first.txt',
                        text: () =>
                            new Promise((resolve) => {
                                finishFirst = resolve
                            }),
                    },
                ],
            },
        })
        await fireEvent.change(input, {
            target: { files: [{ name: 'second.txt', text: async () => 'second upload' }] },
        })
        await screen.findByText('second upload')
        finishFirst('first upload')
        await Promise.resolve()
        expect(screen.queryByText('first upload')).toBeNull()
        expect(screen.getByText('second upload')).toBeTruthy()
    })

    it('closes the database when reading saved clippings fails', async () => {
        const close = vi.fn()
        const request = {} as IDBOpenDBRequest
        vi.stubGlobal('indexedDB', {
            open: () => {
                queueMicrotask(() => {
                    Object.assign(request, {
                        result: {
                            close,
                            transaction: () => {
                                throw new Error('Connection closed')
                            },
                        },
                    })
                    request.onsuccess?.(new Event('success'))
                })
                return request
            },
        })
        render(Viewer)
        await screen.findByText('Connection closed')
        expect(close).toHaveBeenCalledOnce()
    })
})
