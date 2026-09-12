import { describe, expect, it } from 'vitest'
import seedrandom from 'seedrandom'
import { generateMaze } from './generation-functions'
import { getNeighborCells, getOppositeDirection } from './util'
import type { Direction, MazeGenAlgorithm } from './types'

function generate(algorithm: MazeGenAlgorithm, mazeSize: number) {
    const rng = seedrandom('audit')
    return generateMaze({
        algorithm,
        mazeSize,
        randomInt: (min, max) => min + Math.floor(rng() * (max - min + 1)),
    })
}

describe.each<MazeGenAlgorithm>(['dfs', 'prim', 'kruskal'])('%s maze', (algorithm) => {
    it.each([1, 2, 25, 100])('connects all cells without cycles at size %i', (size) => {
        const { maze, startIndex, endIndex } = generate(algorithm, size)
        const visited = new Set([startIndex])
        const pending = [startIndex]
        let openings = 0
        while (pending.length) {
            const index = pending.pop()!
            for (const [direction, neighbor] of Object.entries(getNeighborCells(index, size))) {
                const wall = maze[index].walls[direction as Direction]
                if (neighbor === null) {
                    expect(wall).toBe(true)
                    continue
                }
                expect(wall).toBe(
                    maze[neighbor].walls[getOppositeDirection(direction as Direction)],
                )
                if (wall) continue
                openings += 1
                if (!visited.has(neighbor)) {
                    visited.add(neighbor)
                    pending.push(neighbor)
                }
            }
        }
        expect(visited.size).toBe(size * size)
        expect(visited.has(endIndex)).toBe(true)
        expect(openings / 2).toBe(size * size - 1)
    })

    it('repeats a seeded result', () => {
        expect(generate(algorithm, 5)).toEqual(generate(algorithm, 5))
    })

    it.each([0, -1, 1.5, 101, NaN, Infinity])('rejects invalid size %s', (size) => {
        expect(() => generate(algorithm, size)).toThrow(RangeError)
    })
})
