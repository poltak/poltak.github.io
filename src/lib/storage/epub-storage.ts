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
    /** Books saved by older versions have the joined text. It is not read. */
    allText?: string
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
        // The joined text is not stored. It is a second copy of the chapter text.
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
                // A browser can close an idle connection, for example in a background tab.
                db.onclose = () => {
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

    /**
     * Run one transaction and settle when it completes or fails.
     *
     * `work` adds its requests and returns a function that gives the result after completion.
     * If the connection is closed, the database is opened again one time. With an open
     * connection the transaction starts synchronously.
     */
    private run<T>(
        storeNames: string[],
        mode: IDBTransactionMode,
        failureMessage: string,
        work: (transaction: IDBTransaction) => () => T,
    ): Promise<T> {
        const start = (db: IDBDatabase) => {
            const transaction = db.transaction(storeNames, mode)
            return new Promise<T>((resolve, reject) => {
                const fail = () => reject(transaction.error ?? new Error(failureMessage))
                transaction.onerror = fail
                transaction.onabort = fail
                const getResult = work(transaction)
                transaction.oncomplete = () => resolve(getResult())
            })
        }
        const reopen = () =>
            this.init().then(() => {
                if (!this.db) throw new Error(failureMessage)
                return start(this.db)
            })

        if (!this.db) return reopen()
        try {
            return start(this.db)
        } catch (error) {
            // `transaction()` throws this when the browser closed the connection without an event.
            if (!(error instanceof DOMException) || error.name !== 'InvalidStateError') {
                return Promise.reject(error)
            }
            this.db = null
            return reopen()
        }
    }

    async saveBook(epubData: EpubData, totalWords: number): Promise<string> {
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

        return this.run(
            [this.BOOKS_STORE, this.METADATA_STORE],
            'readwrite',
            'Unable to save the EPUB book.',
            (transaction) => {
                transaction.objectStore(this.BOOKS_STORE).add(storedBook)
                transaction.objectStore(this.METADATA_STORE).add(summarizeBook(storedBook))
                return () => bookId
            },
        )
    }

    async getBooks(): Promise<BookSummary[]> {
        return this.run(
            [this.METADATA_STORE],
            'readonly',
            'Unable to read the library.',
            (transaction) => {
                const index = transaction.objectStore(this.METADATA_STORE).index('lastReadDate')
                const request = index.openCursor(null, 'prev') // Most recently read first
                const books: BookSummary[] = []
                request.onsuccess = () => {
                    const cursor = request.result
                    if (!cursor) return
                    books.push(cursor.value)
                    cursor.continue()
                }
                return () => books
            },
        )
    }

    async getBook(bookId: string): Promise<StoredBook | null> {
        return this.run(
            [this.BOOKS_STORE, this.METADATA_STORE],
            'readonly',
            'Unable to read the EPUB book.',
            (transaction) => {
                const request = transaction.objectStore(this.BOOKS_STORE).get(bookId)
                const metadataRequest = transaction.objectStore(this.METADATA_STORE).get(bookId)
                return () =>
                    request.result ? { ...request.result, ...metadataRequest.result } : null
            },
        )
    }

    async deleteBook(bookId: string): Promise<void> {
        return this.run(
            [this.BOOKS_STORE, this.METADATA_STORE, this.PROGRESS_STORE],
            'readwrite',
            'Unable to delete the EPUB book.',
            (transaction) => {
                transaction.objectStore(this.BOOKS_STORE).delete(bookId)
                transaction.objectStore(this.PROGRESS_STORE).delete(bookId)
                transaction.objectStore(this.METADATA_STORE).delete(bookId)
                return () => undefined
            },
        )
    }

    async saveProgress(progress: ReadingProgress): Promise<void> {
        return this.run(
            [this.PROGRESS_STORE, this.METADATA_STORE],
            'readwrite',
            'Unable to save reading progress.',
            (transaction) => {
                transaction.objectStore(this.PROGRESS_STORE).put(progress)

                // Update the book's lastReadDate in the small metadata record.
                const booksStore = transaction.objectStore(this.METADATA_STORE)
                const getBookRequest = booksStore.get(progress.bookId)
                getBookRequest.onsuccess = () => {
                    const book = getBookRequest.result
                    if (book) {
                        book.lastReadDate = progress.lastReadDate
                        booksStore.put(book)
                    }
                }
                return () => undefined
            },
        )
    }

    async getProgress(bookId: string): Promise<ReadingProgress | null> {
        return this.run(
            [this.PROGRESS_STORE],
            'readonly',
            'Unable to read reading progress.',
            (transaction) => {
                const request = transaction.objectStore(this.PROGRESS_STORE).get(bookId)
                return () => request.result || null
            },
        )
    }

    async getAllProgress(): Promise<ReadingProgress[]> {
        return this.run(
            [this.PROGRESS_STORE],
            'readonly',
            'Unable to read reading progress.',
            (transaction) => {
                const request = transaction.objectStore(this.PROGRESS_STORE).getAll()
                return () => request.result
            },
        )
    }

    async updateLastReadDate(bookId: string): Promise<void> {
        const now = new Date()

        return this.run(
            [this.METADATA_STORE],
            'readwrite',
            'Unable to update the book date.',
            (transaction) => {
                const store = transaction.objectStore(this.METADATA_STORE)
                const getRequest = store.get(bookId)
                getRequest.onsuccess = () => {
                    const book = getRequest.result
                    if (book) {
                        book.lastReadDate = now
                        store.put(book)
                    }
                }
                return () => undefined
            },
        )
    }
}

export const epubStorage = new EpubStorage()
