<script lang="ts">
    import seedrandom from 'seedrandom'
    import { generateMaze } from '$lib/maze-generator/generation-functions'
    import { ALGO_CHOICES } from '$lib/maze-generator/constants'
    import { MazeCell, indexToPoint } from '$lib/maze-generator/util'
    import type { MazeGenAlgorithm, RandomIntGenerator } from '$lib/maze-generator/types'

    let rngInstances = $state(new Map<string, RandomIntGenerator>())
    let seed = $state(new Date().toISOString().split('T')[0])

    function getRandomIntGenerator(seed: string): RandomIntGenerator {
        if (!rngInstances.has(seed)) {
            const rng = seedrandom(seed)
            rngInstances.set(seed, (min, max) => Math.floor(rng() * (max - min + 1)) + min)
        }
        return rngInstances.get(seed)!
    }

    let mazeSize = $state(25)
    let startIndex = $state(0)
    let endIndex = $state(0)
    let maze = $state<MazeCell[]>([])
    let history = $state<number[]>([])
    let algorithm = $state<MazeGenAlgorithm>('prim')
    let startingPoint = $derived(indexToPoint(startIndex, mazeSize))

    // Regenerate maze when seed, mazeSize, algorithm, or RNG instances change
    $effect(() => {
        regenerateMaze()
    })

    function regenerateMaze() {
        const randomInt = getRandomIntGenerator(seed)
        let generated = generateMaze({ mazeSize, randomInt, algorithm })
        maze = generated.maze
        startIndex = generated.startIndex
        endIndex = generated.endIndex
        history = generated.history
    }

    function resetRNG() {
        rngInstances.delete(seed)
        rngInstances = new Map(rngInstances) // Update reference to trigger reactivity
    }
</script>

<p>This is a maze generator that I made for fun.</p>

<p>I'm hoping to use this as a starting point for some simple browser-based games.</p>

<div class="maze-info">
    <p>Starting point: {startingPoint[0] + 1}, {startingPoint[1] + 1}</p>
    <p>Maze size: {mazeSize} x {mazeSize}</p>
</div>

<div class="maze-controls">
    <h3>Controls</h3>

    <div class="control">
        <label for="maze-size">Maze size:</label>
        <div class="maze-size-input">
            <input id="maze-size" type="number" min={1} max={100} bind:value={mazeSize} />
            <p class="maze-size-warning">
                Note: very large maze sizes can freeze or crash your browser/computer (e.g. 500).
            </p>
        </div>
    </div>

    <div class="control">
        <label for="seed">Seed:</label>
        <input id="seed" type="text" bind:value={seed} />
        <button onclick={resetRNG}>Reset RNG</button>
    </div>

    <div class="control">
        <label for="algorithm">Algorithm:</label>
        <select id="algorithm" bind:value={algorithm}>
            {#each Object.entries(ALGO_CHOICES) as [algo, algoName]}
                <option value={algo}>{algoName}</option>
            {/each}
        </select>
    </div>

    <div class="control">
        <button onclick={regenerateMaze}>Regenerate Maze</button>
    </div>
</div>

<div class="maze" style="width: {mazeSize * 20}px; height: {mazeSize * 20}px;">
    {#each Array.from({ length: mazeSize }, (_, rowIndex) => rowIndex) as rowIndex}
        <div class="row">
            {#each Array.from({ length: mazeSize }, (_, colIndex) => colIndex) as colIndex}
                {@const cellIndex = rowIndex * mazeSize + colIndex}
                {@const cell = maze[cellIndex]}
                {#if cell}
                    <div
                        class="cell"
                        style="
                        {startIndex === cellIndex
                            ? 'background-color: var(--maze-start-bg);'
                            : endIndex === cellIndex
                              ? 'background-color: var(--maze-end-bg);'
                              : ''}
                        border-top: 2px solid {cell.walls.top
                            ? 'var(--maze-wall-color)'
                            : 'transparent'};
                        border-right: 2px solid {cell.walls.right
                            ? 'var(--maze-wall-color)'
                            : 'transparent'};
                        border-bottom: 2px solid {cell.walls.bottom
                            ? 'var(--maze-wall-color)'
                            : 'transparent'};
                        border-left: 2px solid {cell.walls.left
                            ? 'var(--maze-wall-color)'
                            : 'transparent'};
                    "
                    ></div>
                {/if}
            {/each}
        </div>
    {/each}
</div>

<style>
    :root {
        --maze-wall-color: #222;
        --maze-cell-bg: #fff;
        --maze-start-bg: #e11d48;
        --maze-end-bg: #2563eb;
    }

    @media (prefers-color-scheme: dark) {
        :root {
            --maze-wall-color: #eee;
            --maze-cell-bg: #18181b;
            --maze-start-bg: #f87171;
            --maze-end-bg: #60a5fa;
        }
    }

    .maze {
        display: flex;
        flex-direction: column-reverse;
    }

    .row {
        display: flex;
        flex-direction: row;
    }

    .cell {
        width: 20px;
        height: 20px;
        box-sizing: border-box;
        background: var(--maze-cell-bg);
        transition: background 0.2s;
    }

    .maze-controls {
        display: flex;
        flex-direction: column;
        gap: 10px;
        border: 1px solid #ccc;
        padding: 10px;
        border-radius: 5px;
    }

    .control {
        display: flex;
        flex-direction: row;
        gap: 10px;
        align-items: flex-start;
    }

    .maze-size-input {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .maze-size-warning {
        margin: 0;
        font-size: 0.9rem;
        color: #666;
        max-width: 42ch;
    }

    @media (prefers-color-scheme: dark) {
        .maze-size-warning {
            color: #aaa;
        }
    }
</style>
