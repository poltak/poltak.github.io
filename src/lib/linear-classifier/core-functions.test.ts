import { describe, test, expect, beforeEach, vi } from 'vitest'
import * as coreFunctions from './core-functions.js'

describe('linear classifier', () => {
    test('should throw an error if the input vector length does not match the weight matrix column length', () => {
        const inputVector = [1, 2, 3]
        const weights = [
            [1, 2],
            [3, 4],
            [5, 6],
        ]
        const bias = [1, 2]

        expect(() => coreFunctions.linearClassifier(inputVector, weights, bias)).toThrow()
    })

    test('should throw an error if the bias vector length does not match the weight matrix row length', () => {
        const inputVector = [1, 2, 3]
        const weights = [
            [1, 2, 3],
            [4, 5, 6],
        ]
        const bias = [1, 2, 3]

        expect(() => coreFunctions.linearClassifier(inputVector, weights, bias)).toThrow()
    })

    test('should return the correct class scores', () => {
        const inputVector = [1, 2, 3]
        const weights = [
            [1, 2, 3],
            [4, 5, 6],
        ]
        const bias = [1, 2]

        const result = coreFunctions.linearClassifier(inputVector, weights, bias)
        expect(result).toEqual([14, 32])
    })
})

describe('loss function', () => {
    test('should throw an error if the correct class index is out of bounds', () => {
        const scores = [1, 2, 3]
        expect(() => coreFunctions.calculateLoss(scores, 4)).toThrow()
        expect(() => coreFunctions.calculateLoss(scores, -4)).toThrow()
        expect(() => coreFunctions.calculateLoss([], 0)).toThrow()
    })

    test('should calculate the correct loss', () => {
        const scores = [1, 2, 3]
        expect(coreFunctions.calculateLoss(scores, 0)).toBe(5)
        expect(coreFunctions.calculateLoss(scores, 1)).toBe(2)
        expect(coreFunctions.calculateLoss(scores, 2)).toBe(0)
    })
})

describe('linear classifier with loss function', () => {
    test('should calculate the correct loss', () => {
        const inputVector = [1, 2, 3]
        const weights = [
            [1, 2, 3],
            [4, 5, 6],
        ]
        const bias = [1, 2]

        const scores = coreFunctions.linearClassifier(inputVector, weights, bias)
        expect(scores).toEqual([14, 32])
        expect(coreFunctions.calculateLoss(scores, 0)).toBe(19) // max(0, 14 - 32 + 1)
        expect(coreFunctions.calculateLoss(scores, 1)).toBe(0) // max(0, 32 - 14 + 1)
    })
})
