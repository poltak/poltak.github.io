import { describe, expect, it } from 'vitest'
import type { NormalizedClipping } from 'kindle-highlights-parser'
import { createClippingsSearch, createTextHighlighter } from './clippings-search'

describe('clippings search', () => {
    const items = [
        {
            sourceIndex: 0,
            title: 'Book One',
            author: 'Ada',
            type: 'Highlight',
            content: 'Silver river',
        },
        {
            sourceIndex: 0,
            title: 'Book Two',
            author: 'Jon',
            type: 'Note',
            content: 'Silver forest',
        },
    ] as NormalizedClipping[]
    const search = createClippingsSearch(items)

    it('preserves separate clippings even when source indices overlap', () => {
        expect(search({ query: 'silver', type: 'all', title: 'all', author: 'all' })).toEqual(items)
    })

    it('applies filters to both text search and unsearched lists', () => {
        for (const query of ['', 'silver']) {
            expect(search({ query, type: 'Note', title: 'all', author: 'Jon' })).toEqual([items[1]])
            expect(search({ query, type: 'all', title: 'Book One', author: 'all' })).toEqual([
                items[0],
            ])
        }
    })
})

describe('text highlighting', () => {
    it('matches source text without changing HTML-like text or entities', () => {
        const text = '<script>amp &amp; &</script>'
        const parts = createTextHighlighter('amp')(text)
        expect(parts.map((part) => part.text).join('')).toBe(text)
        expect(parts.filter((part) => part.matched).map((part) => part.text)).toEqual([
            'amp',
            'amp',
        ])
    })

    it('treats regex characters as literal text and prefers longer matches', () => {
        const parts = createTextHighlighter('ab abc a+b')('ABC a+b')
        expect(parts.filter((part) => part.matched).map((part) => part.text)).toEqual([
            'ABC',
            'a+b',
        ])
    })
})
