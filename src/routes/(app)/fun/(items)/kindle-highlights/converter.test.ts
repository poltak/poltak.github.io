import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Converter from './+page.svelte'

vi.mock('kindle-highlights-parser', () => ({
    parseClippings: () => ({ normalized: [{ content: 'Hello' }] }),
}))
const toCsv = vi.hoisted(() => vi.fn(() => 'content\nHello'))
vi.mock('kindle-highlights-parser/outputs/csv', () => ({ toCsv }))
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

    it('shortens a large preview but copies the full output', async () => {
        const fullOutput = 'x'.repeat(60_000)
        toCsv.mockReturnValueOnce(fullOutput)
        const writeText = vi.fn(async () => {})
        vi.stubGlobal('navigator', { clipboard: { writeText } })

        const { container } = render(Converter)
        await fireEvent.change(container.querySelector('input[type="file"]')!, {
            target: { files: [{ name: 'clippings.txt', text: async () => 'clippings' }] },
        })
        await screen.findByText(/first 50,000 of 60,000\s+characters/)
        expect(container.querySelector('textarea')!.value).toHaveLength(50_000)

        await fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
        expect(writeText).toHaveBeenCalledExactlyOnceWith(fullOutput)
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
