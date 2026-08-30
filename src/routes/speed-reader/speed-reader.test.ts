import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/svelte'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
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

    afterEach(() => {
        cleanup()
    })

    it('renders the library header and built-on link', async () => {
        render(SpeedReaderPage)

        expect(await screen.findByText('EPUB Speed Reader')).not.toBeNull()
        const builtOn = await screen.findByText('poltak-epub-parser')
        expect(builtOn).not.toBeNull()
        expect(builtOn.getAttribute('href')).toBe(
            'https://www.npmjs.com/package/poltak-epub-parser',
        )
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

        const card = await screen.findByRole('button', { name: 'Open Stored Book' })
        await fireEvent.keyDown(card, { key: 'Enter' })
        await fireEvent.click(card)

        await waitFor(() => expect(mockStorage.getProgress).toHaveBeenCalled())
        const buttons = await screen.findAllByRole('button', { name: /back to library/i })
        expect(buttons.length).toBeGreaterThan(0)
    })

    it('keeps delete keyboard activation separate from opening a book', async () => {
        mockStorage.getBooks.mockResolvedValue([storedBook])

        render(SpeedReaderPage)

        const deleteButton = await screen.findByRole('button', { name: 'Delete Stored Book' })
        await fireEvent.keyDown(deleteButton, { key: 'Enter' })
        await fireEvent.click(deleteButton)

        await waitFor(() => expect(mockStorage.deleteBook).toHaveBeenCalledWith('book-1'))
        expect(screen.queryByText('Back to Library')).toBeNull()
    })

    it('opens an uploaded book in the immersive reader with escaped plain text', async () => {
        mockParseEpub.mockResolvedValue({
            ...baseEpubData,
            chapters: [
                { ...baseEpubData.chapters[0], content: '<script>bad()</script>Readable text' },
            ],
            allText: 'Readable text',
        })

        const { container } = render(SpeedReaderPage)
        const input = container.querySelector('input[type="file"]') as HTMLInputElement
        const file = new File(['epub'], 'book.epub', { type: 'application/epub+zip' })
        await fireEvent.change(input, { target: { files: [file] } })
        await waitFor(() => expect(mockStorage.saveBook).toHaveBeenCalled())

        await fireEvent.click(screen.getByRole('button', { name: 'Immersive reader' }))

        expect(screen.getByRole('heading', { name: 'Chapter 1' })).toBeTruthy()
        expect(screen.getByText('<script>bad()</script>Readable text')).toBeTruthy()
        expect(container.querySelector('script')).toBeNull()
    })
})
