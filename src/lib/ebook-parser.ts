import { ZipReader, BlobReader, TextWriter, type Entry } from '@zip.js/zip.js'
import type { EBook } from '$lib/stores/ebook.svelte'

export interface EpubMetadata {
    title: string
    creator: string
    language: string
    identifier: string
    publisher?: string
    description?: string
    rights?: string
    date?: string
}

export interface TocEntry {
    id: string
    label: string
    href: string
    level: number
    children: TocEntry[]
}

export interface WordLocation {
    chapterId: string
    chapterTitle: string
    wordIndex: number
    paragraph: number
    charOffset: number
}

export interface ChapterInfo {
    id: string
    href: string
    title: string
    estimatedWordCount: number
    content?: string
}

export class EBookParser {
    private zipReader: ZipReader<string> | null = null
    private entries: Entry[] = []
    private opfPath: string = ''
    private opfDir: string = ''
    private itemMap: Map<string, string> = new Map()
    private contentPaths: string[] = []
    private tocPath: string = ''
    private metadata: EpubMetadata | null = null
    private toc: TocEntry[] = []
    private wordIndices: Map<string, WordLocation[]> = new Map()
    private chapters: ChapterInfo[] = []
    private currentChapterIndex: number = 0

    constructor(private book: EBook) {}

    async initialize(): Promise<void> {
        this.zipReader = new ZipReader(new BlobReader(this.book.file))
        this.entries = await this.zipReader.getEntries()
        await this.parseContainer()
        await this.parseOpf()
        await this.analyzeToc()
    }

    private async parseContainer(): Promise<void> {
        const containerEntry = this.entries.find(
            (entry) => entry.filename === 'META-INF/container.xml',
        )
        if (!containerEntry?.getData) throw new Error('No valid container.xml found')

        const containerText = await containerEntry.getData(new TextWriter())
        const parser = new DOMParser()
        const containerDoc = parser.parseFromString(containerText, 'text/xml')

        const rootfile = containerDoc.querySelector('rootfile')
        if (!rootfile) throw new Error('No rootfile found in container.xml')

        this.opfPath = rootfile.getAttribute('full-path') || ''
        if (!this.opfPath) throw new Error('No OPF path found')

        this.opfDir = this.opfPath.split('/').slice(0, -1).join('/')
    }

    private async parseOpf(): Promise<void> {
        const opfEntry = this.entries.find((entry) => entry.filename === this.opfPath)
        if (!opfEntry?.getData) throw new Error('No valid OPF file found')

        const opfText = await opfEntry.getData(new TextWriter())
        const parser = new DOMParser()
        const opfDoc = parser.parseFromString(opfText, 'text/xml')

        // Parse metadata
        const metadataEl = opfDoc.querySelector('metadata')
        if (metadataEl) {
            this.metadata = this.extractMetadata(metadataEl)
        }

        // Parse manifest
        const manifest = opfDoc.querySelector('manifest')
        if (!manifest) throw new Error('No manifest found in OPF')

        const items = Array.from(manifest.querySelectorAll('item'))
        this.itemMap = new Map(
            items.map((item) => [item.getAttribute('id') || '', item.getAttribute('href') || '']),
        )

        // Find TOC file
        const tocItem = items.find(
            (item) =>
                item.getAttribute('properties')?.includes('nav') ||
                item.getAttribute('media-type') === 'application/x-dtbncx+xml',
        )
        if (tocItem) {
            this.tocPath = this.resolvePath(tocItem.getAttribute('href') || '')
        }

        // Get reading order
        const spine = opfDoc.querySelector('spine')
        if (!spine) throw new Error('No spine found in OPF')

        const itemrefs = Array.from(spine.querySelectorAll('itemref'))
        this.contentPaths = itemrefs
            .map((itemref) => itemref.getAttribute('idref'))
            .filter((id): id is string => id !== null)
            .map((id) => this.itemMap.get(id))
            .filter((path): path is string => path !== undefined)
            .map((path) => this.resolvePath(path))
    }

