import {
    getOppositeDirection,
    MazeCell,
    initMaze,
    getNeighborCells,
    pickRandomNeighborDirection,
} from './util'
import type { Direction, MazeGenerator } from './types'

const generateMazeDFS: MazeGenerator = ({ mazeSize, randomInt }) => {
    const maze = initMaze(mazeSize)
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

const generateMazePrim: MazeGenerator = ({ mazeSize, randomInt }) => {
    const maze = initMaze(mazeSize)
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

const generateMazeKruskal: MazeGenerator = ({ mazeSize, randomInt }) => {
    throw new Error('Not implemented')
}

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
