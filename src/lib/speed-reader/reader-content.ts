import type { Chapter, TableOfContents } from 'poltak-epub-parser'

export interface ReaderBookSource {
    title: string
    author: string
    chapters: Chapter[]
}

export interface ReaderBook {
    title: string
    author: string
    /** Chapters that have words. `order` is the position in this list. */
    chapters: Chapter[]
    /** One entry for each chapter, in the same order. */
    tableOfContents: TableOfContents[]
    words: string[]
}

/**
 * Build what the readers need from parsed EPUB chapters.
 *
 * The word list comes from the chapter text, so a stored book does not need a second copy of
 * its text. Chapters with no words (a cover or an image page) are left out: such a chapter has
 * the same start index as the next one, so the engine cannot navigate to it.
 */
export function createReaderBook(source: ReaderBookSource): ReaderBook {
    const words: string[] = []
    const chapters: Chapter[] = []

    for (const chapter of source.chapters) {
        const chapterWords = chapter.content.match(/\S+/g)
        if (!chapterWords) continue

        chapters.push({
            ...chapter,
            order: chapters.length,
            wordStartIndex: words.length,
            wordCount: chapterWords.length,
        })
        // A loop, because a spread of a long chapter can exceed the argument limit.
        for (const word of chapterWords) words.push(word)
    }

    return {
        title: source.title,
        author: source.author,
        chapters,
        tableOfContents: chapters.map((chapter) => ({
            title: chapter.title,
            href: `#chapter-${chapter.id}`,
            order: chapter.order,
            wordStartIndex: chapter.wordStartIndex,
        })),
        words,
    }
}

/**
 * Split parser output into readable blocks without interpreting it as HTML.
 * Svelte text interpolation escapes the returned strings.
 */
export function splitPlainTextIntoParagraphs(content: string): string[] {
    const normalizedContent = content.replace(/\r\n?/g, '\n')
    const paragraphBoundary = /\n\s*\n/.test(normalizedContent) ? /\n\s*\n/ : /\n/

    return normalizedContent
        .split(paragraphBoundary)
        .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
        .filter((paragraph) => paragraph.length > 0)
}
