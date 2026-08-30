import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = process.env.INIT_CWD ?? process.cwd()

describe('site favicon', () => {
    it('is a square RGB PNG in the browser-friendly 128px size', () => {
        const bytes = readFileSync(resolve(projectRoot, 'static/favicon.png'))

        expect(bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        expect(bytes.readUInt32BE(16)).toBe(128)
        expect(bytes.readUInt32BE(20)).toBe(128)
        expect(bytes[25]).toBe(2)
    })
})
