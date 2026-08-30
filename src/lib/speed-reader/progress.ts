/**
 * Return progress for a word-indexed reader.
 *
 * The engine keeps the index on the word currently shown. It stops on the
 * final word, so the final index must be treated as complete even though it
 * is not equal to the total word count.
 */
export function calculateProgressPercentage(currentWordIndex: number, totalWords: number): number {
    if (!Number.isFinite(currentWordIndex) || !Number.isFinite(totalWords) || totalWords <= 0) {
        return 0
    }

    if (totalWords === 1 || currentWordIndex >= totalWords - 1) return 100

    return Math.min(100, Math.max(0, (currentWordIndex / (totalWords - 1)) * 100))
}

export function clampWordIndex(currentWordIndex: number, totalWords: number): number {
    if (totalWords <= 0 || !Number.isFinite(totalWords)) return 0
    if (!Number.isFinite(currentWordIndex)) return 0

    return Math.min(Math.max(0, Math.trunc(currentWordIndex)), totalWords - 1)
}
