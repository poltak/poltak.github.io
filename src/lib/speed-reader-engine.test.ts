import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SpeedReaderEngine } from './speed-reader-engine'

const toc = [
    { title: 'Chapter 1', href: '#c1', order: 0, wordStartIndex: 0 },
    { title: 'Chapter 2', href: '#c2', order: 1, wordStartIndex: 2 },
]

describe('SpeedReaderEngine', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('advances words while playing', () => {
        const engine = new SpeedReaderEngine()
        engine.loadBook('one two three', toc)
        engine.setWordsPerMinute(60000)

        engine.start()
        vi.advanceTimersByTime(50)

        expect(engine.getState().currentWordIndex).toBe(1)
    })

    it('pauses at chapter changes and notifies', () => {
        const onChapterChange = vi.fn()
        const engine = new SpeedReaderEngine({ onChapterChange })
        engine.loadBook('one two three', toc)
        engine.setWordsPerMinute(60000)

        engine.start()
        vi.advanceTimersByTime(100)

        const state = engine.getState()
        expect(state.currentChapterIndex).toBe(1)
        expect(state.isPlaying).toBe(false)
        expect(onChapterChange).toHaveBeenCalledWith(1)
    })

    it('rewinds words and stops at the beginning', () => {
        const engine = new SpeedReaderEngine()
        engine.loadBook('one two three', toc)
        engine.navigateToWord(2)
        engine.setWordsPerMinute(60000)

        engine.startRewind()
        vi.advanceTimersByTime(75)
        expect(engine.getState().currentWordIndex).toBe(1)

        vi.advanceTimersByTime(75)
        expect(engine.getState().currentWordIndex).toBe(0)
        expect(engine.getState().isRewinding).toBe(false)
    })
})
