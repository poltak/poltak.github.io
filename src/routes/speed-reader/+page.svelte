<script lang="ts">
    import { EpubParser, type EpubData, type TableOfContents } from '$lib/epub-parser'
    import Icon from '$lib/components/icons/Icon.svelte'
    import { onMount } from 'svelte'

    let fileInput = $state<HTMLInputElement>()
    let epubData = $state<EpubData | null>(null)
    let isLoading = $state(false)
    let errorMessage = $state('')
    let isPlaying = $state(false)
    let wordsPerMinute = $state(250)
    let currentWordIndex = $state(0)
    let allWords = $state<string[]>([])
    let readingInterval = $state<number | null>(null)

    const currentWord = $derived(
        allWords[currentWordIndex] ?? (isPlaying ? '' : 'Press play to start'),
    )
    const progressPercentage = $derived(
        allWords.length > 0 ? (currentWordIndex / allWords.length) * 100 : 0,
    )

    const isChapterActive = $derived((item: TableOfContents): boolean => {
        if (!epubData) return false
        const nextChapter = epubData.tableOfContents[item.order + 1]
        return (
            currentWordIndex >= item.wordStartIndex &&
            (nextChapter ? currentWordIndex < nextChapter.wordStartIndex : true)
        )
    })

    const parser = new EpubParser()

    async function handleFileUpload() {
        const file = fileInput?.files?.[0]
        if (!file) return

        if (!file.name.toLowerCase().endsWith('.epub')) {
            errorMessage = 'Please select an EPUB file.'
            return
        }

        isLoading = true
        errorMessage = ''

        try {
            epubData = await parser.parseFile(file)

            // Split all text into words for speed reading
            allWords = epubData.allText.split(/\s+/).filter((word) => word.trim().length > 0)

            currentWordIndex = 0
        } catch (error) {
            console.error('Error parsing EPUB:', error)
            errorMessage = `Error parsing EPUB: ${error instanceof Error ? error.message : 'Unknown error'}`
            epubData = null
        } finally {
            isLoading = false
        }
    }

    function togglePlayPause() {
        if (isPlaying) {
            pauseReading()
        } else {
            startReading()
        }
    }

    function startReading() {
        if (allWords.length === 0) return
        isPlaying = true
        updateReadingSpeed()
    }

    function pauseReading() {
        isPlaying = false
        if (readingInterval) {
            clearInterval(readingInterval)
            readingInterval = null
        }
    }

    function updateReadingSpeed() {
        if (readingInterval) {
            clearInterval(readingInterval)
            readingInterval = null
        }

        if (!isPlaying) return

        // Calculate interval in milliseconds
        const intervalMs = Math.max(60000 / wordsPerMinute, 50) // Minimum 50ms interval

        readingInterval = setInterval(() => {
            if (currentWordIndex >= allWords.length - 1) {
                pauseReading()
                return
            }
            currentWordIndex++
        }, intervalMs)
    }

    function resetReading() {
        pauseReading()
        currentWordIndex = 0
    }

    function navigateToChapter(wordStartIndex: number) {
        const wasPlaying = isPlaying
        if (isPlaying) {
            pauseReading()
        }

        currentWordIndex = Math.min(wordStartIndex, allWords.length - 1)

        if (wasPlaying) {
            startReading()
        }
    }

    function handleWpmChange() {
        if (isPlaying) {
            updateReadingSpeed()
        }
    }

    // Effect for cleanup only
    $effect(() => {
        return () => {
            if (readingInterval) {
                clearInterval(readingInterval)
                readingInterval = null
            }
        }
    })
</script>

<svelte:head>
    <title>EPUB Speed Reader</title>
    <meta name="description" content="A fast EPUB speed reader with adjustable reading speed" />
</svelte:head>

