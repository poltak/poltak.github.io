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
    const maze = initMaze(mazeSize)
    const allWallsShuffled = maze
        .flatMap((cell) =>
            Object.keys(cell.walls).map((wall) => [cell, wall] as [MazeCell, Direction]),
        )
        .sort(() => randomInt(0, 1) - 0.5)

    // Create a disjoint set for each cell
    const disjointSets = new Map<MazeCell, MazeCell>(maze.map((cell) => [cell, cell]))
    function findSetRoot(cell: MazeCell): MazeCell {
        while (disjointSets.get(cell) !== cell) {
            cell = disjointSets.get(cell)!
        }
        return cell
    }
    function unionSets(a: MazeCell, b: MazeCell): void {
        const rootA = findSetRoot(a)
        const rootB = findSetRoot(b)
        disjointSets.set(rootB, rootA)
    }

    const history = [allWallsShuffled[0][0].index]

    for (const [cellA, direction] of allWallsShuffled) {
        const cellBIndex = getNeighborCells(cellA.index, mazeSize)[direction]
        if (cellBIndex == null) {
            continue
        }
        const cellB = maze[cellBIndex]

        // If both cells are part of the same set, we don't need to do anything else
        if (findSetRoot(cellA) === findSetRoot(cellB)) {
            continue
        }

        // If different sets, merge their sets and remove that wall
        unionSets(cellA, cellB)
        cellA.walls[direction] = false
        cellB.walls[getOppositeDirection(direction)] = false
        history.push(cellBIndex)
    }

    return {
        maze,
        startIndex: allWallsShuffled[0][0].index,
        endIndex: allWallsShuffled[allWallsShuffled.length - 1][0].index,
        history,
    }
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
