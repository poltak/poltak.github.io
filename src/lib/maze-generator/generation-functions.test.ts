import { describe, expect, it } from 'vitest'
import seedrandom from 'seedrandom'
import { generateMaze } from './generation-functions'
import { getNeighborCells, getOppositeDirection, mazeToWallPath } from './util'
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

describe('maze wall path', () => {
    it('draws the outer edge and each closed inner wall one time', () => {
        // 2 x 2 cells. Index 0 is at the bottom left; the only closed inner wall is between 0 and 1.
        const open = { top: false, right: false, bottom: false, left: false }
        const maze = [
            { index: 0, walls: { ...open, bottom: true, left: true, right: true } },
            { index: 1, walls: { ...open, bottom: true, right: true, left: true } },
            { index: 2, walls: { ...open, top: true, left: true } },
            { index: 3, walls: { ...open, top: true, right: true } },
        ]

        expect(mazeToWallPath(maze, 2)).toBe(
            ['M0 0V2H2', 'M1 1v1', 'M2 1v1', 'M0 0h1', 'M1 0h1', 'M2 0v1'].join(''),
        )
    })

    it.each<MazeGenAlgorithm>(['dfs', 'prim', 'kruskal'])(
        'has one segment for each wall of a generated %s maze',
        (algorithm) => {
            const size = 12
            const { maze } = generate(algorithm, size)
            const closedInnerWalls = 2 * size * (size - 1) - (size * size - 1)
            const outerTopAndRight = 2 * size
            const segments = mazeToWallPath(maze, size).match(/M/g) ?? []
            expect(segments.length).toBe(1 + closedInnerWalls + outerTopAndRight)
        },
    )
})
