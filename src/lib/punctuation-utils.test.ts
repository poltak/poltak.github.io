import { describe, test, expect } from 'vitest'
import { getPunctuationMultiplier } from '$lib/punctuation-utils'

describe('getPunctuationMultiplier', () => {
    describe('Basic punctuation', () => {
        test('should return period multiplier for words ending with period', () => {
            expect(getPunctuationMultiplier('hello.')).toBe(3)
            expect(getPunctuationMultiplier('world.')).toBe(3)
            expect(getPunctuationMultiplier('sentence.')).toBe(3)
        })

        test('should return comma multiplier for words ending with comma', () => {
            expect(getPunctuationMultiplier('hello,')).toBe(2)
            expect(getPunctuationMultiplier('world,')).toBe(2)
            expect(getPunctuationMultiplier('however,')).toBe(2)
        })

        test('should return semicolon multiplier for words ending with semicolon', () => {
            expect(getPunctuationMultiplier('hello;')).toBe(2.5)
            expect(getPunctuationMultiplier('world;')).toBe(2.5)
        })

        test('should return semicolon multiplier for words ending with colon', () => {
            expect(getPunctuationMultiplier('hello:')).toBe(2.5)
            expect(getPunctuationMultiplier('follows:')).toBe(2.5)
        })

        test('should return exclamation multiplier for words ending with exclamation', () => {
            expect(getPunctuationMultiplier('hello!')).toBe(3)
            expect(getPunctuationMultiplier('wow!')).toBe(3)
        })

        test('should return exclamation multiplier for words ending with question mark', () => {
            expect(getPunctuationMultiplier('hello?')).toBe(3)
            expect(getPunctuationMultiplier('really?')).toBe(3)
        })

        test('should return 1 for words with no punctuation', () => {
            expect(getPunctuationMultiplier('hello')).toBe(1)
            expect(getPunctuationMultiplier('world')).toBe(1)
            expect(getPunctuationMultiplier('test123')).toBe(1)
        })
    })

    describe('Punctuation with trailing quotes and brackets', () => {
        test('should handle punctuation followed by double quotes', () => {
            expect(getPunctuationMultiplier('hello."')).toBe(3)
            expect(getPunctuationMultiplier('said,"')).toBe(2)
            expect(getPunctuationMultiplier('yes!"')).toBe(3)
            expect(getPunctuationMultiplier('why?"')).toBe(3)
        })

        test('should handle punctuation followed by single quotes', () => {
            expect(getPunctuationMultiplier("hello.'")).toBe(3)
            expect(getPunctuationMultiplier("said,'")).toBe(2)
            expect(getPunctuationMultiplier("yes!'")).toBe(3)
            expect(getPunctuationMultiplier("why?'")).toBe(3)
        })

        test('should handle punctuation followed by smart quotes', () => {
            expect(getPunctuationMultiplier('hello.\u2019')).toBe(3) // hello.'
            expect(getPunctuationMultiplier('hello.\u201D')).toBe(3) // hello."
            expect(getPunctuationMultiplier('said,\u2019')).toBe(2) // said,'
            expect(getPunctuationMultiplier('said,\u201D')).toBe(2) // said,"
        })

        test('should handle punctuation followed by parentheses', () => {
            expect(getPunctuationMultiplier('hello.)')).toBe(3)
            expect(getPunctuationMultiplier('said,)')).toBe(2)
            expect(getPunctuationMultiplier('yes!)')).toBe(3)
            expect(getPunctuationMultiplier('why?)')).toBe(3)
        })

        test('should handle punctuation followed by brackets', () => {
            expect(getPunctuationMultiplier('hello.]')).toBe(3)
            expect(getPunctuationMultiplier('said,]')).toBe(2)
            expect(getPunctuationMultiplier('yes!]')).toBe(3)
            expect(getPunctuationMultiplier('why?]')).toBe(3)
        })

        test('should handle multiple trailing characters', () => {
            expect(getPunctuationMultiplier('hello.")')).toBe(3)
            expect(getPunctuationMultiplier('said,")]')).toBe(2)
            expect(getPunctuationMultiplier('yes!"]')).toBe(3)
        })
    })

    describe('Citation patterns', () => {
        test('should handle punctuation followed by bracket citations', () => {
            expect(getPunctuationMultiplier('sentence.[1]')).toBe(3)
            expect(getPunctuationMultiplier('statement.[12]')).toBe(3)
            expect(getPunctuationMultiplier('fact.[123]')).toBe(3)
            expect(getPunctuationMultiplier('quote.[4567]')).toBe(3)
        })

        test('should handle punctuation followed by parenthetical citations', () => {
            expect(getPunctuationMultiplier('sentence.(1)')).toBe(3)
            expect(getPunctuationMultiplier('statement.(12)')).toBe(3)
            expect(getPunctuationMultiplier('fact.(123)')).toBe(3)
            expect(getPunctuationMultiplier('quote.(4567)')).toBe(3)
        })

        test('should handle comma with citations', () => {
            expect(getPunctuationMultiplier('however,[1]')).toBe(2)
            expect(getPunctuationMultiplier('furthermore,(2)')).toBe(2)
        })

        test('should handle other punctuation with citations', () => {
            expect(getPunctuationMultiplier('listed;[1]')).toBe(2.5)
            expect(getPunctuationMultiplier('follows:(2)')).toBe(2.5)
            expect(getPunctuationMultiplier('amazing![3]')).toBe(3)
            expect(getPunctuationMultiplier('really?(4)')).toBe(3)
        })

        test('should handle citations with quotes', () => {
            expect(getPunctuationMultiplier('sentence.[1]"')).toBe(3)
            expect(getPunctuationMultiplier("statement.(2)'")).toBe(3)
            expect(getPunctuationMultiplier('quote,[3]"')).toBe(2)
            expect(getPunctuationMultiplier('said.(4)\u2019')).toBe(3) // said.(4)'
        })
    })

    describe('Edge cases', () => {
        test('should handle empty strings', () => {
            expect(getPunctuationMultiplier('')).toBe(1)
        })

        test('should handle strings with only quotes', () => {
            expect(getPunctuationMultiplier('"')).toBe(1)
            expect(getPunctuationMultiplier("'")).toBe(1)
            expect(getPunctuationMultiplier('"""')).toBe(1)
        })

        test('should handle strings with only brackets', () => {
            expect(getPunctuationMultiplier(']')).toBe(1)
            expect(getPunctuationMultiplier(')')).toBe(1)
            expect(getPunctuationMultiplier('}')).toBe(1)
        })

        test('should handle citation without punctuation', () => {
            expect(getPunctuationMultiplier('word[1]')).toBe(1)
            expect(getPunctuationMultiplier('word(2)')).toBe(1)
        })

        test('should handle invalid citation patterns', () => {
            // These shouldn't match the citation pattern
            expect(getPunctuationMultiplier('word.[abc]')).toBe(3) // Not digits
            expect(getPunctuationMultiplier('word.[]')).toBe(3) // Empty brackets
            expect(getPunctuationMultiplier('word.[1')).toBe(1) // Unclosed bracket
            expect(getPunctuationMultiplier('word.1]')).toBe(1) // No opening bracket
        })

        test('should handle mixed brackets and parentheses', () => {
            expect(getPunctuationMultiplier('word.[1)')).toBe(3) // Mismatched - should find period
            expect(getPunctuationMultiplier('word.(1]')).toBe(3) // Mismatched - should find period
        })

        test('should handle multiple citations', () => {
            // Should remove citations and find punctuation before them
            expect(getPunctuationMultiplier('word.[1][2]')).toBe(3) // Period before citations
            expect(getPunctuationMultiplier('word.,[1][2]')).toBe(2) // Should find comma before first citation
        })

        test('should handle words ending with dashes and ellipses', () => {
            expect(getPunctuationMultiplier('word—')).toBe(1)
            expect(getPunctuationMultiplier('word–')).toBe(1)
            expect(getPunctuationMultiplier('word…')).toBe(1)
            expect(getPunctuationMultiplier('sentence.—')).toBe(3)
            expect(getPunctuationMultiplier('sentence.…')).toBe(3)
        })
    })

    describe('Custom multipliers', () => {
        test('should use custom multipliers when provided', () => {
            expect(getPunctuationMultiplier('hello.', 5, 3, 4, 6)).toBe(5) // period
            expect(getPunctuationMultiplier('hello,', 5, 3, 4, 6)).toBe(3) // comma
            expect(getPunctuationMultiplier('hello;', 5, 3, 4, 6)).toBe(4) // semicolon
            expect(getPunctuationMultiplier('hello!', 5, 3, 4, 6)).toBe(6) // exclamation
        })
    })

    describe('Real-world examples', () => {
        test('should handle typical academic citations', () => {
            expect(getPunctuationMultiplier('research.[1]')).toBe(3)
            expect(getPunctuationMultiplier('findings.[23]')).toBe(3)
            expect(getPunctuationMultiplier('study,(Smith)')).toBe(2) // Comma before (Smith) - even though (Smith) isn't digits, there's still a comma
            expect(getPunctuationMultiplier('data.(2019)')).toBe(3) // This is digits in parentheses
        })

        test('should handle dialogue with quotes', () => {
            expect(getPunctuationMultiplier('"Hello."')).toBe(3)
            expect(getPunctuationMultiplier('"Yes,"')).toBe(2)
            expect(getPunctuationMultiplier('"Really?"')).toBe(3)
            expect(getPunctuationMultiplier('"Wow!"')).toBe(3)
        })

        test('should handle complex nested punctuation', () => {
            expect(getPunctuationMultiplier('said.[1]"),')).toBe(2) // Complex case - algorithm finds the comma last
            expect(getPunctuationMultiplier('however,[2]"—')).toBe(2) // Comma before citation
        })
    })
})
