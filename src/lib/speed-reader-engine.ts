import { getPunctuationMultiplier } from '$lib/punctuation-utils'
import type { TableOfContents } from 'poltak-epub-parser'

export interface SpeedReaderState {
    allWords: string[]
    tableOfContents: TableOfContents[]
    currentWordIndex: number
    currentChapterIndex: number
    isPlaying: boolean
    isRewinding: boolean
    wordsPerMinute: number
    periodMultiplier: number
    commaMultiplier: number
    semicolonMultiplier: number
    exclamationMultiplier: number
}

interface SpeedReaderOptions {
    onUpdate?: (state: SpeedReaderState) => void
    onChapterChange?: (chapterIndex: number) => void
}

export class SpeedReaderEngine {
    private state: SpeedReaderState
    private readonly onUpdate?: (state: SpeedReaderState) => void
    private readonly onChapterChange?: (chapterIndex: number) => void
    private readingTimeout: number | null = null
    private rewindInterval: number | null = null

    constructor(options: SpeedReaderOptions = {}) {
        this.onUpdate = options.onUpdate
        this.onChapterChange = options.onChapterChange
        this.state = {
            allWords: [],
            tableOfContents: [],
            currentWordIndex: 0,
            currentChapterIndex: 0,
            isPlaying: false,
            isRewinding: false,
            wordsPerMinute: 250,
            periodMultiplier: 3,
            commaMultiplier: 2,
            semicolonMultiplier: 2.5,
            exclamationMultiplier: 3,
        }
    }

    getState(): SpeedReaderState {
        return { ...this.state }
    }

    loadBook(allText: string, tableOfContents: TableOfContents[]) {
        this.state.allWords = allText.split(/\s+/).filter((word) => word.trim().length > 0)
        this.state.tableOfContents = tableOfContents
        this.state.currentWordIndex = 0
        this.state.currentChapterIndex = 0
        this.state.isPlaying = false
        this.state.isRewinding = false
        this.clearTimers()
        this.notify()
    }

    setWordsPerMinute(wordsPerMinute: number) {
        this.state.wordsPerMinute = wordsPerMinute
        if (this.state.isPlaying) {
            this.reschedule()
        }
        this.notify()
    }

    setPunctuationMultipliers(values: {
        periodMultiplier: number
        commaMultiplier: number
        semicolonMultiplier: number
        exclamationMultiplier: number
    }) {
        this.state.periodMultiplier = values.periodMultiplier
        this.state.commaMultiplier = values.commaMultiplier
        this.state.semicolonMultiplier = values.semicolonMultiplier
        this.state.exclamationMultiplier = values.exclamationMultiplier
        if (this.state.isPlaying) {
            this.reschedule()
        }
        this.notify()
    }

    start() {
        if (this.state.allWords.length === 0) return
        if (this.state.isPlaying) return
        this.state.isPlaying = true
        this.reschedule()
        this.notify()
    }

    pause() {
        if (!this.state.isPlaying) return
        this.state.isPlaying = false
        this.clearReadingTimer()
        this.notify()
    }

    toggle() {
        if (this.state.isPlaying) {
            this.pause()
        } else {
            this.start()
        }
    }

    reset() {
        this.pause()
        this.stopRewind()
        this.state.currentWordIndex = 0
        this.state.currentChapterIndex = 0
        this.notify()
    }

    navigateToWord(wordIndex: number) {
        const wasPlaying = this.state.isPlaying
        if (wasPlaying) {
            this.pause()
        }

        const clampedIndex = Math.min(Math.max(0, wordIndex), this.state.allWords.length - 1)
        this.state.currentWordIndex = clampedIndex
        this.state.currentChapterIndex = this.getChapterIndex(clampedIndex)
        this.notify()

        if (wasPlaying) {
            this.start()
        }
    }

    startRewind() {
        if (this.state.allWords.length === 0 || this.state.currentWordIndex <= 0) return
        if (this.state.isRewinding) return

        if (this.state.isPlaying) {
            this.pause()
        }

        this.state.isRewinding = true
        const rewindSpeed = Math.min(this.state.wordsPerMinute * 2, 800)
        const intervalMs = Math.max(60000 / rewindSpeed, 25)

        if (this.rewindInterval) {
            clearInterval(this.rewindInterval)
        }

        this.rewindInterval = window.setInterval(() => {
            if (this.state.currentWordIndex <= 0) {
                this.stopRewind()
                return
            }
            this.state.currentWordIndex -= 1
            this.state.currentChapterIndex = this.getChapterIndex(this.state.currentWordIndex)
            if (this.state.currentWordIndex <= 0) {
                this.state.currentWordIndex = 0
                this.stopRewind()
                return
            }
            this.notify()
        }, intervalMs)

        this.notify()
    }

    stopRewind() {
        if (!this.state.isRewinding) return
        this.state.isRewinding = false
        if (this.rewindInterval) {
            clearInterval(this.rewindInterval)
            this.rewindInterval = null
        }
        this.notify()
    }

    cleanup() {
        this.clearTimers()
    }

    private reschedule() {
        this.clearReadingTimer()
        if (!this.state.isPlaying) return
        this.scheduleNextWord()
    }

    private scheduleNextWord() {
        if (this.state.currentWordIndex >= this.state.allWords.length - 1) {
            this.pause()
            return
        }

        const currentWordText = this.state.allWords[this.state.currentWordIndex] || ''
        const multiplier = getPunctuationMultiplier(
            currentWordText,
            this.state.periodMultiplier,
            this.state.commaMultiplier,
            this.state.semicolonMultiplier,
            this.state.exclamationMultiplier,
        )

        const baseIntervalMs = Math.max(60000 / this.state.wordsPerMinute, 50)
        const actualIntervalMs = baseIntervalMs * multiplier

        this.readingTimeout = window.setTimeout(() => {
            if (!this.state.isPlaying) return

            this.state.currentWordIndex += 1

            const newChapter = this.getChapterIndex(this.state.currentWordIndex)
            if (newChapter !== this.state.currentChapterIndex) {
                this.state.currentChapterIndex = newChapter
                this.pause()
                this.onChapterChange?.(newChapter)
                return
            }

            this.notify()
            this.scheduleNextWord()
        }, actualIntervalMs)
    }

    private getChapterIndex(wordIndex: number): number {
        const toc = this.state.tableOfContents
        if (!toc.length) return 0
        for (let i = toc.length - 1; i >= 0; i--) {
            if (wordIndex >= toc[i].wordStartIndex) return i
        }
        return 0
    }

    private clearReadingTimer() {
        if (this.readingTimeout) {
            clearTimeout(this.readingTimeout)
            this.readingTimeout = null
        }
    }

    private clearTimers() {
        this.clearReadingTimer()
        if (this.rewindInterval) {
            clearInterval(this.rewindInterval)
            this.rewindInterval = null
        }
    }

    private notify() {
        this.onUpdate?.(this.getState())
    }
}
