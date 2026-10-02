import type {
    Direction,
    Point,
    MazeCellInterface,
    NeighborCells,
    RandomIntGenerator,
} from './types'

export function getOppositeDirection(direction: Direction): Direction {
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

export class MazeCell implements MazeCellInterface {
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

export function initMaze(mazeSize: number): MazeCellInterface[] {
    return Array.from({ length: mazeSize * mazeSize }, (_, index) => ({
        index,
        walls: { top: true, right: true, bottom: true, left: true },
    }))
}

export function getNeighborCells(index: number, mazeSize: number): NeighborCells {
    return {
        top: getTopNeighbor(index, 1, mazeSize),
        right: getRightNeighbor(index, 1, mazeSize),
        bottom: getBottomNeighbor(index, 1, mazeSize),
        left: getLeftNeighbor(index, 1, mazeSize),
    }
}

export function getTopNeighbor(index: number, distance: number, mazeSize: number): number | null {
    const indexUpperBound = mazeSize * mazeSize
    if (index + mazeSize * distance < indexUpperBound) {
        return index + mazeSize * distance
    }
    return null
}

export function getBottomNeighbor(
    index: number,
    distance: number,
    mazeSize: number,
): number | null {
    const indexLowerBound = 0
    if (index - mazeSize * distance >= indexLowerBound) {
        return index - mazeSize * distance
    }
    return null
}

export function getLeftNeighbor(index: number, distance: number, mazeSize: number): number | null {
    const xValue = index % mazeSize
    if (xValue >= distance) {
        return index - distance
    }
    return null
}

export function getRightNeighbor(index: number, distance: number, mazeSize: number): number | null {
    const xValue = index % mazeSize
    if (xValue < mazeSize - distance) {
        return index + distance
    }
    return null
}

export function pickRandomNeighborDirection({
    neighbors,
    visited,
    randomInt,
}: {
    neighbors: NeighborCells
    visited: ReadonlySet<number>
    randomInt: RandomIntGenerator
}): Direction | null {
    const validDirections = Object.entries(neighbors)
        .filter(([, neighborIndex]) => neighborIndex !== null && !visited.has(neighborIndex))
        .map(([direction]) => direction as Direction)
    if (validDirections.length === 0) {
        return null
    }
    return validDirections[randomInt(0, validDirections.length - 1)]
}

/**
 * Build one SVG path for all maze walls, in cell units with the y axis pointing down.
 *
 * Cell index 0 is at the bottom left, so row 0 is drawn last. Each inner wall is shared by
 * two cells; only the top and right wall of each cell is drawn, plus the left and bottom edges.
 */
export function mazeToWallPath(maze: readonly MazeCellInterface[], mazeSize: number): string {
    const segments: string[] = [`M0 0V${mazeSize}H${mazeSize}`]

    for (let row = 0; row < mazeSize; row++) {
        const y = mazeSize - 1 - row
        for (let column = 0; column < mazeSize; column++) {
            const walls = maze[row * mazeSize + column]?.walls
            if (!walls) continue
            if (walls.top) segments.push(`M${column} ${y}h1`)
            if (walls.right) segments.push(`M${column + 1} ${y}v1`)
        }
    }

    return segments.join('')
}