<main class="bg-gray-50 text-gray-800">
    <div class="container mx-auto max-w-7xl">
        {#if !epubData}
            <div class="flex min-h-screen items-center justify-center p-4">
                <div
                    class="w-full max-w-lg rounded-2xl border border-gray-200/60 bg-white/80 p-8 shadow-xl backdrop-blur-sm"
                >
                    <div class="mb-8 text-center">
                        <div
                            class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        >
                            <Icon name="book" size={32} className="text-white" />
                        </div>
                        <h2 class="mb-3 text-3xl font-bold text-gray-800">Upload an EPUB file</h2>
                        <p class="text-gray-600">Select your book and start speed reading</p>
                    </div>

                    <div class="space-y-6">
                        <div class="relative">
                            <input
                                bind:this={fileInput}
                                type="file"
                                accept=".epub"
                                onchange={handleFileUpload}
                                class="w-full rounded-xl border-2 border-dashed border-gray-300 p-6 text-center transition-all hover:border-indigo-400 hover:bg-indigo-50/50 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none"
                            />
                            <div
                                class="pointer-events-none absolute inset-0 flex items-center justify-center"
                            >
                                <div class="text-center text-gray-500">
                                    <Icon name="upload-cloud" size={32} className="mx-auto mb-2" />
                                    <span class="text-sm font-medium"
                                        >Drop your EPUB file here or click to browse</span
                                    >
                                </div>
                            </div>
                        </div>

                        {#if isLoading}
                            <div class="flex items-center justify-center py-12">
                                <div class="flex items-center space-x-3">
                                    <div
                                        class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"
                                    ></div>
                                    <span class="font-medium text-gray-700">Parsing EPUB...</span>
                                </div>
                            </div>
                        {/if}

                        {#if errorMessage}
                            <div
                                class="flex items-start space-x-3 rounded-xl border border-red-200 bg-red-50 p-4"
                            >
                                <Icon
                                    name="alert-circle"
                                    size={20}
                                    className="mt-0.5 flex-shrink-0 text-red-500"
                                />
                                <div>
                                    <h4 class="font-medium text-red-800">Error parsing EPUB</h4>
                                    <p class="mt-1 text-sm text-red-700">{errorMessage}</p>
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        {:else}
            <div class="flex min-h-screen flex-col items-center justify-center p-4">
                <div class="w-full max-w-2xl space-y-8">
                    <!-- Current Word Display -->
                    <div class="relative">
                        <div
                            class="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-100 to-purple-100 opacity-60 blur-xl"
                        ></div>
                        <div
                            class="relative flex min-h-[160px] items-center justify-center rounded-2xl border border-gray-200/50 bg-gradient-to-br from-gray-50 to-white p-12 shadow-inner"
                        >
                            <span
                                class="font-mono text-6xl font-bold tracking-wide text-gray-900 select-none"
                            >
                                {currentWord}
                            </span>
                        </div>
                    </div>

                    <!-- Progress -->
                    <div class="space-y-4">
                        <div class="flex justify-between text-sm font-medium">
                            <div class="flex items-center space-x-2 text-gray-600">
                                <Icon name="info" size={16} />
                                <span>Word {(currentWordIndex + 1).toLocaleString()}</span>
                            </div>
                            <div class="flex items-center space-x-2 font-bold text-indigo-600">
                                <span>{progressPercentage.toFixed(1)}%</span>
                            </div>
                            <div class="flex items-center space-x-2 text-gray-600">
                                <span>{allWords.length.toLocaleString()} total</span>
                                <Icon name="file-text" size={16} />
                            </div>
                        </div>
                        <div
                            class="relative h-3 w-full rounded-full bg-gradient-to-r from-gray-200 to-gray-300"
                        >
                            <div
                                class="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-sm transition-all duration-300"
                                style="width: {progressPercentage}%"
                            ></div>
                        </div>
                    </div>

                    <!-- Controls -->
                    <div class="flex items-center justify-center space-x-8">
                        <button
                            onclick={resetReading}
                            class="rounded-full bg-gray-200 p-4 text-gray-600 transition-all duration-200 hover:scale-110 hover:bg-gray-300"
                            title="Reset to beginning"
                        >
                            <Icon name="refresh" size={24} />
                        </button>

                        <button
                            onclick={togglePlayPause}
                            class="rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl disabled:opacity-50"
                            disabled={allWords.length === 0}
                            aria-label={isPlaying ? 'Pause' : 'Play'}
                        >
                            {#if isPlaying}
                                <Icon name="pause" size={32} />
                            {:else}
                                <Icon name="play" size={32} />
                            {/if}
                        </button>

                        <div class="flex items-center space-x-2">
                            <input
                                id="wpm"
                                type="number"
                                bind:value={wordsPerMinute}
                                oninput={handleWpmChange}
                                min="50"
                                max="1000"
                                step="10"
                                class="w-24 rounded-full border-gray-200 bg-white px-4 py-2 text-center font-bold text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                            />
                            <label for="wpm" class="text-sm font-semibold text-gray-700">WPM</label>
                        </div>
                    </div>

                    <!-- Quick WPM presets -->
                    <div class="flex items-center justify-center space-x-2">
                        {#each [200, 300, 400, 500, 600] as preset (preset)}
                            <button
                                onclick={() => {
                                    wordsPerMinute = preset
                                    handleWpmChange()
                                }}
                                class="rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200"
                                class:bg-indigo-600={wordsPerMinute === preset}
                                class:text-white={wordsPerMinute === preset}
                                class:bg-gray-200={wordsPerMinute !== preset}
                                class:text-gray-700={wordsPerMinute !== preset}
                                class:hover:bg-gray-300={wordsPerMinute !== preset}
                            >
                                {preset}
                            </button>
                        {/each}
                    </div>
                </div>

                <!-- Table of Contents below the reader -->
                {#if epubData.tableOfContents.length > 1}
                    <div class="mt-12 w-full max-w-2xl">
                        <h3 class="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
                            <Icon name="menu" size={20} className="text-indigo-500" />
                            Table of Contents
                        </h3>
                        <div class="flex flex-col gap-2">
                            {#each epubData.tableOfContents as item (item.order)}
                                {@const isActive = isChapterActive(item)}
                                <button
                                    onclick={() => navigateToChapter(item.wordStartIndex)}
                                    class="group flex items-center justify-between rounded-lg px-4 py-3 text-left transition-all duration-200"
                                    class:bg-indigo-50={isActive}
                                    class:hover:bg-gray-100={!isActive}
                                >
                                    <div class="flex min-w-0 items-center gap-3">
                                        <div
                                            class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-gray-200"
                                        >
                                            <span
                                                class="text-xs font-bold transition-colors"
                                                class:text-indigo-600={isActive}
                                                class:text-gray-600={!isActive}
                                                >{item.order + 1}</span
                                            >
                                        </div>
                                        <div class="min-w-0 flex-1">
                                            <p
                                                class="truncate text-sm font-medium transition-colors"
                                                class:text-indigo-700={isActive}
                                                class:text-gray-800={!isActive}
                                                class:group-hover:text-indigo-700={!isActive}
                                            >
                                                {item.title || `Chapter ${item.order + 1}`}
                                            </p>
                                        </div>
                                    </div>
                                    <Icon
                                        name="chevron-right"
                                        size={16}
                                        className="text-gray-400 transition-colors group-hover:text-indigo-500"
                                    />
                                </button>
                            {/each}
                        </div>
                    </div>
                {/if}

                <!-- New Book Button -->
                <div class="mt-8 w-full max-w-2xl">
                    <button
                        onclick={() => {
                            epubData = null
                            resetReading()
                        }}
                        class="flex w-full items-center justify-center space-x-2 rounded-xl bg-gray-100 px-4 py-3 text-gray-700 transition-colors hover:bg-gray-200"
                    >
                        <Icon name="upload" size={16} />
                        <span>New Book</span>
                    </button>
                </div>
            </div>
        {/if}
    </div>
</main>

<style>
    /* For Webkit-based browsers (Chrome, Safari) */
    aside::-webkit-scrollbar {
        width: 8px;
    }
    aside::-webkit-scrollbar-track {
        background: #f1f5f9; /* gray-100 */
    }
    aside::-webkit-scrollbar-thumb {
        background: #d1d5db; /* gray-300 */
        border-radius: 4px;
    }
    aside::-webkit-scrollbar-thumb:hover {
        background: #9ca3af; /* gray-400 */
    }
</style>
