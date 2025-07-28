export type Point = [number, number]
export type MazeGenAlgorithm = 'dfs' | 'prim' | 'kruskal'
export type Direction = 'top' | 'right' | 'bottom' | 'left'
export type NeighborCells = { [key in Direction]: number | null }

export interface MazeCellInterface {
    index: number
    walls: { [key in Direction]: boolean }
}

export interface MazeGenerationParams {
    mazeSize: number
    seed: string
    algorithm: MazeGenAlgorithm
}

export interface MazeGenerationResult {
    maze: MazeCellInterface[]
    startIndex: number
    endIndex: number
    history: number[]
}

export type MazeGenerator = (params: MazeGenerationParams) => MazeGenerationResult
