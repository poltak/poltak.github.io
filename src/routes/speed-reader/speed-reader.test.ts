import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import SpeedReaderPage from './+page.svelte'

const mockStorage = vi.hoisted(() => ({
    init: vi.fn(),
    getBooks: vi.fn(),
    saveBook: vi.fn(),
    getProgress: vi.fn(),
    updateLastReadDate: vi.fn(),
    deleteBook: vi.fn(),
    saveProgress: vi.fn(),
}))

const mockParseEpub = vi.hoisted(() => vi.fn())

vi.mock('poltak-epub-parser', () => {
    return {
        parseEpub: (...args: unknown[]) => mockParseEpub(...args),
    }
})

vi.mock('$lib/storage/epub-storage', () => {
    return {
        epubStorage: mockStorage,
    }
})

const baseEpubData = {
    title: 'Test Book',
    author: 'Test Author',
    chapters: [
        {
            id: 'chapter-1',
            title: 'Chapter 1',
            content: 'Hello world',
            order: 0,
            wordStartIndex: 0,
            wordCount: 2,
        },
    ],
    tableOfContents: [
        {
            title: 'Chapter 1',
            href: '#chapter-1',
            order: 0,
            wordStartIndex: 0,
        },
    ],
    allText: 'Hello world',
}

const storedBook = {
    id: 'book-1',
    title: 'Stored Book',
    author: 'Jane Doe',
    addedDate: new Date('2024-01-01'),
    lastReadDate: new Date('2024-01-02'),
    epubData: baseEpubData,
    totalWords: 2,
}

describe('SpeedReader page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockStorage.init.mockResolvedValue(undefined)
        mockStorage.getBooks.mockResolvedValue([])
        mockStorage.saveBook.mockResolvedValue('book-1')
        mockStorage.getProgress.mockResolvedValue(null)
        mockStorage.updateLastReadDate.mockResolvedValue(undefined)
    })

    it('renders the library header and built-on link', async () => {
        render(SpeedReaderPage)

        expect(await screen.findByText('EPUB Speed Reader')).not.toBeNull()
        const builtOn = await screen.findByText('poltak-epub-parser')
        expect(builtOn).not.toBeNull()
        expect(builtOn.getAttribute('href')).toBe('https://www.npmjs.com/package/poltak-epub-parser')
    })

    it('parses an uploaded EPUB and opens the reader view', async () => {
        mockParseEpub.mockResolvedValue(baseEpubData)

        const { container } = render(SpeedReaderPage)
        const input = container.querySelector('input[type="file"]') as HTMLInputElement
        expect(input).toBeTruthy()

        const file = new File(['epub'], 'book.epub', { type: 'application/epub+zip' })
        await fireEvent.change(input, { target: { files: [file] } })

        await waitFor(() => expect(mockParseEpub).toHaveBeenCalled())
        await waitFor(() => expect(mockStorage.saveBook).toHaveBeenCalled())

        const buttons = await screen.findAllByRole('button', { name: /back to library/i })
        expect(buttons.length).toBeGreaterThan(0)
    })

    it('opens a stored book with keyboard activation', async () => {
        mockStorage.getBooks.mockResolvedValue([storedBook])

        render(SpeedReaderPage)

        const card = await screen.findByRole('button', { name: /Stored Book/i })
        await fireEvent.keyDown(card, { key: 'Enter' })

        await waitFor(() => expect(mockStorage.getProgress).toHaveBeenCalled())
        const buttons = await screen.findAllByRole('button', { name: /back to library/i })
        expect(buttons.length).toBeGreaterThan(0)
    })
})
