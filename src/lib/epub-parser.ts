import { ZipReader, BlobReader, TextWriter, type Entry, type FileEntry } from '@zip.js/zip.js'

export interface Chapter {
    id: string
    title: string
    content: string
    order: number
    /** Starting word (global) index for this chapter */
    wordStartIndex: number
    /** Number of words in this chapter */
    wordCount: number
}

export interface TableOfContents {
    title: string
    href: string
    order: number
    /** Starting word (global) index for navigation */
    wordStartIndex: number
}

export interface EpubData {
    title: string
    author: string
    chapters: Chapter[]
    tableOfContents: TableOfContents[]
    /** Combined text for speed reading */
    allText: string
}

export class EpubParser {
    private zipReader: ZipReader<Blob> | null = null
    private containerXml: string = ''
    private opfPath: string = ''
    private opfContent: string = ''

    async parseFile(file: File | Blob): Promise<EpubData> {
        this.zipReader = new ZipReader(new BlobReader(file))

        // Read container.xml to find the OPF file
        await this.readContainer()

        // Read the OPF file to get metadata and manifest
        await this.readOpf()

        const metadata = this.parseMetadata()

        // Parse manifest and spine to get reading order
        const { manifest, spine } = this.parseManifestAndSpine()

        // Read chapters in order
        const chapters = await this.readChapters(manifest, spine)

        // Try to enhance chapter titles from NCX file
        await this.enhanceChapterTitlesFromNCX(chapters, manifest)

        // Calculate word positions for each chapter
        this.calculateWordPositions(chapters)

        const tableOfContents = this.generateTableOfContents(chapters)
        const allText = this.combineAllText(chapters)
        await this.zipReader.close()

        return {
            title: metadata.title,
            author: metadata.author,
            chapters,
            tableOfContents,
            allText,
        }
    }

    private async readContainer(): Promise<void> {
        if (!this.zipReader) throw new Error('ZIP not loaded')

        const entries = await this.zipReader.getEntries()
        const containerEntry = entries.find((entry) => entry.filename === 'META-INF/container.xml')

        if (!this.isFileEntry(containerEntry)) {
            throw new Error('Container.xml not found')
        }

        const textWriter = new TextWriter()
        this.containerXml = await containerEntry.getData(textWriter)

        // Extract OPF path from container.xml
        const parser = new DOMParser()
        const containerDoc = parser.parseFromString(this.containerXml, 'text/xml')
        const rootfileElement = containerDoc.querySelector('rootfile')

        if (!rootfileElement) throw new Error('Rootfile not found in container.xml')

        this.opfPath = rootfileElement.getAttribute('full-path') || ''
        if (!this.opfPath) throw new Error('OPF path not found')
    }

    private async readOpf(): Promise<void> {
        if (!this.zipReader) throw new Error('ZIP not loaded')

        const entries = await this.zipReader.getEntries()
        const opfEntry = entries.find((entry) => entry.filename === this.opfPath)

        if (!this.isFileEntry(opfEntry)) {
            throw new Error('OPF file not found')
        }

        const textWriter = new TextWriter()
        this.opfContent = await opfEntry.getData(textWriter)
    }

    private parseMetadata(): { title: string; author: string } {
        const parser = new DOMParser()
        const opfDoc = parser.parseFromString(this.opfContent, 'text/xml')

        const titleElement = opfDoc.querySelector('metadata title, metadata dc\\:title')
        const authorElement = opfDoc.querySelector('metadata creator, metadata dc\\:creator')

        return {
            title: titleElement?.textContent || 'Unknown Title',
            author: authorElement?.textContent || 'Unknown Author',
        }
    }

    private parseManifestAndSpine(): {
        manifest: Map<string, { href: string; mediaType: string }>
        spine: string[]
    } {
        const parser = new DOMParser()
        const opfDoc = parser.parseFromString(this.opfContent, 'text/xml')

        // Parse manifest
        const manifest = new Map<string, { href: string; mediaType: string }>()
        const manifestItems = opfDoc.querySelectorAll('manifest item')

        manifestItems.forEach((item) => {
            const id = item.getAttribute('id')
            const href = item.getAttribute('href')
            const mediaType = item.getAttribute('media-type')

            if (id && href && mediaType) {
                manifest.set(id, { href, mediaType })
            }
        })

        // Parse spine (reading order)
        const spine: string[] = []
        const spineItems = opfDoc.querySelectorAll('spine itemref')

        spineItems.forEach((item) => {
            const idref = item.getAttribute('idref')
            if (idref) {
                spine.push(idref)
            }
        })

        return { manifest, spine }
    }

    private async readChapters(
        manifest: Map<string, { href: string; mediaType: string }>,
        spine: string[],
    ): Promise<Chapter[]> {
        if (!this.zipReader) throw new Error('ZIP not loaded')

        const chapters: Chapter[] = []
        const basePath = this.opfPath.substring(0, this.opfPath.lastIndexOf('/') + 1)
        const entries = await this.zipReader.getEntries()

        for (let i = 0; i < spine.length; i++) {
            const itemId = spine[i]
            const manifestItem = manifest.get(itemId)

            if (!manifestItem || !manifestItem.mediaType.includes('html')) continue

            const fullPath = basePath + manifestItem.href
            const chapterEntry = entries.find((entry) => entry.filename === fullPath)

            if (!this.isFileEntry(chapterEntry)) continue

            const textWriter = new TextWriter()
            const chapterHtml = await chapterEntry.getData(textWriter)
            const { title, content } = this.extractTextFromHtml(chapterHtml)

            // Count words in this chapter
            const words = content.split(/\s+/).filter((word) => word.trim().length > 0)

            chapters.push({
                id: itemId,
                title: title || `Chapter ${i + 1}`,
                content,
                order: i,
                wordStartIndex: 0, // Will be calculated later
                wordCount: words.length,
            })
        }

        return chapters
    }

