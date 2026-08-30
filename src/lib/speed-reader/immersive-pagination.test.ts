import { describe, expect, it } from 'vitest'
import {
    calculatePageCount,
    getKeyboardPageTurn,
    getPageDragScrollLeft,
    getPointerPageTurn,
} from './immersive-pagination'

describe('immersive pagination', () => {
    it('calculates full viewport pages and handles missing measurements', () => {
        expect(calculatePageCount(1500, 500)).toBe(3)
        expect(calculatePageCount(1501, 500)).toBe(4)
        expect(calculatePageCount(0, 0)).toBe(1)
    })

    it('follows horizontal drags and clamps them at the book edges', () => {
        const shared = {
            pageWidth: 500,
            viewportWidth: 500,
            contentWidth: 1500,
        }

        expect(getPageDragScrollLeft({ ...shared, currentPage: 0, deltaX: -180 })).toBe(180)
        expect(getPageDragScrollLeft({ ...shared, currentPage: 1, deltaX: 120 })).toBe(380)
        expect(getPageDragScrollLeft({ ...shared, currentPage: 0, deltaX: 180 })).toBe(0)
        expect(getPageDragScrollLeft({ ...shared, currentPage: 2, deltaX: -180 })).toBe(1000)
    })

    it('maps taps on each side to the correct page turn', () => {
        const shared = {
            startY: 100,
            endY: 104,
            viewportLeft: 50,
            viewportWidth: 600,
        }

        expect(getPointerPageTurn({ ...shared, startX: 500, endX: 504 })).toBe('next')
        expect(getPointerPageTurn({ ...shared, startX: 150, endX: 146 })).toBe('previous')
    })

    it('maps horizontal swipes and ignores vertical or ambiguous movement', () => {
        const shared = {
            startY: 200,
            viewportLeft: 0,
            viewportWidth: 600,
        }

        expect(getPointerPageTurn({ ...shared, startX: 500, endX: 350, endY: 210 })).toBe('next')
        expect(getPointerPageTurn({ ...shared, startX: 100, endX: 250, endY: 190 })).toBe(
            'previous',
        )
        expect(getPointerPageTurn({ ...shared, startX: 300, endX: 315, endY: 300 })).toBeNull()
    })

    it('supports page-turn keys without consuming unrelated keys', () => {
        expect(getKeyboardPageTurn('ArrowRight')).toBe('next')
        expect(getKeyboardPageTurn('PageDown')).toBe('next')
        expect(getKeyboardPageTurn(' ')).toBe('next')
        expect(getKeyboardPageTurn('ArrowLeft')).toBe('previous')
        expect(getKeyboardPageTurn('PageUp')).toBe('previous')
        expect(getKeyboardPageTurn(' ', true)).toBe('previous')
        expect(getKeyboardPageTurn('Enter')).toBeNull()
    })
})