    private resolvePath(path: string): string {
        return this.opfDir ? `${this.opfDir}/${path}` : path
    }

    private extractMetadata(metadataEl: Element): EpubMetadata {
        const getValue = (selector: string): string => {
            const el = metadataEl.querySelector(selector)
            return el?.textContent?.trim() || ''
        }

        return {
            title: getValue('dc\\:title, title'),
            creator: getValue('dc\\:creator, creator'),
            language: getValue('dc\\:language, language'),
            identifier: getValue('dc\\:identifier, identifier'),
            publisher: getValue('dc\\:publisher, publisher'),
            description: getValue('dc\\:description, description'),
            rights: getValue('dc\\:rights, rights'),
            date: getValue('dc\\:date, date'),
        }
    }

    async getMetadata(): Promise<EpubMetadata> {
        if (!this.metadata) {
            await this.initialize()
        }
        return (
            this.metadata || {
                title: this.book.title,
                creator: this.book.author,
                language: 'unknown',
                identifier: this.book.id,
            }
        )
    }

    async getToc(): Promise<TocEntry[]> {
        if (!this.zipReader) await this.initialize()
        if (this.toc.length > 0) return this.toc

        if (!this.tocPath) return []

        const tocEntry = this.entries.find((entry) => entry.filename === this.tocPath)
        if (!tocEntry?.getData) return []

        const tocText = await tocEntry.getData(new TextWriter())
        const parser = new DOMParser()
        const tocDoc = parser.parseFromString(tocText, 'text/html')

        // Try EPUB3 nav first
        const nav = tocDoc.querySelector('nav[epub\\:type="toc"], nav[*|type="toc"]')
        if (nav) {
            this.toc = this.parseNav(nav)
        } else {
            // Fallback to EPUB2 NCX
            const ncx = tocDoc.querySelector('ncx')
            if (ncx) {
                this.toc = this.parseNcx(ncx)
            }
        }

        return this.toc
    }

    private parseNav(nav: Element, level: number = 0): TocEntry[] {
        const entries: TocEntry[] = []
        const items = nav.querySelectorAll(':scope > ol > li')

        items.forEach((item) => {
            const link = item.querySelector('a')
            if (link) {
                const entry: TocEntry = {
                    id: link.getAttribute('href') || '',
                    label: link.textContent?.trim() || '',
                    href: link.getAttribute('href') || '',
                    level,
                    children: [],
                }

                const sublist = item.querySelector('ol')
                if (sublist) {
                    entry.children = this.parseNav(sublist, level + 1)
                }

                entries.push(entry)
            }
        })

        return entries
    }

    private parseNcx(ncx: Element): TocEntry[] {
        const parseNavPoint = (navPoint: Element, level: number = 0): TocEntry => {
            const label = navPoint.querySelector('navLabel text')?.textContent || ''
            const content = navPoint.querySelector('content')
            const href = content?.getAttribute('src') || ''

            const entry: TocEntry = {
                id: navPoint.getAttribute('id') || '',
                label,
                href,
                level,
                children: [],
            }

            const childNavPoints = navPoint.querySelectorAll(':scope > navPoint')
            entry.children = Array.from(childNavPoints).map((child) =>
                parseNavPoint(child, level + 1),
            )

            return entry
        }

        const navPoints = ncx.querySelectorAll(':scope > navMap > navPoint')
        return Array.from(navPoints).map((navPoint) => parseNavPoint(navPoint))
    }

