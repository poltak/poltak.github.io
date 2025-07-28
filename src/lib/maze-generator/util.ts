import type { Direction, Point, MazeCellInterface, NeighborCells } from './types'

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

export function pickRandomNeighborDirection(
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
