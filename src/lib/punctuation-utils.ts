/**
 * Determines the pause multiplier for a word based on its ending punctuation.
 * Handles complex cases including quotes, brackets, and citation patterns.
 *
 * @param word - The word to analyze
 * @param periodMultiplier - Multiplier for periods (default: 3)
 * @param commaMultiplier - Multiplier for commas (default: 2)
 * @param semicolonMultiplier - Multiplier for semicolons and colons (default: 2.5)
 * @param exclamationMultiplier - Multiplier for exclamation marks and question marks (default: 3)
 * @returns The multiplier to apply to the base reading interval
 */
export function getPunctuationMultiplier(
    word: string,
    periodMultiplier: number = 3,
    commaMultiplier: number = 2,
    semicolonMultiplier: number = 2.5,
    exclamationMultiplier: number = 3,
): number {
    /*
     * Look at the *first* punctuation mark from the end of the word, but skip over
     * any trailing quote / bracket characters and citation patterns like [1], (123), etc.
     * This way `you?"`, `hello!')`, and `test.[1]` are all handled correctly.
     */
    const trailingSkippable = new Set([
        '"',
        "'",
        '\u201C', // "
        '\u2019', // '
        ')',
        ']',
        '}',
        '\u203A', // ›
        '\u00BB', // »
        '\u201D', // "
        '\u201C', // "
        '\u2018', // '
        '\u2019', // '
        '\u203A', // ›
        '\u00AB', // «
        '\u2039', // ‹
        '\u2010', // ‐
        '-',
        '\u2014', // —
        '\u2013', // –
        '\u2026', // …
    ])

    let wordToAnalyze = word

    // Strategy: repeatedly remove valid citations and trailing chars from the end
    // until we can't remove any more, then look for punctuation
    let changed = true
    while (changed) {
        changed = false

        // FIRST: Remove valid citations from the end, regardless of trailing characters
        const citationPattern = /(\[[0-9]+\]|\([0-9]+\))([^\w]*?)$/
        const citationMatch = wordToAnalyze.match(citationPattern)
        if (citationMatch) {
            const startPos = citationMatch.index
            // Remove just the citation part, leave trailing characters for later processing
            wordToAnalyze = wordToAnalyze.slice(0, startPos) + citationMatch[2]
            changed = true
            continue
        }

        // SECOND: Remove malformed citation patterns
        // Look for any pattern that has opening bracket/paren and some kind of closing
        const potentialCitationPattern = /(\[[^\]]*[\]\)]|\([^\)]*[\)\]])$/
        const potentialMatch = wordToAnalyze.match(potentialCitationPattern)
        if (potentialMatch) {
            const pattern = potentialMatch[0]
            // Check if it's a valid citation: [digits] or (digits)
            const isValidCitation = /^(\[[0-9]+\]|\([0-9]+\))$/.test(pattern)

            if (!isValidCitation) {
                // It looks like a citation but isn't valid, remove it
                wordToAnalyze = wordToAnalyze.slice(0, -pattern.length)
                changed = true
                continue
            }
        }

        // THIRD: Remove skippable trailing characters from the end, one at a time
        // This continues until we hit a non-skippable character or run out of characters
        while (wordToAnalyze.length > 0) {
            const lastChar = wordToAnalyze[wordToAnalyze.length - 1]
            if (!trailingSkippable.has(lastChar)) {
                break
            }
            wordToAnalyze = wordToAnalyze.slice(0, -1)
            changed = true
        }
    }

    // Now find the last character in the cleaned word
    const lastChar = wordToAnalyze.length > 0 ? wordToAnalyze[wordToAnalyze.length - 1] : ''

    if (lastChar === '.') return periodMultiplier
    if (lastChar === ',') return commaMultiplier
    if (lastChar === ';' || lastChar === ':') return semicolonMultiplier
    if (lastChar === '!' || lastChar === '?') return exclamationMultiplier

    return 1 // No relevant punctuation found
}
