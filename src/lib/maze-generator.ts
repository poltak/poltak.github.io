import seedrandom from 'seedrandom'

export type Point = [number, number]
export type Algorithm = 'dfs' | 'prim' | 'kruskal'

type Direction = 'top' | 'right' | 'bottom' | 'left'
type NeighborCells = { [key in Direction]: number | null }

export interface MazeGeneratorDeps {
    mazeSize: number
    seed: string
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

const initRandomInt = (seed: string) => {
    let rng = seedrandom(seed)
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

export class MazeGenerator {
    private randomInt: (min: number, max: number) => number
    private mazeSize: number

    constructor(deps: MazeGeneratorDeps) {
        this.randomInt = initRandomInt(deps.seed)
        this.mazeSize = deps.mazeSize
    }

    private initMaze(): MazeCell[] {
        return Array.from(
            { length: this.mazeSize * this.mazeSize },
            (_, index) => new MazeCell(index),
        )
    }

    pointToIndex(point: Point): number {
        return point[1] * this.mazeSize + point[0]
    }

    indexToPoint(index: number): Point {
        return [index % this.mazeSize, Math.floor(index / this.mazeSize)]
    }

    setSeed(seed: string) {
        this.randomInt = initRandomInt(seed)
    }

    setMazeSize(mazeSize: number) {
        this.mazeSize = mazeSize
    }

    private getNeighborCells(index: number): NeighborCells {
        return {
            top: this.getTopNeighbor(index, 1),
            right: this.getRightNeighbor(index, 1),
            bottom: this.getBottomNeighbor(index, 1),
            left: this.getLeftNeighbor(index, 1),
        }
    }

    private getTopNeighbor(index: number, distance: number): number | null {
        const indexUpperBound = this.mazeSize * this.mazeSize
        if (index + this.mazeSize * distance < indexUpperBound) {
            return index + this.mazeSize * distance
        }
        return null
    }

    private getBottomNeighbor(index: number, distance: number): number | null {
        const indexLowerBound = 0
        if (index - this.mazeSize * distance >= indexLowerBound) {
            return index - this.mazeSize * distance
        }
        return null
    }

    private getLeftNeighbor(index: number, distance: number): number | null {
        const xValue = index % this.mazeSize
        if (xValue >= distance) {
            return index - distance
        }
        return null
    }

    private getRightNeighbor(index: number, distance: number): number | null {
        const xValue = index % this.mazeSize
        if (xValue < this.mazeSize - distance) {
            return index + distance
        }
        return null
    }

    private pickRandomNeighborDirection(
        neighbors: NeighborCells,
        history: number[],
    ): Direction | null {
        const validDirections = Object.entries(neighbors)
            .filter(
                ([, neighborIndex]) => neighborIndex !== null && !history.includes(neighborIndex),
            )
            .map(([direction]) => direction as Direction)
        if (validDirections.length === 0) {
            return null
        }
        return validDirections[this.randomInt(0, validDirections.length - 1)]
    }

    generateMazeDFS(): MazeGenerationResult {
        const maze = this.initMaze()
        const startIndex = this.randomInt(0, this.mazeSize * this.mazeSize - 1)
        const stack: number[] = [startIndex]
        const history: number[] = [startIndex]

        while (stack.length > 0) {
            const currentIndex = stack[stack.length - 1]
            const neighbors = this.getNeighborCells(currentIndex)
            let direction = this.pickRandomNeighborDirection(neighbors, history)

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

    generateMazePrim(): MazeGenerationResult {
        const maze = this.initMaze()
        const startIndex = this.randomInt(0, this.mazeSize * this.mazeSize - 1)
        const startCell = maze[startIndex]
        const wallList: Array<[MazeCell, Direction]> = [
            [startCell, 'top'],
            [startCell, 'right'],
            [startCell, 'bottom'],
            [startCell, 'left'],
        ]
        const history: number[] = [startIndex]

        while (wallList.length > 0) {
            const randomWallIndex = this.randomInt(0, wallList.length - 1)
            const [cell, direction] = wallList[randomWallIndex]
            const neighboringCells = this.getNeighborCells(cell.index)
            const neighborIndex = neighboringCells[direction]

            // If we haven't visited this neighbor yet (and actually can) - visit it!
            if (neighborIndex !== null && !history.includes(neighborIndex)) {
                maze[cell.index].walls[direction] = false
                maze[neighborIndex].walls[getOppositeDirection(direction)] = false
                history.push(neighborIndex)

                // And add all its walls to the wall list
                wallList.push(
                    [maze[neighborIndex], 'top'],
                    [maze[neighborIndex], 'right'],
                    [maze[neighborIndex], 'bottom'],
                    [maze[neighborIndex], 'left'],
                )
            }
            wallList.splice(randomWallIndex, 1)
        }

        return { maze, startIndex, endIndex: history[history.length - 1], history }
    }

    generateMazeKruskal(): MazeGenerationResult {
        throw new Error('Not implemented')
    }

    generateMaze(algorithm: Algorithm): MazeGenerationResult {
        switch (algorithm) {
            case 'prim':
                return this.generateMazePrim()
            case 'kruskal':
                return this.generateMazeKruskal()
            case 'dfs':
            default:
                return this.generateMazeDFS()
        }
    }
}
