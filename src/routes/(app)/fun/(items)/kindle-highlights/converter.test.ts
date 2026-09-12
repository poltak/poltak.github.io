import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Converter from './+page.svelte'

vi.mock('kindle-highlights-parser', () => ({
    parseClippings: () => ({ normalized: [{ content: 'Hello' }] }),
}))
vi.mock('kindle-highlights-parser/outputs/csv', () => ({ toCsv: () => 'content\nHello' }))
vi.mock('kindle-highlights-parser/outputs/json', () => ({ toJson: () => '[{"content":"Hello"}]' }))

describe('clippings converter resources', () => {
    beforeEach(() => {
        vi.stubGlobal(
            'URL',
            class extends URL {
                static createObjectURL = vi.fn(() => 'blob:download')
                static revokeObjectURL = vi.fn()
            },
        )
    })
    afterEach(() => {
        cleanup()
        vi.unstubAllGlobals()
    })

    it('releases its download when the route is left', async () => {
        const { container, unmount } = render(Converter)
        await fireEvent.change(container.querySelector('input[type="file"]')!, {
            target: { files: [{ name: 'clippings.txt', text: async () => 'clippings' }] },
        })
        await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledOnce())
        unmount()
        expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:download')
    })

    it('does not restore a cleared upload after its file read finishes', async () => {
        let finish!: (text: string) => void
        const { container } = render(Converter)
        await fireEvent.change(container.querySelector('input[type="file"]')!, {
            target: {
                files: [
                    {
                        name: 'clippings.txt',
                        text: () =>
                            new Promise((resolve) => {
                                finish = resolve
                            }),
                    },
                ],
            },
        })
        await fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
        finish('clippings')
        await Promise.resolve()
        expect(URL.createObjectURL).not.toHaveBeenCalled()
    })
})
