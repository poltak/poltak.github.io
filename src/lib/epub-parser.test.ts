import { describe, test, expect, beforeEach, vi } from 'vitest'
import { EpubParser } from './epub-parser.js'
import {
    createMockEpubFile,
    BOOK_MINIMAL,
    BOOK_COMPLEX,
    BOOK_EDGE_CASE,
    mockChaptersToExpectedData,
    type MockChapter,
    type MockEpubOptions,
} from './test-utils/epub-fixtures.js'

vi.mock('@zip.js/zip.js', () => {
    return {
        ZipReader: vi.fn().mockImplementation((blobReader: { file: Blob }) => ({
            getEntries: vi.fn().mockImplementation(async () => {
                // Get the original Blob from the BlobReader
                const originalBlob = blobReader.file

                // Create a FileReader to read the blob content (works in JSDOM)
                const reader = new FileReader()
                const textPromise = new Promise<string>((resolve, reject) => {
                    reader.onload = () => resolve(reader.result as string)
                    reader.onerror = () => reject(reader.error)
                })
                reader.readAsText(originalBlob)

                const text = await textPromise
                const fileData = JSON.parse(text) as Record<string, string>

                return Object.entries(fileData).map(([filename, content]) => ({
                    filename,
                    getData: vi.fn().mockResolvedValue(content),
                }))
            }),
            close: vi.fn().mockResolvedValue(undefined),
        })),
        BlobReader: vi.fn().mockImplementation((file) => ({ file })),
        TextWriter: vi.fn().mockImplementation(() => ({})),
    }
})

