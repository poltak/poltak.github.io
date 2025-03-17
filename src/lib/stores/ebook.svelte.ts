export interface EBook {
    id: string
    title: string
    author: string
    file: Blob
    uploadDate: Date
}

export class EBookStore {
    private db: IDBDatabase | null = null
    private currentBook = $state<EBook | null>(null)
    private books = $state<EBook[]>([])

    constructor(
        private readonly dbName: string = 'epub-reader',
        private readonly dbVersion: number = 1,
        private readonly storeName: string = 'ebooks',
    ) {}

    async #ensureInitialized(): Promise<void> {
        if (this.db) return

        return new Promise<void>((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion)

            request.onerror = () => reject(request.error)
            request.onsuccess = () => {
                this.db = request.result
                resolve()
            }

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id' })
                }
            }
        })
    }

    async addBook(file: File): Promise<void> {
        await this.#ensureInitialized()

        const id = crypto.randomUUID()
        const book: EBook = {
            id,
            title: file.name.replace('.epub', ''), // TODO: extract this from epub metadata
            author: 'Unknown', // TODO: extract this from epub metadata
            file: file,
            uploadDate: new Date(),
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite')
            const store = transaction.objectStore(this.storeName)
            const request = store.add(book)

            request.onsuccess = () => {
                this.books = [...this.books, book]
                this.setCurrentBook(book)
                resolve()
            }
            request.onerror = () => reject(request.error)
        })
    }

    async loadBooks(): Promise<void> {
        await this.#ensureInitialized()

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readonly')
            const store = transaction.objectStore(this.storeName)
            const request = store.getAll()

            request.onsuccess = () => {
                this.books = request.result
                resolve()
            }
            request.onerror = () => reject(request.error)
        })
    }

    setCurrentBook(book: EBook | null): void {
        this.currentBook = book
    }

    getCurrentBook(): EBook | null {
        return this.currentBook
    }

    getBooks(): EBook[] {
        return this.books
    }

    async deleteBook(id: string): Promise<void> {
        await this.#ensureInitialized()

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite')
            const store = transaction.objectStore(this.storeName)
            const request = store.delete(id)

            request.onsuccess = () => {
                this.books = this.books.filter((book) => book.id !== id)
                if (this.currentBook?.id === id) {
                    this.setCurrentBook(null)
                }
                resolve()
            }
            request.onerror = () => reject(request.error)
        })
    }

    async close(): Promise<void> {
        if (this.db) {
            this.db.close()
            this.db = null
        }
    }
}
