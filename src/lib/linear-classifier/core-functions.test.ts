import { describe, test, expect, beforeEach, vi } from 'vitest'
import * as coreFunctions from './core-functions.js'

describe('linearClassifier', () => {
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
