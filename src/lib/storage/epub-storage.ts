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

class EpubStorage {
    private db: IDBDatabase | null = null
    private readonly DB_NAME = 'EpubSpeedReader'
    private readonly DB_VERSION = 1
    private readonly BOOKS_STORE = 'books'
    private readonly PROGRESS_STORE = 'progress'

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

            request.onerror = () => reject(request.error)
            request.onsuccess = () => {
                this.db = request.result
                resolve()
            }

            request.onupgradeneeded = (event) => {
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
            }
        })
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
            const transaction = db.transaction([this.BOOKS_STORE], 'readwrite')
            const store = transaction.objectStore(this.BOOKS_STORE)
            const request = store.add(storedBook)

            request.onsuccess = () => resolve(bookId)
            request.onerror = () => reject(request.error)
        })
    }

    async getBooks(): Promise<StoredBook[]> {
        const db = this.ensureDb()

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.BOOKS_STORE], 'readonly')
            const store = transaction.objectStore(this.BOOKS_STORE)
            const index = store.index('lastReadDate')
            const request = index.openCursor(null, 'prev') // Most recently read first

            const books: StoredBook[] = []
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
            const transaction = db.transaction([this.BOOKS_STORE], 'readonly')
            const store = transaction.objectStore(this.BOOKS_STORE)
            const request = store.get(bookId)

            request.onsuccess = () => resolve(request.result || null)
            request.onerror = () => reject(request.error)
        })
    }

    async deleteBook(bookId: string): Promise<void> {
        const db = this.ensureDb()

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.BOOKS_STORE, this.PROGRESS_STORE], 'readwrite')

            // Delete from both stores
            const booksStore = transaction.objectStore(this.BOOKS_STORE)
            const progressStore = transaction.objectStore(this.PROGRESS_STORE)

            const deleteBook = booksStore.delete(bookId)
            const deleteProgress = progressStore.delete(bookId)

            transaction.oncomplete = () => resolve()
            transaction.onerror = () => reject(transaction.error)
        })
    }

    async saveProgress(progress: ReadingProgress): Promise<void> {
        const db = this.ensureDb()

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.PROGRESS_STORE, this.BOOKS_STORE], 'readwrite')

            // Update progress
            const progressStore = transaction.objectStore(this.PROGRESS_STORE)
            progressStore.put(progress)

            // Update book's lastReadDate
            const booksStore = transaction.objectStore(this.BOOKS_STORE)
            const getBookRequest = booksStore.get(progress.bookId)

            getBookRequest.onsuccess = () => {
                const book = getBookRequest.result
                if (book) {
                    book.lastReadDate = progress.lastReadDate
                    booksStore.put(book)
                }
            }

            transaction.oncomplete = () => resolve()
            transaction.onerror = () => reject(transaction.error)
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

    async updateLastReadDate(bookId: string): Promise<void> {
        const db = this.ensureDb()
        const now = new Date()

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.BOOKS_STORE], 'readwrite')
            const store = transaction.objectStore(this.BOOKS_STORE)
            const getRequest = store.get(bookId)

            getRequest.onsuccess = () => {
                const book = getRequest.result
                if (book) {
                    book.lastReadDate = now
                    store.put(book)
                }
            }

            transaction.oncomplete = () => resolve()
            transaction.onerror = () => reject(transaction.error)
        })
    }
}

export const epubStorage = new EpubStorage()
