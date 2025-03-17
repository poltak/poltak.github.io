<script lang="ts">
    import { onDestroy } from 'svelte'
    import { parseEpub } from '$lib/ebook-parser'
    import type { EBook } from '$lib/stores/ebook.svelte'

    const { book }: { book: EBook } = $props()

    let words = $state<string[]>([])
    let currentWordIndex = $state(0)
    let isPlaying = $state(false)
    let wordsPerMinute = $state(400)
    let intervalId: number | null = null
    let error = $state<string | null>(null)

    let isAtEnd = $derived(currentWordIndex >= words.length)

    $effect(() => {
        if (book) {
            parseEpub(book)
                .then((newWords) => {
                    console.log('Parsed words:', newWords.length)
                    words = newWords
                })
                .catch((err) => {
                    console.error('Error parsing EPUB:', err)
                    error = err.message
                })
        }
    })

    $effect(() => {
        if (isAtEnd) {
            isPlaying = false
            currentWordIndex = words.length - 1
        }
    })

    function startIterationInterval() {
        const intervalMs = (60 * 1000) / wordsPerMinute // Convert WPM to milliseconds
        intervalId = setInterval(() => {
            if (currentWordIndex < words.length - 1) {
                currentWordIndex++
            } else {
                isPlaying = false
            }
        }, intervalMs)
    }

    function stopIterationInterval() {
        if (intervalId != null) {
            clearInterval(intervalId)
            intervalId = null
        }
    }

    function togglePlay() {
        isPlaying = !isPlaying

        if (isPlaying) {
            startIterationInterval()
        } else {
            stopIterationInterval()
        }
    }

    function reset() {
        currentWordIndex = 0
        isPlaying = false
        stopIterationInterval()
    }

    function updateWPM(event: Event) {
        const input = event.target as HTMLInputElement
        wordsPerMinute = parseInt(input.value)

        if (isPlaying) {
            // Restart the interval with new speed
            stopIterationInterval()
            startIterationInterval()
        }
    }

    onDestroy(() => {
        stopIterationInterval()
    })
</script>

<div class="speed-reader">
    <div class="word-display">
        {#if error}
            <span class="error">{error}</span>
        {:else if words.length > 0 && currentWordIndex < words.length}
            <span class="current-word">{words[currentWordIndex]}</span>
        {:else}
            <span class="placeholder">Load an EPUB file to start reading</span>
        {/if}
    </div>

    <div class="controls">
        <button onclick={reset} disabled={words.length === 0}>Reset</button>

        <button onclick={togglePlay} disabled={words.length === 0}>
            {isPlaying ? 'Pause' : 'Play'}
        </button>

        <div class="speed-control">
            <label for="wpm">Speed (WPM):</label>
            <input
                type="number"
                id="wpm"
                min="50"
                max="1000"
                value={wordsPerMinute}
                onchange={updateWPM}
            />
        </div>

        <div class="progress">
            {#if words.length > 0}
                {currentWordIndex + 1} / {words.length} words
            {/if}
        </div>
    </div>
</div>

<style>
    .speed-reader {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem;
        padding: 2rem;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background-color: var(--bg-color);
    }

    .word-display {
        height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        font-weight: bold;
        padding: 1rem;
        width: 100%;
        text-align: center;
    }

    .current-word {
        animation: fadeIn 0.2s ease-in-out;
    }

    .placeholder {
        color: #666;
        font-size: 1.2rem;
    }

    .controls {
        display: flex;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;
        justify-content: center;
    }

    button {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        background-color: var(--primary-color);
        color: var(--text-color);
        cursor: pointer;
        font-size: 1rem;
    }

    button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    button:hover:not(:disabled) {
        opacity: 0.9;
    }

    .speed-control {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    input[type='number'] {
        width: 80px;
        padding: 0.25rem;
        border: 1px solid var(--border-color);
        border-radius: 4px;
    }

    .progress {
        font-size: 0.9rem;
        color: #666;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    .error {
        color: red;
        font-size: 1rem;
    }
</style>