    async buildWordIndex(): Promise<Map<string, WordLocation[]>> {
        if (!this.zipReader) await this.initialize()
        if (this.wordIndices.size > 0) return this.wordIndices

        for (const path of this.contentPaths) {
            const entry = this.entries.find((e) => e.filename === path)
            if (!entry?.getData) continue

            const text = await entry.getData(new TextWriter())
            const parser = new DOMParser()
            const doc = parser.parseFromString(text, 'text/html')

            let paragraphIndex = 0
            let wordIndex = 0
            let charOffset = 0

            const processParagraph = (p: Element) => {
                const text = p.textContent || ''
                const words = text.split(/\s+/).filter((word) => word.length > 0)

                words.forEach((word) => {
                    const normalizedWord = word.toLowerCase()
                    const location: WordLocation = {
                        chapterId: path,
                        chapterTitle: doc.title || path,
                        wordIndex,
                        paragraph: paragraphIndex,
                        charOffset,
                    }

                    const locations = this.wordIndices.get(normalizedWord) || []
                    locations.push(location)
                    this.wordIndices.set(normalizedWord, locations)

                    wordIndex++
                    charOffset += word.length + 1 // +1 for space
                })
                paragraphIndex++
            }

            doc.body?.querySelectorAll('p').forEach(processParagraph)
        }

        return this.wordIndices
    }

    async *streamWords(): AsyncGenerator<string, void, unknown> {
        if (!this.zipReader) await this.initialize()

        for (const path of this.contentPaths) {
            const entry = this.entries.find((e) => e.filename === path)
            if (!entry?.getData) continue

            const text = await entry.getData(new TextWriter())
            const parser = new DOMParser()
            const doc = parser.parseFromString(text, 'text/html')
            const content = doc.body?.textContent || ''
            const words = content.split(/\s+/).filter((word) => word.length > 0)

            for (const word of words) {
                yield word
            }
        }
    }

    private async analyzeToc(): Promise<void> {
        const toc = await this.getToc()

        // Flatten TOC to get chapter list
        const flattenToc = (entries: TocEntry[], level: number = 0): TocEntry[] => {
            return entries.reduce((acc, entry) => {
                return [...acc, entry, ...flattenToc(entry.children, level + 1)]
            }, [] as TocEntry[])
        }

        const flatToc = flattenToc(toc)

        // Create chapter info for each TOC entry
        this.chapters = await Promise.all(
            flatToc.map(async (entry) => {
                const href = entry.href.split('#')[0] // Remove fragment
                const fullPath = this.resolvePath(href)
                const content = await this.readFileContent(fullPath)
                const wordCount = content.split(/\s+/).length

                return {
                    id: entry.id,
                    href: fullPath,
                    title: entry.label,
                    estimatedWordCount: wordCount,
                    content,
                }
            }),
        )
    }

    private async readFileContent(path: string): Promise<string> {
        const entry = this.entries.find((e) => e.filename === path)
        if (!entry?.getData) return ''

        const text = await entry.getData(new TextWriter())
        const doc = new DOMParser().parseFromString(text, 'text/html')
        return doc.body?.textContent?.replace(/\s+/g, ' ').trim() || ''
    }

    async getChapters(): Promise<ChapterInfo[]> {
        return this.chapters.map(({ id, title, estimatedWordCount, href }) => ({
            id,
            href,
            title,
            estimatedWordCount,
        }))
    }

    async *streamChapter(chapterId: string): AsyncGenerator<string, void, unknown> {
        const chapter = this.chapters.find((c) => c.id === chapterId)
        if (!chapter?.content) return

        const words = chapter.content.split(/\s+/).filter((word) => word.length > 0)
        for (const word of words) {
            yield word
        }
    }

    getCurrentChapter(): ChapterInfo | null {
        return this.chapters[this.currentChapterIndex] || null
    }

    setCurrentChapter(chapterId: string): boolean {
        const index = this.chapters.findIndex((c) => c.id === chapterId)
        if (index !== -1) {
            this.currentChapterIndex = index
            return true
        }
        return false
    }

    getProgress(): { chapter: number; total: number } {
        return {
            chapter: this.currentChapterIndex + 1,
            total: this.chapters.length,
        }
    }

    async close(): Promise<void> {
        if (this.zipReader) {
            await this.zipReader.close()
            this.zipReader = null
        }
    }
}
