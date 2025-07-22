<script lang="ts">
    import { MazeGenerator, type Algorithm, ALGO_CHOICES } from '$lib/maze-generator'

    let mazeSize = $state(25)
    let seed = $state(new Date().toISOString().split('T')[0])
    const mazeGenerator = new MazeGenerator({ mazeSize: mazeSize, seed })
    let generated = mazeGenerator.generateMazeDFS()
    let startIndex = $state(generated.startIndex)
    let endIndex = $state(generated.endIndex)
    let maze = $state(generated.maze)
    let history = $state(generated.history)
    let algorithm = $state<Algorithm>('dfs')

    let startingPoint = $derived(mazeGenerator.indexToPoint(startIndex))

    $effect(() => {
        mazeGenerator.setSeed(seed)
    })

    $effect(() => {
        console.log(
            'history:',
            history.map((index) => {
                const point = mazeGenerator.indexToPoint(index)
                return `${point[0] + 1},${point[1] + 1}`
            }),
        )
    })

    function generateMaze() {
        generated = mazeGenerator.generateMaze(algorithm)
        console.log('generated maze', generated)
        maze = generated.maze
        startIndex = generated.startIndex
        endIndex = generated.endIndex
        history = generated.history
    }

    function onMazeSizeChange() {
        mazeGenerator.setMazeSize(mazeSize)
        generateMaze()
    }
</script>

<h1>Maze Generator</h1>

<p>This is a maze generator that I made for fun.</p>

<div class="maze-info">
    <p>Starting point: {startingPoint[0] + 1}, {startingPoint[1] + 1}</p>
    <p>Maze size: {mazeSize} x {mazeSize}</p>
</div>

<div class="maze-controls">
    <h3>Controls</h3>

    <div class="control">
        <label for="maze-size">Maze size:</label>
        <input
            id="maze-size"
            type="number"
            min={1}
            max={100}
            bind:value={mazeSize}
            onchange={onMazeSizeChange}
        />
    </div>

    <div class="control">
        <label for="seed">Seed:</label>
        <input id="seed" type="text" bind:value={seed} />
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
        <button onclick={generateMaze}>Regenerate Maze</button>
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
    }
</style>
