<script lang="ts">
    import seedrandom from 'seedrandom'
    import { generateMaze } from '$lib/maze-generator/generation-functions'
    import { ALGO_CHOICES, MAX_MAZE_SIZE } from '$lib/maze-generator/constants'
    import { indexToPoint, mazeToWallPath } from '$lib/maze-generator/util'
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

    let mazeSize = $state<number | undefined>(25)
    let renderedMazeSize = $state(25)
    const validMazeSize = $derived(
        mazeSize !== undefined &&
            Number.isInteger(mazeSize) &&
            mazeSize >= 1 &&
            mazeSize <= MAX_MAZE_SIZE,
    )
    let startIndex = $state(0)
    let endIndex = $state(0)
    // One path string holds all walls. A cell element for each of up to 10,000 cells is too slow.
    let wallPath = $state('')
    let algorithm = $state<MazeGenAlgorithm>('prim')
    let startingPoint = $derived(indexToPoint(startIndex, renderedMazeSize))
    let endPoint = $derived(indexToPoint(endIndex, renderedMazeSize))

    const CELL_SIZE_PX = 20

    // Regenerate maze when seed, mazeSize, algorithm, or RNG instances change
    $effect(() => {
        regenerateMaze()
    })

    function regenerateMaze() {
        if (!validMazeSize || mazeSize === undefined) return
        const randomInt = getRandomIntGenerator(seed)
        const generated = generateMaze({ mazeSize, randomInt, algorithm })
        renderedMazeSize = mazeSize
        wallPath = mazeToWallPath(generated.maze, mazeSize)
        startIndex = generated.startIndex
        endIndex = generated.endIndex
    }

    function resetRNG() {
        rngInstances.delete(seed)
        rngInstances = new Map(rngInstances) // Update reference to trigger reactivity
    }
</script>

<p>This is a maze generator that I made for fun.</p>

<p>I'm hoping to use this as a starting point for some simple browser-based games.</p>

<div class="maze-info">
    <p><i class="swatch start"></i>Start: {startingPoint[0] + 1}, {startingPoint[1] + 1}</p>
    <p><i class="swatch end"></i>End: {endPoint[0] + 1}, {endPoint[1] + 1}</p>
    <p>Maze size: {renderedMazeSize} x {renderedMazeSize}</p>
</div>

<div class="maze-controls">
    <h3>Controls</h3>

    <div class="control">
        <label for="maze-size">Maze size:</label>
        <div class="maze-size-input">
            <input
                id="maze-size"
                type="number"
                min={1}
                max={MAX_MAZE_SIZE}
                step={1}
                bind:value={mazeSize}
                aria-invalid={!validMazeSize}
                aria-describedby="maze-size-help"
            />
            <p id="maze-size-help" class="maze-size-warning">
                Enter a whole number from 1 to {MAX_MAZE_SIZE}.
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
        <button onclick={regenerateMaze} disabled={!validMazeSize}>Regenerate Maze</button>
    </div>
</div>

<!-- Cell 0 is at the bottom left, so the y axis is turned over. -->
<svg
    class="maze"
    viewBox="-0.5 -0.5 {renderedMazeSize + 1} {renderedMazeSize + 1}"
    style:width="{(renderedMazeSize + 1) * CELL_SIZE_PX}px"
    role="img"
    aria-label="Generated maze, {renderedMazeSize} by {renderedMazeSize} cells"
>
    <rect class="maze-floor" x="0" y="0" width={renderedMazeSize} height={renderedMazeSize} />
    <rect
        class="maze-end"
        x={endPoint[0]}
        y={renderedMazeSize - 1 - endPoint[1]}
        width="1"
        height="1"
    />
    <rect
        class="maze-start"
        x={startingPoint[0]}
        y={renderedMazeSize - 1 - startingPoint[1]}
        width="1"
        height="1"
    />
    <path class="maze-walls" d={wallPath} />
</svg>

<style>
    .maze {
        display: block;
        max-width: 100%;
        height: auto;
        border: 1px solid var(--c-border);
        background: var(--c-bg-subtle);
    }

    .maze-floor {
        fill: var(--c-bg-input);
    }

    .maze-start,
    .swatch.start {
        fill: var(--c-danger);
        background: var(--c-danger);
    }

    .maze-end,
    .swatch.end {
        fill: var(--c-accent);
        background: var(--c-accent);
    }

    .maze-walls {
        fill: none;
        stroke: var(--c-primary);
        stroke-width: 0.12;
        stroke-linecap: square;
    }

    .swatch {
        display: inline-block;
        width: 0.7rem;
        height: 0.7rem;
        margin-right: 0.45rem;
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
