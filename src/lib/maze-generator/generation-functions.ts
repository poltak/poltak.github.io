import {
    getOppositeDirection,
    MazeCell,
    initMaze,
    getNeighborCells,
    pickRandomNeighborDirection,
} from './util'
import type { Direction, MazeGenerator } from './types'
import { MAX_MAZE_SIZE } from './constants'

const generateMazeDFS: MazeGenerator = ({ mazeSize, randomInt }) => {
    const maze = initMaze(mazeSize)
    const startIndex = randomInt(0, mazeSize * mazeSize - 1)
    const stack: number[] = [startIndex]
    const history: number[] = [startIndex]
    const visited = new Set(history)

    while (stack.length > 0) {
        const currentIndex = stack[stack.length - 1]
        const neighbors = getNeighborCells(currentIndex, mazeSize)
        const direction = pickRandomNeighborDirection({ neighbors, visited, randomInt })

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
        visited.add(neighborIndex)
        stack.push(neighborIndex)
    }

    return { maze, startIndex, endIndex: history[history.length - 1], history }
}

const generateMazePrim: MazeGenerator = ({ mazeSize, randomInt }) => {
    const maze = initMaze(mazeSize)
    const startIndex = randomInt(0, mazeSize * mazeSize - 1)
    const history: number[] = [startIndex]
    const visited = new Set(history)
    const wallPool: Array<[MazeCell, Direction]> = []

    const addValidWallsToPool = (cell: MazeCell): void => {
        const neighboringCells = getNeighborCells(cell.index, mazeSize)

        for (const [direction, neighborIndex] of Object.entries(neighboringCells)) {
            // Skip any directions that can't be visited OR have already been visited
            if (neighborIndex === null || visited.has(neighborIndex)) {
                continue
            }
            wallPool.push([cell, direction as Direction])
        }
    }

    addValidWallsToPool(maze[startIndex])

    while (wallPool.length > 0) {
        const randomWallIndex = randomInt(0, wallPool.length - 1)
        const [cell, direction] = wallPool[randomWallIndex]
        wallPool[randomWallIndex] = wallPool[wallPool.length - 1]
        wallPool.pop()
        const neighborIndex = getNeighborCells(cell.index, mazeSize)[direction]

        // If we haven't visited this neighbor yet (and actually can) - visit it!
        if (neighborIndex !== null && !visited.has(neighborIndex)) {
            maze[cell.index].walls[direction] = false
            maze[neighborIndex].walls[getOppositeDirection(direction)] = false
            history.push(neighborIndex)
            visited.add(neighborIndex)

            // Add this neighbor's walls to the wall pool for future iterations
            addValidWallsToPool(maze[neighborIndex])
        }
    }

    return { maze, startIndex, endIndex: history[history.length - 1], history }
}

const generateMazeKruskal: MazeGenerator = ({ mazeSize, randomInt }) => {
    const maze = initMaze(mazeSize)
    // Each internal wall appears once. Fisher-Yates uses the supplied seeded RNG.
    const walls: Array<[number, Direction, number]> = []
    for (const cell of maze) {
        const neighbors = getNeighborCells(cell.index, mazeSize)
        for (const direction of ['top', 'right'] as const) {
            const neighbor = neighbors[direction]
            if (neighbor !== null) walls.push([cell.index, direction, neighbor])
        }
    }
    for (let i = walls.length - 1; i > 0; i--) {
        const j = randomInt(0, i)
        ;[walls[i], walls[j]] = [walls[j], walls[i]]
    }

    const parents = Uint32Array.from(maze, (cell) => cell.index)
    const ranks = new Uint8Array(maze.length)
    function findRoot(index: number): number {
        while (parents[index] !== index) {
            parents[index] = parents[parents[index]]
            index = parents[index]
        }
        return index
    }

    const startIndex = walls[0]?.[0] ?? 0
    const history = [startIndex]
    for (const [cellAIndex, direction, cellBIndex] of walls) {
        let rootA = findRoot(cellAIndex)
        let rootB = findRoot(cellBIndex)
        if (rootA === rootB) continue
        if (ranks[rootA] < ranks[rootB]) [rootA, rootB] = [rootB, rootA]
        parents[rootB] = rootA
        if (ranks[rootA] === ranks[rootB]) ranks[rootA] += 1

        maze[cellAIndex].walls[direction] = false
        maze[cellBIndex].walls[getOppositeDirection(direction)] = false
        history.push(cellBIndex)
        if (history.length === maze.length) break
    }

    return {
        maze,
        startIndex,
        endIndex: history[history.length - 1],
        history,
    }
}

export const generateMaze: MazeGenerator = (params) => {
    if (
        !Number.isInteger(params.mazeSize) ||
        params.mazeSize < 1 ||
        params.mazeSize > MAX_MAZE_SIZE
    ) {
        throw new RangeError(`Maze size must be a whole number from 1 to ${MAX_MAZE_SIZE}.`)
    }
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
