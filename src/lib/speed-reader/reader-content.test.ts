import { describe, expect, it } from 'vitest'
import { createReaderBook, splitPlainTextIntoParagraphs } from './reader-content'

describe('splitPlainTextIntoParagraphs', () => {
    it('returns readable blocks from parser plain text', () => {
        expect(splitPlainTextIntoParagraphs(' First line\n\nSecond\r\nline ')).toEqual([
            'First line',
            'Second line',
        ])
    })

    it('supports single-newline blocks from the published parser', () => {
        expect(splitPlainTextIntoParagraphs('First block\nSecond block\nThird block')).toEqual([
            'First block',
            'Second block',
            'Third block',
        ])
    })

    it('does not return empty blocks', () => {
        expect(splitPlainTextIntoParagraphs(' \n\n ')).toEqual([])
    })
})

describe('createReaderBook', () => {
    const chapter = (id: string, content: string) => ({
        id,
        title: `Title ${id}`,
        content,
        order: 99,
        wordStartIndex: 99,
        wordCount: 99,
    })

    it('makes the word list and chapter positions from the chapter text', () => {
        const book = createReaderBook({
            title: 'Book',
            author: 'Author',
            chapters: [chapter('a', ' One  two\nthree '), chapter('b', 'four five')],
        })

        expect(book.words).toEqual(['One', 'two', 'three', 'four', 'five'])
        expect(
            book.chapters.map((item) => [item.order, item.wordStartIndex, item.wordCount]),
        ).toEqual([
            [0, 0, 3],
            [1, 3, 2],
        ])
        expect(book.tableOfContents).toEqual([
            { title: 'Title a', href: '#chapter-a', order: 0, wordStartIndex: 0 },
            { title: 'Title b', href: '#chapter-b', order: 1, wordStartIndex: 3 },
        ])
    })

    it('leaves out chapters with no words, so each chapter has its own start index', () => {
        const book = createReaderBook({
            title: 'Book',
            author: 'Author',
            chapters: [
                chapter('cover', ' \n '),
                chapter('a', 'one two'),
                chapter('image', ''),
                chapter('b', 'three'),
                chapter('end', ''),
            ],
        })

        expect(book.chapters.map((item) => item.id)).toEqual(['a', 'b'])
        expect(book.tableOfContents.map((item) => item.wordStartIndex)).toEqual([0, 2])
        expect(book.words).toHaveLength(3)
    })
})
