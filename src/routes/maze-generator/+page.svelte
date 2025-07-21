<script lang="ts">
    import { MazeGenerator } from '$lib/maze-generator'

    let mazeSize = $state(25)
    const mazeGenerator = new MazeGenerator({ mazeSize: mazeSize, seed: 1 })
    let generated = mazeGenerator.generateMazeDFS()
    let startIndex = $state(generated.startIndex)
    let endIndex = $state(generated.endIndex)
    let maze = $state(generated.maze)
    let history = $state(generated.history)

    let startingPoint = $derived(mazeGenerator.indexToPoint(startIndex))

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
        generated = mazeGenerator.generateMazeDFS()
        maze = generated.maze
        startIndex = generated.startIndex
        endIndex = generated.endIndex
        history = generated.history
    }
</script>

<h1>Maze Generator</h1>

<p>This is a maze generator that I made for fun.</p>

<div class="maze-info">
    <p>Starting point: {startingPoint[0] + 1}, {startingPoint[1] + 1}</p>
    <p>Maze size: {mazeSize} x {mazeSize}</p>
</div>

<div class="maze" style="width: {mazeSize * 20}px; height: {mazeSize * 20}px;">
    {#each Array.from({ length: mazeSize }, (_, rowIndex) => rowIndex) as rowIndex}
        <div class="row">
            {#each Array.from({ length: mazeSize }, (_, colIndex) => colIndex) as colIndex}
                {@const cellIndex = rowIndex * mazeSize + colIndex}
                {@const cell = maze[cellIndex]}
                <div
                    class="cell"
                    style="background-color: {cell ? 'black' : 'white'}; {startIndex === cellIndex
                        ? 'background-color: red;'
                        : endIndex === cellIndex
                          ? 'background-color: blue;'
                          : ''}"
                ></div>
            {/each}
        </div>
    {/each}
</div>

<button onclick={generateMaze}>Regenerate Maze</button>

<style>
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
        border: 1px solid #ccc;
    }
</style>
