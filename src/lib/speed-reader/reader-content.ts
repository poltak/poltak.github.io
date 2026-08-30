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
