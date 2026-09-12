import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { EpubData } from 'poltak-epub-parser'
import { EpubStorage } from './epub-storage'

const book: EpubData = {
    title: 'Test book',
    author: 'Test author',
    chapters: [],
    tableOfContents: [],
    allText: 'one two',
}

function createDatabaseHarness() {
    const add = vi.fn()
    const transaction = {
        error: null,
        objectStore: vi.fn(() => ({ add })),
        oncomplete: null,
        onerror: null,
        onabort: null,
    } as unknown as IDBTransaction
    const database = {
        transaction: vi.fn(() => transaction),
        close: vi.fn(),
        onversionchange: null,
    } as unknown as IDBDatabase
    const openRequest = {
        result: database,
        error: null,
        onsuccess: null,
        onerror: null,
        onblocked: null,
        onupgradeneeded: null,
    } as unknown as IDBOpenDBRequest

    vi.stubGlobal('indexedDB', { open: vi.fn(() => openRequest) })

    return { add, database, openRequest, transaction }
}

async function initialize(storage: EpubStorage, request: IDBOpenDBRequest) {
    const initialization = storage.init()
    request.onsuccess?.(new Event('success'))
    await initialization
}

describe('EpubStorage transactions', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000001')
    })

    it('resolves a save only after its transaction completes', async () => {
        const { add, openRequest, transaction } = createDatabaseHarness()
        const storage = new EpubStorage()
        await initialize(storage, openRequest)

        let settled = false
        const saving = storage.saveBook(book, 2).then((bookId) => {
            settled = true
            return bookId
        })
        await Promise.resolve()

        expect(add).toHaveBeenCalledTimes(2)
        expect(add.mock.calls[1][0]).not.toHaveProperty('epubData')
        expect(settled).toBe(false)

        transaction.oncomplete?.(new Event('complete'))
        await expect(saving).resolves.toBe('00000000-0000-4000-8000-000000000001')
    })

    it('rejects a save when its transaction aborts', async () => {
        const { openRequest, transaction } = createDatabaseHarness()
        const storage = new EpubStorage()
        await initialize(storage, openRequest)

        const saving = storage.saveBook(book, 2)
        transaction.onabort?.(new Event('abort'))

        await expect(saving).rejects.toThrow('Unable to save the EPUB book.')
    })

    it('reuses the database connection across simultaneous initializations', async () => {
        const { openRequest } = createDatabaseHarness()
        const storage = new EpubStorage()
        const first = storage.init()
        const second = storage.init()
        openRequest.onsuccess?.(new Event('success'))
        await Promise.all([first, second])
        await storage.init()
        expect(indexedDB.open).toHaveBeenCalledOnce()
    })

    it('migrates legacy metadata without changing the book payload', async () => {
        const { database, openRequest, transaction } = createDatabaseHarness()
        const legacy = {
            id: 'legacy',
            title: book.title,
            author: book.author,
            addedDate: new Date('2024-01-01'),
            lastReadDate: new Date('2024-01-02'),
            totalWords: 2,
            epubData: book,
        }
        const put = vi.fn()
        const createIndex = vi.fn()
        const cursor = { value: legacy, continue: vi.fn() }
        const cursorRequest = { result: cursor, onsuccess: null } as unknown as IDBRequest
        Object.assign(database, {
            objectStoreNames: { contains: (name: string) => name !== 'book-metadata' },
            createObjectStore: vi.fn(() => ({ put, createIndex })),
        })
        Object.assign(openRequest, { transaction })
        vi.mocked(transaction.objectStore).mockReturnValue({
            openCursor: () => cursorRequest,
        } as unknown as IDBObjectStore)
        const storage = new EpubStorage()
        const initialization = storage.init()
        const event = new Event('upgradeneeded')
        Object.defineProperty(event, 'target', { value: openRequest })
        openRequest.onupgradeneeded?.(event as IDBVersionChangeEvent)
        cursorRequest.onsuccess?.(new Event('success'))
        const { epubData: _, ...summary } = legacy
        expect(put).toHaveBeenCalledExactlyOnceWith(summary)
        expect(legacy.epubData).toBe(book)
        expect(cursor.continue).toHaveBeenCalledOnce()
        openRequest.onsuccess?.(new Event('success'))
        await initialization
    })

    it('saves progress without reading or writing the book payload', async () => {
        const { database, openRequest, transaction } = createDatabaseHarness()
        const storage = new EpubStorage()
        await initialize(storage, openRequest)
        const put = vi.fn()
        const metadataRequest = {
            result: { id: 'book-1', title: 'Test book' },
            onsuccess: null,
        } as unknown as IDBRequest
        vi.mocked(transaction.objectStore).mockImplementation((name) => {
            expect(name).not.toBe('books')
            return { put, get: () => metadataRequest } as unknown as IDBObjectStore
        })
        const progress = {
            bookId: 'book-1',
            currentWordIndex: 1,
            wordsPerMinute: 250,
            lastReadDate: new Date(),
            progressPercentage: 100,
        }
        const saving = storage.saveProgress(progress)
        metadataRequest.onsuccess?.(new Event('success'))
        expect(database.transaction).toHaveBeenCalledWith(
            ['progress', 'book-metadata'],
            'readwrite',
        )
        expect(put).toHaveBeenCalledWith(progress)
        expect(put).toHaveBeenCalledWith({
            id: 'book-1',
            title: 'Test book',
            lastReadDate: progress.lastReadDate,
        })
        transaction.oncomplete?.(new Event('complete'))
        await saving
    })
})
