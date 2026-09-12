import type { MazeGenAlgorithm } from './types'

export const MAX_MAZE_SIZE = 100

export const ALGO_CHOICES: Record<MazeGenAlgorithm, string> = {
    dfs: 'Depth-First Search',
    prim: "Prim's",
    kruskal: "Kruskal's",
} as const
