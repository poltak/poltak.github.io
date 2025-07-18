<script lang="ts">
    import { MazeGenerator } from '$lib/maze-generator'

    let MAZE_SIZE = 10
    const mazeGenerator = new MazeGenerator({ mazeSize: MAZE_SIZE, seed: 1 })
    let generated = mazeGenerator.generateMaze()
    let startingPoint = $state(generated.startingPoint)
    let maze = $state(generated.maze)
    let history = $state(generated.history)

    $effect(() => {
        console.log(
            'history:',
            history.map((point) => `${point[0] + 1},${point[1] + 1}`),
        )
    })

    function generateMaze() {
        generated = mazeGenerator.generateMaze()
        maze = generated.maze
        startingPoint = generated.startingPoint
        history = generated.history
    }
</script>

<h1>Maze Generator</h1>

<p>This is a maze generator that I made for fun.</p>

<div class="maze-info">
    <p>Starting point: {startingPoint[0] + 1}, {startingPoint[1] + 1}</p>
    <p>Maze size: {MAZE_SIZE} x {MAZE_SIZE}</p>
</div>

<div class="maze" style="width: {MAZE_SIZE * 20}px; height: {MAZE_SIZE * 20}px;">
    {#each maze as row, colI}
        <div class="row">
            {#each row as cell, rowI}
                <div
                    class="cell"
                    style="background-color: {cell ? 'black' : 'white'}; {startingPoint[0] ===
                        rowI && startingPoint[1] === colI
                        ? 'background-color: red;'
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
