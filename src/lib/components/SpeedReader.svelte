<script lang="ts">
    import { onMount, onDestroy } from 'svelte'
    import { EBookParser, type ChapterInfo, type TocEntry } from '$lib/ebook-parser'
    import type { EBook } from '$lib/stores/ebook.svelte'

    const { book }: { book: EBook } = $props()

    let words = $state<string[]>([])
    let currentWordIndex = $state(0)
    let isPlaying = $state(false)
    let wordsPerMinute = $state(400)
    let intervalId: number | null = null
    let error = $state<string | null>(null)
    let parser: EBookParser | null = null
    let toc = $state<TocEntry[]>([])
    let chapters = $state<ChapterInfo[]>([])
    let currentChapter = $state<ChapterInfo | null>(null)
    let chapterProgress = $derived({
        current: currentChapter ? chapters.findIndex((c) => c.id === currentChapter!.id) + 1 : 0,
        total: chapters.length,
    })

    let isAtEnd = $derived(currentWordIndex >= words.length)

    // Track book changes
    $effect(() => {
        console.log('Book changed:', book)
        if (book) {
            loadBook()
        }
    })

    $effect(() => {
        if (isAtEnd) {
        }
    })

    // Debug effect to track state changes
    // $effect(() => {
    //     console.log('State update:', {
    //         wordsLength: words.length,
    //         currentWordIndex,
    //         currentWord: words[currentWordIndex],
    //         isPlaying,
    //         isAtEnd,
    //         error,
    //         currentLocation,
    //     })
    // })

    async function loadBook() {
        try {
            error = null
            parser = new EBookParser(book)

            // Initialize parser and get metadata
            await parser.initialize()
            const metadata = await parser.getMetadata()
            console.log('Book metadata:', metadata)

            // Get table of contents and chapters
            toc = await parser.getToc()
            chapters = await parser.getChapters()
            console.log('Chapters:', chapters)

            // Load first chapter
            if (chapters.length > 0) {
                await loadChapter(chapters[0].id)
            }
        } catch (e) {
            error = e instanceof Error ? e.message : 'Failed to load book'
            console.error('Failed to load book:', e)
        }
    }

    async function loadChapter(chapterId: string) {
        if (!parser) return

        try {
            // Reset state for new chapter
            words = []
            currentWordIndex = 0
            isPlaying = false
            stopIterationInterval()

            // Find chapter info
            currentChapter = chapters.find((c) => c.id === chapterId) || null

            // Stream words for this chapter
            for await (const word of parser.streamChapter(chapterId)) {
                words.push(word)
            }

            console.log('Current chapter:', currentChapter)
            console.log('words:', words)

            console.log(`Loaded chapter with ${words.length} words`)
        } catch (e) {
            error = e instanceof Error ? e.message : 'Failed to load chapter'
            console.error('Failed to load chapter:', e)
        }
    }

    function startIterationInterval() {
        const intervalMs = (60 * 1000) / wordsPerMinute
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

    async function reset() {
        if (chapters.length > 0) {
            await loadChapter(chapters[0].id)
        }
    }

    function updateWPM(event: Event) {
        const input = event.target as HTMLInputElement
        wordsPerMinute = parseInt(input.value)

        if (isPlaying) {
            stopIterationInterval()
            startIterationInterval()
        }
    }

    async function jumpToChapter(entry: TocEntry) {
        await loadChapter(entry.id)
    }

    onMount(async () => {
        if (book) {
            await loadBook()
        }
    })

    onDestroy(() => {
        stopIterationInterval()
        if (parser) {
            parser.close()
        }
    })
</script>

<div class="speed-reader">
    <div class="reader-container">
        <div class="toc-panel">
            <h3>Table of Contents</h3>
            {#if toc.length > 0}
                <ul class="toc-list">
                    {#each toc as entry}
                        <li style="margin-left: {entry.level * 1}rem">
                            <button
                                class="toc-button"
                                class:active={currentChapter?.id === entry.id}
                                onclick={() => jumpToChapter(entry)}
                            >
                                {entry.label}
                            </button>
                            {#if entry.children.length > 0}
                                <ul class="toc-list">
                                    {#each entry.children as child}
                                        <li style="margin-left: {child.level * 1}rem">
                                            <button
                                                class="toc-button"
                                                class:active={currentChapter?.id === child.id}
                                                onclick={() => jumpToChapter(child)}
                                            >
                                                {child.label}
                                            </button>
                                        </li>
                                    {/each}
                                </ul>
                            {/if}
                        </li>
                    {/each}
                </ul>
            {:else}
                <p class="no-toc">No table of contents available</p>
            {/if}
        </div>

        <div class="main-panel">
            <div class="word-display">
                {#if error}
                    <span class="error">{error}</span>
                {:else if words.length > 0 && currentWordIndex < words.length}
                    <span class="current-word">{words[currentWordIndex]}</span>
                    {#if currentChapter}
                        <div class="location-info">
                            Chapter {chapterProgress.current} of {chapterProgress.total}: {currentChapter.title}
                            <br />
                            Word {currentWordIndex + 1} of {words.length}
                        </div>
                    {/if}
                {:else}
                    <span class="placeholder">Load an EPUB file to start reading</span>
                {/if}
            </div>

            <div class="controls">
                <button onclick={reset} disabled={words.length === 0}> Reset </button>

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
                    {#if currentChapter}
                        Chapter {chapterProgress.current}/{chapterProgress.total}
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .speed-reader {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        padding: 2rem;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background-color: var(--bg-color);
    }

    .reader-container {
        display: flex;
        gap: 2rem;
        height: 500px;
    }

    .toc-panel {
        width: 250px;
        border-right: 1px solid var(--border-color);
        padding-right: 1rem;
        overflow-y: auto;
    }

    .main-panel {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 2rem;
    }

    .toc-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .toc-button {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        padding: 0.25rem 0;
        text-align: left;
        width: 100%;
        font-size: 0.9rem;
    }

    .toc-button:hover {
        color: var(--primary-color);
    }

    .word-display {
        height: 400px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 4rem;
        font-weight: bold;
        padding: 1rem;
        width: 100%;
        text-align: center;
    }

    .location-info {
        font-size: 0.9rem;
        color: #666;
        margin-top: 1rem;
        font-weight: normal;
    }

    .current-word {
        margin-top: 1em;
        animation: fadeIn 0.2s ease-in-out;
    }

    .placeholder {
        color: #666;
        font-size: 1.2rem;
    }

    .error {
        color: red;
        font-size: 1rem;
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

    .no-toc {
        color: #666;
        font-style: italic;
        font-size: 0.9rem;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    .toc-button.active {
        color: var(--primary-color);
        font-weight: bold;
    }
</style>