    private async enhanceChapterTitlesFromNCX(
        chapters: Chapter[],
        manifest: Map<string, { href: string; mediaType: string }>,
    ): Promise<void> {
        if (!this.zipReader) return

        try {
            // Find NCX file in manifest
            let ncxHref = ''
            for (const [, item] of manifest) {
                if (item.mediaType === 'application/x-dtbncx+xml') {
                    ncxHref = item.href
                    break
                }
            }

            if (!ncxHref) return

            const basePath = this.opfPath.substring(0, this.opfPath.lastIndexOf('/') + 1)
            const fullPath = basePath + ncxHref
            const entries = await this.zipReader.getEntries()
            const ncxEntry = entries.find((entry) => entry.filename === fullPath)

            if (!this.isFileEntry(ncxEntry)) return

            const textWriter = new TextWriter()
            const ncxContent = await ncxEntry.getData(textWriter)

            // Parse NCX XML
            const parser = new DOMParser()
            const ncxDoc = parser.parseFromString(ncxContent, 'text/xml')
            const navPoints = ncxDoc.querySelectorAll('navPoint')

            // Create a map of href to title from NCX
            const ncxTitles = new Map<string, string>()
            navPoints.forEach((navPoint) => {
                const textElement = navPoint.querySelector('text')
                const contentElement = navPoint.querySelector('content')

                if (textElement && contentElement) {
                    const title = textElement.textContent?.trim()
                    const src = contentElement.getAttribute('src')

                    if (title && src) {
                        // Remove fragment identifier (#section1) from src
                        const cleanSrc = src.split('#')[0]
                        ncxTitles.set(cleanSrc, title)
                    }
                }
            })

            // Match chapters with NCX titles
            const basePath2 = this.opfPath.substring(0, this.opfPath.lastIndexOf('/') + 1)
            for (const [id, manifestItem] of manifest) {
                const chapter = chapters.find((ch) => ch.id === id)
                if (chapter && ncxTitles.has(manifestItem.href)) {
                    const ncxTitle = ncxTitles.get(manifestItem.href)
                    if (ncxTitle && ncxTitle.length > 0) {
                        chapter.title = ncxTitle
                    }
                }
            }
        } catch (error) {
            // NCX parsing failed, continue with existing titles
            console.warn('Failed to parse NCX file:', error)
        }
    }

    private calculateWordPositions(chapters: Chapter[]): void {
        let currentWordIndex = 0

        chapters.forEach((chapter) => {
            chapter.wordStartIndex = currentWordIndex
            currentWordIndex += chapter.wordCount
        })
    }

    private extractTextFromHtml(html: string): { title: string; content: string } {
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')

        // Try to find title from various sources with priority order
        let title = ''

        // Priority 1: Look for title in meta tags
        const metaTitle = doc.querySelector('meta[name="title"], meta[property="dc:title"]')
        if (metaTitle) {
            title = metaTitle.getAttribute('content')?.trim() || ''
        }

        // Priority 2: Look for chapter/section headings
        if (!title) {
            const headings = doc.querySelectorAll(
                'h1, h2, h3, .chapter-title, .section-title, [class*="title"], [class*="chapter"], [class*="heading"]',
            )
            for (const heading of headings) {
                const headingText = heading.textContent?.trim() || ''
                if (headingText && headingText.length > 0 && headingText.length < 200) {
                    title = headingText
                    break
                }
            }
        }

        // Priority 3: Look for title tag
        if (!title) {
            const titleElement = doc.querySelector('title')
            if (titleElement) {
                title = titleElement.textContent?.trim() || ''
            }
        }

        // Priority 4: Look for first paragraph that might be a title
        if (!title) {
            const firstParagraphs = doc.querySelectorAll('p, div')
            for (const p of firstParagraphs) {
                const text = p.textContent?.trim() || ''
                if (text && text.length > 3 && text.length < 100 && !text.includes('.')) {
                    title = text
                    break
                }
            }
        }

        // Clean up title
        title = title
            .replace(/^\d+\.\s*/, '') // Remove leading numbers
            .replace(/^Chapter\s+\d+\s*/i, '') // Remove "Chapter" prefix only when followed by a number
            .replace(/^Section\s+\d+\s*/i, '') // Remove "Section" prefix only when followed by a number
            .trim()

        // Extract body text, removing script and style elements
        const scripts = doc.querySelectorAll('script, style')
        scripts.forEach((script) => script.remove())

        const bodyElement = doc.querySelector('body') || doc.documentElement
        const content = bodyElement.textContent?.trim() || ''

        return { title, content }
    }

    private generateTableOfContents(chapters: Chapter[]): TableOfContents[] {
        return chapters.map((chapter, index) => ({
            title: chapter.title,
            href: `#chapter-${chapter.id}`,
            order: index,
            wordStartIndex: chapter.wordStartIndex,
        }))
    }

    private combineAllText(chapters: Chapter[]): string {
        return chapters
            .map((chapter) => chapter.content)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim()
    }

    private isFileEntry(entry: Entry | undefined): entry is FileEntry {
        return Boolean(entry) && entry?.directory === false
    }
}
