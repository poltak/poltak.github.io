import seedrandom from 'seedrandom'

export type Point = [number, number]
/**
 * Tuple containing the inbetween point then the neighbor point.
 */
export type NeighborIndex = [number | null, number | null]

const initRandomInt = (seed: string) => {
    let rng = seedrandom(seed)
    return (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min
}

export class MazeGenerator {
    private randomInt: (min: number, max: number) => number

    constructor(
        private deps: {
            mazeSize: number
            seed: string
        },
    ) {
        this.randomInt = initRandomInt(deps.seed)
    }

    private initMaze(): boolean[] {
        return Array(this.deps.mazeSize * this.deps.mazeSize).fill(true)
    }

    pointToIndex(point: Point): number {
        return point[1] * this.deps.mazeSize + point[0]
    }

    indexToPoint(index: number): Point {
        return [index % this.deps.mazeSize, Math.floor(index / this.deps.mazeSize)]
    }

    setSeed(seed: string) {
        this.randomInt = initRandomInt(seed)
    }

    setMazeSize(mazeSize: number) {
        this.deps.mazeSize = mazeSize
    }

    /**
     * For a given point, gets the valid neighbor cells which are exactly 2 cells away.
     * TODO: Make this distance agnostic
     */
    private getExpansionCandidateNeighbors(index: number): NeighborIndex[] {
        return [
            [this.getTopNeighbor(index, 1), this.getTopNeighbor(index, 2)],
            [this.getBottomNeighbor(index, 1), this.getBottomNeighbor(index, 2)],
            [this.getLeftNeighbor(index, 1), this.getLeftNeighbor(index, 2)],
            [this.getRightNeighbor(index, 1), this.getRightNeighbor(index, 2)],
        ]
    }

    private getTopNeighbor(index: number, distance: number): number | null {
        const indexUpperBound = this.deps.mazeSize * this.deps.mazeSize
        if (index + this.deps.mazeSize * distance < indexUpperBound) {
            return index + this.deps.mazeSize * distance
        }
        return null
    }

    private getBottomNeighbor(index: number, distance: number): number | null {
        const indexLowerBound = 0
        if (index - this.deps.mazeSize * distance >= indexLowerBound) {
            return index - this.deps.mazeSize * distance
        }
        return null
    }

    private getLeftNeighbor(index: number, distance: number): number | null {
        const xValue = index % this.deps.mazeSize
        if (xValue >= distance) {
            return index - distance
        }
        return null
    }

    private getRightNeighbor(index: number, distance: number): number | null {
        const xValue = index % this.deps.mazeSize
        if (xValue < this.deps.mazeSize - distance) {
            return index + distance
        }
        return null
    }

    private pickRandomNeighbor(
        neighbors: NeighborIndex[],
        history: number[],
    ): { inbetweenIndex: number | null; neighborIndex: number } | null {
        if (neighbors.length === 0) {
            return null
        }
        const randomIndex = this.randomInt(0, neighbors.length - 1)
        const [inbetweenIndex, neighborIndex] = neighbors[randomIndex]

        // Return the inbetween point as the neighbor if the neighbor doesn't exist (OOB)
        //  This avoids the case where there's one row of unvisited cells on the maze walls
        if (neighborIndex === null && inbetweenIndex !== null) {
            return {
                inbetweenIndex: null,
                neighborIndex: inbetweenIndex,
            }
        }

        // If the neighbor doesn't exist (OOB) or already in the history, recurse to try again
        if (inbetweenIndex === null || neighborIndex === null || history.includes(neighborIndex)) {
            const nextNeighbors = neighbors.filter(
                ([, neighborIndex]) => neighborIndex != null && !history.includes(neighborIndex!),
            )
            return this.pickRandomNeighbor(nextNeighbors, history)
        }
        return {
            inbetweenIndex,
            neighborIndex,
        }
    }

    /**
     * Generate a maze using the depth-first search algorithm.
     * @param seed - The seed for the random number generator.
     * @returns The maze as a 2D array of booleans. `true` means a wall, `false` means a path.
     */
    generateMazeDFS(): {
        maze: boolean[]
        startIndex: number
        endIndex: number
        history: number[]
    } {
        const maze = this.initMaze()
        const startIndex = this.randomInt(0, this.deps.mazeSize * this.deps.mazeSize - 1)
        const stack: number[] = [startIndex]
        const history: number[] = []

        while (stack.length > 0) {
            const currentIndex = stack[stack.length - 1]
            const neighbors = this.getExpansionCandidateNeighbors(currentIndex)

            let randomNeighbor = this.pickRandomNeighbor(neighbors, history)
            if (randomNeighbor === null) {
                stack.pop()
                continue
            }

            // Mark the neighbor + the inbetween cell as false to break down the wall
            if (randomNeighbor.inbetweenIndex !== null) {
                maze[randomNeighbor.inbetweenIndex] = false
                history.push(randomNeighbor.inbetweenIndex)
            }
            maze[randomNeighbor.neighborIndex] = false
            history.push(randomNeighbor.neighborIndex)

            // Only push the target neighbor to the stack, not the inbetween point
            // else we'll end up breaking down every single cell wall in the maze
            if (randomNeighbor.inbetweenIndex !== null) {
                stack.push(randomNeighbor.neighborIndex)
            }
        }

        const endIndex = history[history.length - 1]
        return { maze, startIndex, endIndex, history }
    }
}
