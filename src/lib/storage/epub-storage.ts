import type { EpubData } from 'poltak-epub-parser'

export interface SerializableEpubData {
    title: string
    author: string
    chapters: Array<{
        id: string
        title: string
        content: string
        order: number
        wordStartIndex: number
        wordCount: number
    }>
    tableOfContents: Array<{
        title: string
        href: string
        order: number
        wordStartIndex: number
    }>
    allText: string
}

export interface StoredBook {
    id: string
    title: string
    author?: string
    addedDate: Date
    lastReadDate: Date
    epubData: SerializableEpubData
    totalWords: number
}

export type BookSummary = Omit<StoredBook, 'epubData'>

function summarizeBook(book: StoredBook): BookSummary {
    return {
        id: book.id,
        title: book.title,
        author: book.author,
        addedDate: book.addedDate,
        lastReadDate: book.lastReadDate,
        totalWords: book.totalWords,
    }
}

export interface ReadingProgress {
    bookId: string
    currentWordIndex: number
    wordsPerMinute: number
    lastReadDate: Date
    progressPercentage: number
}

function serializeEpubData(epubData: EpubData): SerializableEpubData {
    return {
        title: epubData.title,
        author: epubData.author,
        chapters: epubData.chapters.map((chapter) => ({
            id: chapter.id,
            title: chapter.title,
            content: chapter.content,
            order: chapter.order,
            wordStartIndex: chapter.wordStartIndex,
            wordCount: chapter.wordCount,
        })),
        tableOfContents: epubData.tableOfContents.map((toc) => ({
            title: toc.title,
            href: toc.href,
            order: toc.order,
            wordStartIndex: toc.wordStartIndex,
        })),
        allText: epubData.allText,
    }
}

export class EpubStorage {
    private db: IDBDatabase | null = null
    private initialization: Promise<void> | null = null
    private readonly DB_NAME = 'EpubSpeedReader'
    private readonly DB_VERSION = 2
    private readonly BOOKS_STORE = 'books'
    private readonly METADATA_STORE = 'book-metadata'
    private readonly PROGRESS_STORE = 'progress'

