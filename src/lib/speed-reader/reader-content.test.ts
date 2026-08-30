import { describe, expect, it } from 'vitest'
import { splitPlainTextIntoParagraphs } from './reader-content'

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
