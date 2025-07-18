export type Point = [number, number]

const initRandomInt = (seed: number) => (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

export class MazeGenerator {
    private randomInt: (min: number, max: number) => number

    constructor(
        private deps: {
            mazeSize: number
            seed: number
        },
    ) {
        this.randomInt = initRandomInt(deps.seed)
    }

    private initMaze(): boolean[][] {
        return Array.from({ length: this.deps.mazeSize }, () =>
            Array(this.deps.mazeSize).fill(true),
        )
    }

    /**
     * For a given point, gets the valid neighbors at least 2 cells away.
     */
    private getNeighbors([x, y]: Point) {
        const neighbors: Point[] = []
        if (x - 2 > 0) neighbors.push([x - 2, y]) // left
        if (x + 2 < this.deps.mazeSize) neighbors.push([x + 2, y]) // right
        if (y - 2 > 0) neighbors.push([x, y - 2]) // up
        if (y + 2 < this.deps.mazeSize) neighbors.push([x, y + 2]) // down
        return neighbors
    }

    private findInbetweenPoint(current: Point, next: Point): Point {
        if (current[0] === next[0]) {
            return [current[0], Math.ceil((current[1] + next[1]) / 2)]
        } else {
            return [Math.ceil((current[0] + next[0]) / 2), current[1]]
        }
    }

    /**
     * Generate a maze using the depth-first search algorithm.
     * @param seed - The seed for the random number generator.
     * @returns The maze as a 2D array of booleans. `true` means a wall, `false` means a path.
     */
    generateMaze(): { maze: boolean[][]; startingPoint: Point; history: Point[] } {
        const maze = this.initMaze()
        const startingPoint: Point = [
            this.randomInt(0, this.deps.mazeSize - 1),
            this.randomInt(0, this.deps.mazeSize - 1),
        ]
        const stack: Point[] = [startingPoint]
        const history: Point[] = []

        const breakDownWall = (current: Point, next: Point) => {
            maze[current[1]][current[0]] = false
            maze[next[1]][next[0]] = false
            const inbetweenPoint = this.findInbetweenPoint(current, next)
            maze[inbetweenPoint[1]][inbetweenPoint[0]] = false
        }

        while (stack.length > 0) {
            const current = stack[stack.length - 1]
            const neighbors = this.getNeighbors(current)
            let next = neighbors[this.randomInt(0, neighbors.length - 1)]

            // Keep trying the neighbors until we find one that's a wall
            for (
                let attempt = 0;
                !maze[next[1]][next[0]] && attempt < neighbors.length;
                attempt++
            ) {
                next = neighbors[this.randomInt(0, neighbors.length - 1)]
            }

            // If the next point is a wall, break down everything between the current and there
            if (maze[next[1]][next[0]]) {
                try {
                    breakDownWall(current, next)
                } catch (error) {
                    console.log('error:', error)
                    break
                }
                stack.push(next)
                console.log('next:', `${next[0] + 1}, ${next[1] + 1}`)
                history.push(next)
            } else {
                stack.pop()
            }
        }

        return { maze, startingPoint, history }
    }
}
