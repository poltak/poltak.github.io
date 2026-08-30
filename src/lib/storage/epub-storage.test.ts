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

        expect(add).toHaveBeenCalledOnce()
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
})