    async init(): Promise<void> {
        if (this.db) return
        if (this.initialization) return this.initialization
        this.initialization = new Promise<void>((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)
            let cancelled = false

            request.onerror = () => reject(request.error)
            request.onsuccess = () => {
                const db = request.result
                if (cancelled) {
                    db.close()
                    return
                }
                this.db = db
                db.onversionchange = () => {
                    db.close()
                    if (this.db === db) this.db = null
                }
                resolve()
            }

            request.onblocked = () => {
                cancelled = true
                reject(new Error('Another tab is using the EPUB database. Close it and try again.'))
            }

            request.onupgradeneeded = (event) => {
                if (cancelled) {
                    request.transaction?.abort()
                    return
                }
                const db = (event.target as IDBOpenDBRequest).result

                // Create books store
                if (!db.objectStoreNames.contains(this.BOOKS_STORE)) {
                    const booksStore = db.createObjectStore(this.BOOKS_STORE, { keyPath: 'id' })
                    booksStore.createIndex('lastReadDate', 'lastReadDate', { unique: false })
                    booksStore.createIndex('addedDate', 'addedDate', { unique: false })
                }

                // Create progress store
                if (!db.objectStoreNames.contains(this.PROGRESS_STORE)) {
                    const progressStore = db.createObjectStore(this.PROGRESS_STORE, {
                        keyPath: 'bookId',
                    })
                    progressStore.createIndex('lastReadDate', 'lastReadDate', { unique: false })
                }

                if (!db.objectStoreNames.contains(this.METADATA_STORE)) {
                    const metadata = db.createObjectStore(this.METADATA_STORE, { keyPath: 'id' })
                    metadata.createIndex('lastReadDate', 'lastReadDate', { unique: false })
                    // The upgrade copies only metadata. Existing book text and progress stay intact.
                    const cursorRequest = request
                        .transaction!.objectStore(this.BOOKS_STORE)
                        .openCursor()
                    cursorRequest.onsuccess = () => {
                        const cursor = cursorRequest.result
                        if (!cursor) return
                        metadata.put(summarizeBook(cursor.value))
                        cursor.continue()
                    }
                }
            }
        }).finally(() => {
            this.initialization = null
        })
        return this.initialization
    }

    private ensureDb(): IDBDatabase {
        if (!this.db) {
            throw new Error('Database not initialized. Call init() first.')
        }
        return this.db
    }

    async saveBook(epubData: EpubData, totalWords: number): Promise<string> {
        const db = this.ensureDb()
        const bookId = crypto.randomUUID()
        const now = new Date()

        // Sanitize the EpubData to ensure it can be stored in IndexedDB
        const sanitizedEpubData = serializeEpubData(epubData)

        const storedBook: StoredBook = {
            id: bookId,
            title: epubData.title || 'Untitled Book',
            author: epubData.author,
            addedDate: now,
            lastReadDate: now,
            epubData: sanitizedEpubData,
            totalWords,
        }

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.BOOKS_STORE, this.METADATA_STORE], 'readwrite')
            const store = transaction.objectStore(this.BOOKS_STORE)
            transaction.oncomplete = () => resolve(bookId)
            transaction.onerror = () =>
                reject(transaction.error ?? new Error('Unable to save the EPUB book.'))
            transaction.onabort = () =>
                reject(transaction.error ?? new Error('Unable to save the EPUB book.'))
            store.add(storedBook)
            transaction.objectStore(this.METADATA_STORE).add(summarizeBook(storedBook))
        })
    }

    async getBooks(): Promise<BookSummary[]> {
        const db = this.ensureDb()

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.METADATA_STORE], 'readonly')
            const store = transaction.objectStore(this.METADATA_STORE)
            const index = store.index('lastReadDate')
            const request = index.openCursor(null, 'prev') // Most recently read first

            const books: BookSummary[] = []
            request.onsuccess = () => {
                const cursor = request.result
                if (cursor) {
                    books.push(cursor.value)
                    cursor.continue()
                } else {
                    resolve(books)
                }
            }
            request.onerror = () => reject(request.error)
        })
    }

    async getBook(bookId: string): Promise<StoredBook | null> {
        const db = this.ensureDb()

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.BOOKS_STORE, this.METADATA_STORE], 'readonly')
            const store = transaction.objectStore(this.BOOKS_STORE)
            const request = store.get(bookId)
            const metadataRequest = transaction.objectStore(this.METADATA_STORE).get(bookId)

            transaction.oncomplete = () =>
                resolve(request.result ? { ...request.result, ...metadataRequest.result } : null)
            transaction.onerror = transaction.onabort = () => reject(transaction.error)
        })
    }

    async deleteBook(bookId: string): Promise<void> {
        const db = this.ensureDb()

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(
                [this.BOOKS_STORE, this.METADATA_STORE, this.PROGRESS_STORE],
                'readwrite',
            )

            const booksStore = transaction.objectStore(this.BOOKS_STORE)
            const progressStore = transaction.objectStore(this.PROGRESS_STORE)

            booksStore.delete(bookId)
            progressStore.delete(bookId)
            transaction.objectStore(this.METADATA_STORE).delete(bookId)

            transaction.oncomplete = () => resolve()
            transaction.onerror = () =>
                reject(transaction.error ?? new Error('Unable to delete the EPUB book.'))
            transaction.onabort = () =>
                reject(transaction.error ?? new Error('Unable to delete the EPUB book.'))
        })
    }

    async saveProgress(progress: ReadingProgress): Promise<void> {
        const db = this.ensureDb()

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(
                [this.PROGRESS_STORE, this.METADATA_STORE],
                'readwrite',
            )

            // Update progress
            const progressStore = transaction.objectStore(this.PROGRESS_STORE)
            progressStore.put(progress)

            // Update book's lastReadDate
            const booksStore = transaction.objectStore(this.METADATA_STORE)
            const getBookRequest = booksStore.get(progress.bookId)

            getBookRequest.onsuccess = () => {
                const book = getBookRequest.result
                if (book) {
                    book.lastReadDate = progress.lastReadDate
                    booksStore.put(book)
                }
            }

            transaction.oncomplete = () => resolve()
            transaction.onerror = () =>
                reject(transaction.error ?? new Error('Unable to save reading progress.'))
            transaction.onabort = () =>
                reject(transaction.error ?? new Error('Unable to save reading progress.'))
        })
    }

    async getProgress(bookId: string): Promise<ReadingProgress | null> {
        const db = this.ensureDb()

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.PROGRESS_STORE], 'readonly')
            const store = transaction.objectStore(this.PROGRESS_STORE)
            const request = store.get(bookId)

            request.onsuccess = () => resolve(request.result || null)
            request.onerror = () => reject(request.error)
        })
    }

    async getAllProgress(): Promise<ReadingProgress[]> {
        const transaction = this.ensureDb().transaction([this.PROGRESS_STORE], 'readonly')
        const request = transaction.objectStore(this.PROGRESS_STORE).getAll()
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(request.error)
        })
    }

    async updateLastReadDate(bookId: string): Promise<void> {
        const db = this.ensureDb()
        const now = new Date()

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.METADATA_STORE], 'readwrite')
            const store = transaction.objectStore(this.METADATA_STORE)
            const getRequest = store.get(bookId)

            getRequest.onsuccess = () => {
                const book = getRequest.result
                if (book) {
                    book.lastReadDate = now
                    store.put(book)
                }
            }

            transaction.oncomplete = () => resolve()
            transaction.onerror = () =>
                reject(transaction.error ?? new Error('Unable to update the book date.'))
            transaction.onabort = () =>
                reject(transaction.error ?? new Error('Unable to update the book date.'))
        })
    }
}

export const epubStorage = new EpubStorage()