describe('EpubParser', () => {
    let parser: EpubParser

    beforeEach(() => {
        parser = new EpubParser()
        vi.clearAllMocks()
    })

    describe('parseFile', () => {
        test('should parse a basic EPUB file successfully', async () => {
            const book: MockEpubOptions = {
                title: 'Test Novel',
                author: 'Jane Doe',
                chapters: [
                    { title: 'Prologue', content: 'Once upon a time in a distant land.' },
                    {
                        title: 'The Beginning',
                        content: 'Our hero started their journey with great determination.',
                    },
                ],
            }

            const mockFile = createMockEpubFile(book)
            const result = await parser.parseFile(mockFile)

            expect(result).toBeDefined()
            expect(result.title).toBe(book.title)
            expect(result.author).toBe(book.author)
            expect(result.chapters).toEqual(mockChaptersToExpectedData(book.chapters!, 'chapters'))
            expect(result.tableOfContents).toEqual(
                mockChaptersToExpectedData(book.chapters!, 'toc'),
            )
            expect(result.allText).toEqual(mockChaptersToExpectedData(book.chapters!, 'all-text'))
        })

        test('should handle chapters with correct order and word counts', async () => {
            const chapters: MockChapter[] = [
                { title: 'Chapter One', content: 'This is a short chapter.' },
                {
                    title: 'Chapter Two',
                    content:
                        'This is a much longer chapter with significantly more words to count properly.',
                },
            ]

            const mockFile = createMockEpubFile({ chapters })
            const result = await parser.parseFile(mockFile)

            expect(result.chapters[0].order).toBe(0)
            expect(result.chapters[1].order).toBe(1)
            // Note: Word count includes the chapter title from the HTML <h1> tag
            // "Chapter One" (2 words) + "This is a short chapter." (5 words) = 7 words total
            expect(result.chapters[0].wordCount).toBe(7)
            // "Chapter Two" (2 words) + content (13 words) = 15 words total
            expect(result.chapters[1].wordCount).toBe(15)
        })

        test('should calculate word start indices correctly', async () => {
            const chapters: MockChapter[] = [
                { title: 'First', content: 'One two three four five.' },
                { title: 'Second', content: 'Six seven eight nine ten eleven twelve.' },
            ]

            const mockFile = createMockEpubFile({ chapters })
            const result = await parser.parseFile(mockFile)

            expect(result.chapters[0].wordStartIndex).toBe(0)
            // First chapter: "First" (1) + "One two three four five." (5) = 6 words
            expect(result.chapters[1].wordStartIndex).toBe(6)
        })

        test('should generate table of contents correctly', async () => {
            const mockFile = createMockEpubFile({
                chapters: [
                    { title: 'Introduction', content: 'Welcome to the book.' },
                    { title: 'Main Content', content: 'Here is the main story.' },
                ],
            })

            const result = await parser.parseFile(mockFile)

            expect(result.tableOfContents).toHaveLength(2)
            expect(result.tableOfContents[0].title).toBe('Introduction')
            expect(result.tableOfContents[0].href).toMatch(/^#chapter-/)
            expect(result.tableOfContents[0].order).toBe(0)
            expect(result.tableOfContents[0].wordStartIndex).toBe(0)
        })

        test('should combine all text properly', async () => {
            const mockFile = createMockEpubFile({
                chapters: [
                    { title: 'Part 1', content: 'First part content.' },
                    { title: 'Part 2', content: 'Second part content.' },
                ],
            })

            const result = await parser.parseFile(mockFile)

            expect(result.allText).toContain('First part content')
            expect(result.allText).toContain('Second part content')
            // Total: "Part 1" (2) + "First part content." (3) + "Part 2" (2) + "Second part content." (3) = 10 words
            expect(result.allText.split(/\s+/).length).toBe(10)
        })

        test('should handle missing or unknown metadata gracefully', async () => {
            const mockFile = createMockEpubFile({
                title: '',
                author: '',
                chapters: [{ title: 'Only Chapter', content: 'Some content here.' }],
            })

            const result = await parser.parseFile(mockFile)

            expect(result.title).toBe('Unknown Title')
            expect(result.author).toBe('Unknown Author')
            expect(result.chapters).toHaveLength(1)
        })

        test('should handle chapters without explicit titles', async () => {
            const mockFile = createMockEpubFile({
                chapters: [
                    { title: '', content: 'Content without a clear title.' },
                    { title: '', content: 'Another chapter without title.' },
                ],
            })

            const result = await parser.parseFile(mockFile)

            // Should generate default titles
            expect(result.chapters[0].title).toBe('Chapter 1')
            expect(result.chapters[1].title).toBe('Chapter 2')
        })

        test('should handle empty chapters', async () => {
            const mockFile = createMockEpubFile({
                chapters: [
                    { title: 'Empty Chapter', content: '' },
                    { title: 'Normal Chapter', content: 'This has content.' },
                ],
            })

            const result = await parser.parseFile(mockFile)

            // Even empty chapters have the title in the HTML: "Empty Chapter" = 2 words
            expect(result.chapters[0].wordCount).toBe(2)
            // "Normal Chapter" (2) + "This has content." (3) = 5 words
            expect(result.chapters[1].wordCount).toBe(5)
            // Second chapter starts after first chapter's words
            expect(result.chapters[1].wordStartIndex).toBe(2)
        })

        test('should use predefined minimal book fixture', async () => {
            const mockFile = createMockEpubFile(BOOK_MINIMAL)
            const result = await parser.parseFile(mockFile)

            expect(result.title).toBe(BOOK_MINIMAL.title)
            expect(result.author).toBe(BOOK_MINIMAL.author)
            expect(result.chapters).toEqual(
                mockChaptersToExpectedData(BOOK_MINIMAL.chapters!, 'chapters'),
            )
            expect(result.tableOfContents).toEqual(
                mockChaptersToExpectedData(BOOK_MINIMAL.chapters!, 'toc'),
            )
            expect(result.allText).toBe(
                mockChaptersToExpectedData(BOOK_MINIMAL.chapters!, 'all-text'),
            )
        })

        test('should use complex book fixture', async () => {
            const mockFile = createMockEpubFile(BOOK_COMPLEX)
            const result = await parser.parseFile(mockFile)

            expect(result.title).toBe('Complex Test Novel')
            expect(result.author).toBe('Advanced Test Author')
            expect(result.chapters).toEqual(
                mockChaptersToExpectedData(BOOK_COMPLEX.chapters!, 'chapters'),
            )
            expect(result.tableOfContents).toEqual(
                mockChaptersToExpectedData(BOOK_COMPLEX.chapters!, 'toc'),
            )
            expect(result.allText).toEqual(
                mockChaptersToExpectedData(BOOK_COMPLEX.chapters!, 'all-text'),
            )
        })

        test('should handle edge case book fixture', async () => {
            const mockFile = createMockEpubFile(BOOK_EDGE_CASE)
            const result = await parser.parseFile(mockFile)

            expect(result.title).toBe('Edge Case Book')
            expect(result.chapters).toEqual(
                mockChaptersToExpectedData(BOOK_EDGE_CASE.chapters!, 'chapters'),
            )
            expect(result.tableOfContents).toEqual(
                mockChaptersToExpectedData(BOOK_EDGE_CASE.chapters!, 'toc'),
            )
            expect(result.allText).toEqual(
                mockChaptersToExpectedData(BOOK_EDGE_CASE.chapters!, 'all-text'),
            )
        })
    })

    describe('error handling', () => {
        test('should throw error for invalid file structure', async () => {
            const invalidFile = new Blob(['invalid content'], { type: 'application/epub+zip' })

            await expect(parser.parseFile(invalidFile)).rejects.toThrow()
        })

        test('should handle missing container.xml', async () => {
            // Create a file without proper container.xml
            const filesWithoutContainer = { 'some-file.txt': 'content' }
            const invalidFile = new Blob([JSON.stringify(filesWithoutContainer)], {
                type: 'application/epub+zip',
            })

            await expect(parser.parseFile(invalidFile)).rejects.toThrow('Container.xml not found')
        })
    })

    describe('NCX enhancement', () => {
        test('should enhance chapter titles from NCX when available', async () => {
            const mockFile = createMockEpubFile({
                hasNCX: true,
                chapters: [
                    { title: 'Generic Title 1', content: 'Content 1' },
                    { title: 'Generic Title 2', content: 'Content 2' },
                ],
            })

            const result = await parser.parseFile(mockFile)

            // Titles should be enhanced from NCX
            expect(result.chapters[0].title).toBe('Generic Title 1')
            expect(result.chapters[1].title).toBe('Generic Title 2')
        })

        test('should work without NCX file', async () => {
            const mockFile = createMockEpubFile({
                hasNCX: false,
                chapters: [{ title: 'Original Title', content: 'Content here' }],
            })

            const result = await parser.parseFile(mockFile)

            expect(result.chapters[0].title).toBe('Original Title')
        })
    })

    describe('text extraction', () => {
        test('should extract clean text from HTML content', async () => {
            const chaptersWithHTML = [
                {
                    title: 'HTML Chapter',
                    content: 'This has emphasized and bold text.',
                },
            ]

            const mockFile = createMockEpubFile({ chapters: chaptersWithHTML })
            const result = await parser.parseFile(mockFile)

            expect(result.chapters[0].content).toContain('emphasized')
            expect(result.chapters[0].content).toContain('bold')
        })

        test('should handle various heading structures for titles', async () => {
            const chaptersWithHeadings = [
                {
                    title: 'Extracted Title',
                    content: 'Chapter content follows.',
                },
            ]

            const mockFile = createMockEpubFile({ chapters: chaptersWithHeadings })
            const result = await parser.parseFile(mockFile)

            expect(result.chapters[0].title).toBe('Extracted Title')
        })
    })
})
