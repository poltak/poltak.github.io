import type { MazeGenAlgorithm } from './types'

export const ALGO_CHOICES: Record<MazeGenAlgorithm, string> = {
    dfs: 'Depth-First Search',
    prim: "Prim's",
    kruskal: "Kruskal's",
} as const
