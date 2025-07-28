import seedrandom from 'seedrandom'

export type Point = [number, number]
export type Algorithm = 'dfs' | 'prim' | 'kruskal'

type Direction = 'top' | 'right' | 'bottom' | 'left'
type NeighborCells = { [key in Direction]: number | null }

export interface MazeGenerationParams {
    mazeSize: number
    seed: string
    algorithm: Algorithm
}

export interface MazeGenerationResult {
    maze: MazeCell[]
    startIndex: number
    endIndex: number
    history: number[]
}

export const ALGO_CHOICES: Record<Algorithm, string> = {
    dfs: 'Depth-First Search',
    prim: "Prim's",
    kruskal: "Kruskal's",
} as const

class RNGManager {
    private rngInstances = new Map<string, seedrandom.PRNG>()

    getRNG(seed: string): seedrandom.PRNG {
        if (!this.rngInstances.has(seed)) {
            this.rngInstances.set(seed, seedrandom(seed))
        }
        return this.rngInstances.get(seed)!
    }

    clearSeed(seed: string) {
        this.rngInstances.delete(seed)
    }

    clearAll() {
        this.rngInstances.clear()
    }
}

// Global RNG manager instance to afford persistence of RNG state in a given session
const rngManager = new RNGManager()

// Utility functions for managing RNG state
export function resetRNG(seed: string) {
    rngManager.clearSeed(seed)
}

export function resetAllRNG() {
    rngManager.clearAll()
}

function getRandomInt(seed: string) {
    const rng = rngManager.getRNG(seed)
    return (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min
}

function getOppositeDirection(direction: Direction): Direction {
    switch (direction) {
        case 'top':
            return 'bottom'
        case 'right':
            return 'left'
        case 'bottom':
            return 'top'
        case 'left':
            return 'right'
        default:
            throw new Error(`Invalid direction: ${direction}`)
    }
}

export class MazeCell {
    index: number
    walls = { top: true, right: true, bottom: true, left: true }

    constructor(index: number) {
        this.index = index
    }
}

export function pointToIndex(point: Point, mazeSize: number): number {
    return point[1] * mazeSize + point[0]
}

export function indexToPoint(index: number, mazeSize: number): Point {
    return [index % mazeSize, Math.floor(index / mazeSize)]
}

function initMaze(mazeSize: number): MazeCell[] {
    return Array.from({ length: mazeSize * mazeSize }, (_, index) => new MazeCell(index))
}

function getNeighborCells(index: number, mazeSize: number): NeighborCells {
    return {
        top: getTopNeighbor(index, 1, mazeSize),
        right: getRightNeighbor(index, 1, mazeSize),
        bottom: getBottomNeighbor(index, 1, mazeSize),
        left: getLeftNeighbor(index, 1, mazeSize),
    }
}

function getTopNeighbor(index: number, distance: number, mazeSize: number): number | null {
    const indexUpperBound = mazeSize * mazeSize
    if (index + mazeSize * distance < indexUpperBound) {
        return index + mazeSize * distance
    }
    return null
}

function getBottomNeighbor(index: number, distance: number, mazeSize: number): number | null {
    const indexLowerBound = 0
    if (index - mazeSize * distance >= indexLowerBound) {
        return index - mazeSize * distance
    }
    return null
}

function getLeftNeighbor(index: number, distance: number, mazeSize: number): number | null {
    const xValue = index % mazeSize
    if (xValue >= distance) {
        return index - distance
    }
    return null
}

function getRightNeighbor(index: number, distance: number, mazeSize: number): number | null {
    const xValue = index % mazeSize
    if (xValue < mazeSize - distance) {
        return index + distance
    }
    return null
}

function pickRandomNeighborDirection(
    neighbors: NeighborCells,
    history: number[],
    randomInt: (min: number, max: number) => number,
): Direction | null {
    const validDirections = Object.entries(neighbors)
        .filter(([, neighborIndex]) => neighborIndex !== null && !history.includes(neighborIndex))
        .map(([direction]) => direction as Direction)
    if (validDirections.length === 0) {
        return null
    }
    return validDirections[randomInt(0, validDirections.length - 1)]
}

const generateMazeDFS: MazeGenerator = ({ mazeSize, seed }) => {
    const maze = initMaze(mazeSize)
    const randomInt = getRandomInt(seed)
    const startIndex = randomInt(0, mazeSize * mazeSize - 1)
    const stack: number[] = [startIndex]
    const history: number[] = [startIndex]

    while (stack.length > 0) {
        const currentIndex = stack[stack.length - 1]
        const neighbors = getNeighborCells(currentIndex, mazeSize)
        let direction = pickRandomNeighborDirection(neighbors, history, randomInt)

        // Once we've exhausted all possible directions, pop the stack so we can backtrack on next iteration
        if (direction === null) {
            stack.pop()
            continue
        }

        const neighborIndex = neighbors[direction]!

        // Break down the wall between the current cell and the neighbor
        const oppositeDirection = getOppositeDirection(direction)
        maze[currentIndex].walls[direction] = false
        maze[neighborIndex].walls[oppositeDirection] = false

        // And add the neighbor to the history and stack, to work from on the next iteration
        history.push(neighborIndex)
        stack.push(neighborIndex)
    }

    return { maze, startIndex, endIndex: history[history.length - 1], history }
}

const generateMazePrim: MazeGenerator = ({ mazeSize, seed }) => {
    const maze = initMaze(mazeSize)
    const randomInt = getRandomInt(seed)
    const startIndex = randomInt(0, mazeSize * mazeSize - 1)
    const history: number[] = [startIndex]
    const wallPool: Array<[MazeCell, Direction]> = []

    const addValidWallsToPool = (cell: MazeCell): void => {
        const neighboringCells = getNeighborCells(cell.index, mazeSize)

        for (const [direction, neighborIndex] of Object.entries(neighboringCells)) {
            // Skip any directions that can't be visited OR have already been visited
            if (neighborIndex === null || history.includes(neighborIndex)) {
                continue
            }
            wallPool.push([cell, direction as Direction])
        }
    }

    addValidWallsToPool(maze[startIndex])

    while (wallPool.length > 0) {
        const randomWallIndex = randomInt(0, wallPool.length - 1)
        const [cell, direction] = wallPool[randomWallIndex]
        const neighborIndex = getNeighborCells(cell.index, mazeSize)[direction]

        // If we haven't visited this neighbor yet (and actually can) - visit it!
        if (neighborIndex !== null && !history.includes(neighborIndex)) {
            maze[cell.index].walls[direction] = false
            maze[neighborIndex].walls[getOppositeDirection(direction)] = false
            history.push(neighborIndex)

            // Add this neighbor's walls to the wall pool for future iterations
            addValidWallsToPool(maze[neighborIndex])
        }
        wallPool.splice(randomWallIndex, 1)
    }

    return { maze, startIndex, endIndex: history[history.length - 1], history }
}

const generateMazeKruskal: MazeGenerator = ({ mazeSize, seed }) => {
    throw new Error('Not implemented')
}

export type MazeGenerator = (params: MazeGenerationParams) => MazeGenerationResult

export const generateMaze: MazeGenerator = (params) => {
    switch (params.algorithm) {
        case 'prim':
            return generateMazePrim(params)
        case 'kruskal':
            return generateMazeKruskal(params)
        case 'dfs':
        default:
            return generateMazeDFS(params)
    }
}
