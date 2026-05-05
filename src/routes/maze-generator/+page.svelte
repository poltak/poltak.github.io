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
                Note: very large maze sizes can freeze or crash your browser. (e.g. 500).
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
        --maze-wall-color: var(--c-primary);
        --maze-cell-bg: var(--c-bg-input);
        --maze-start-bg: var(--c-danger);
        --maze-end-bg: var(--c-accent);
    }

    .maze {
        display: flex;
        flex-direction: column-reverse;
        max-width: 100%;
        overflow: auto;
        border: 1px solid var(--c-border);
        background: var(--c-bg-subtle);
        padding: 0.75rem;
        box-sizing: content-box;
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
        display: grid;
        gap: 1rem;
        border: 1px solid var(--c-border);
        padding: 1rem;
        margin: 1.5rem 0;
        background: transparent;
    }

    .maze-controls h3 {
        margin: 0;
        color: var(--c-primary);
        font-size: 1rem;
        text-transform: uppercase;
    }

    .control {
        display: grid;
        grid-template-columns: minmax(7rem, auto) minmax(0, 1fr);
        gap: 0.75rem;
        align-items: start;
    }

    .control label {
        color: var(--c-text-muted);
        font-size: 0.8rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    input,
    select {
        width: 100%;
        border: 1px solid var(--c-border);
        background: var(--c-bg-input);
        color: var(--c-text);
        font: inherit;
        padding: 0.45rem 0.65rem;
        box-sizing: border-box;
    }

    button {
        border: 1px solid var(--c-border);
        background: var(--c-primary-light);
        color: var(--c-primary);
        cursor: pointer;
        font: inherit;
        font-weight: 800;
        letter-spacing: 0.08em;
        padding: 0.5rem 0.85rem;
        text-transform: uppercase;
    }

    button:hover {
        border-color: var(--c-primary);
    }

    .control > button {
        grid-column: 2;
        justify-self: start;
    }

    .maze-size-input {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .maze-size-warning {
        margin: 0;
        font-size: 0.9rem;
        color: var(--c-danger);
        max-width: 42ch;
    }

    .maze-info {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin: 1rem 0;
        color: var(--c-text-muted);
    }

    .maze-info p {
        margin: 0;
    }

    @media (max-width: 640px) {
        .control {
            grid-template-columns: 1fr;
        }

        .control > button {
            grid-column: 1;
        }
    }
</style>
