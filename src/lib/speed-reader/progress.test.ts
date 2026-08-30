import { describe, expect, it } from 'vitest'
import { calculateProgressPercentage, clampWordIndex } from './progress'

describe('speed-reader progress helpers', () => {
    it('keeps the first word at zero and marks the final word complete', () => {
        expect(calculateProgressPercentage(0, 10)).toBe(0)
        expect(calculateProgressPercentage(9, 10)).toBe(100)
        expect(calculateProgressPercentage(5, 10)).toBeCloseTo(55.56, 2)
        expect(calculateProgressPercentage(0, 1)).toBe(100)
    })

    it('handles empty and invalid totals safely', () => {
        expect(calculateProgressPercentage(0, 0)).toBe(0)
        expect(calculateProgressPercentage(Number.NaN, 10)).toBe(0)
        expect(calculateProgressPercentage(2, Number.POSITIVE_INFINITY)).toBe(0)
    })

    it('clamps word indices, including empty books', () => {
        expect(clampWordIndex(-2, 10)).toBe(0)
        expect(clampWordIndex(20, 10)).toBe(9)
        expect(clampWordIndex(4.8, 10)).toBe(4)
        expect(clampWordIndex(4, 0)).toBe(0)
    })
})
