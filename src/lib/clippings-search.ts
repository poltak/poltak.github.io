import MiniSearch from 'minisearch'
import type { NormalizedClipping } from 'kindle-highlights-parser'

export interface ClippingFilters {
    query: string
    type: 'all' | 'Highlight' | 'Note'
    title: string
    author: string
}

export function createClippingsSearch(items: NormalizedClipping[]) {
    const index = new MiniSearch({
        fields: ['title', 'author', 'content'],
        searchOptions: { boost: { title: 2, author: 1.5 }, prefix: true, fuzzy: 0.2 },
    })
    index.addAll(items.map((item, id) => ({ ...item, id })))

    return ({ query, type, title, author }: ClippingFilters): NormalizedClipping[] => {
        const matches = (item: NormalizedClipping) =>
            (type === 'all' || item.type === type) &&
            (title === 'all' || (item.title?.trim() || 'Untitled') === title) &&
            (author === 'all' || (item.author?.trim() || 'Unknown Author') === author)

        if (!query.trim()) return items.filter(matches)
        return index
            .search(query.trim(), { filter: (result) => matches(items[result.id]) })
            .map((result) => items[result.id])
    }
}

export function createTextHighlighter(query: string) {
    const tokens = [
        ...new Set(
            query
                .trim()
                .split(/\s+/)
                .filter((token) => token.length > 1),
        ),
    ]
        .sort((a, b) => b.length - a.length)
        .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const pattern = tokens.length ? new RegExp(`(${tokens.join('|')})`, 'gi') : null

    return (value?: string) => {
        const text = value || '—'
        return pattern
            ? text.split(pattern).map((text, index) => ({ text, matched: index % 2 === 1 }))
            : [{ text, matched: false }]
    }
}
