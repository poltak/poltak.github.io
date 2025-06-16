<script lang="ts">
    import { EpubParser, type EpubData, type TableOfContents } from '$lib/epub-parser'
    import { epubStorage, type StoredBook, type ReadingProgress } from '$lib/storage/epub-storage'
    import Icon from '$lib/components/icons/Icon.svelte'
    import { onMount } from 'svelte'

    let fileInput = $state<HTMLInputElement>()
    let epubData = $state<EpubData | null>(null)
    let currentBookId = $state<string | null>(null)
    let isLoading = $state(false)
    let errorMessage = $state('')
    let isPlaying = $state(false)
    let wordsPerMinute = $state(250)
    let currentWordIndex = $state(0)
    let allWords = $state<string[]>([])
    let readingInterval = $state<number | null>(null)
    let storedBooks = $state<StoredBook[]>([])
    let showLibrary = $state(true)
    let isLoadingLibrary = $state(false)
    let bookProgresses = $state<Map<string, ReadingProgress>>(new Map())

    // Number of surrounding words to show on each side
    let surroundingWordsCount = $state(3)

    // Punctuation pause multipliers
    let periodMultiplier = $state(3)
    let commaMultiplier = $state(2)
    let semicolonMultiplier = $state(2.5)
    let exclamationMultiplier = $state(3)

    // Extra settings panel visibility
    let showExtraSettings = $state(false)

    // Table of contents visibility
    let showTableOfContents = $state(true)

    const currentWord = $derived(
        allWords[currentWordIndex] ?? (isPlaying ? '' : 'Press play to start'),
    )

    const surroundingWords = $derived.by(() => {
        if (allWords.length === 0) {
            return {
                before: [],
                current: isPlaying ? '' : 'Press play to start',
                after: [],
            }
        }

        const startIndex = Math.max(0, currentWordIndex - surroundingWordsCount)
        const endIndex = Math.min(allWords.length - 1, currentWordIndex + surroundingWordsCount)

        const before = allWords.slice(startIndex, currentWordIndex)
        const current = allWords[currentWordIndex] || ''
        const after = allWords.slice(currentWordIndex + 1, endIndex + 1)

        return { before, current, after }
    })
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

    // Auto-save progress every 10 seconds while reading
    let progressSaveInterval: number | null = null

    onMount(async () => {
        try {
            await epubStorage.init()
            await loadLibrary()
        } catch (error) {
            console.error('Failed to initialize storage:', error)
        }
    })

    async function loadLibrary() {
        isLoadingLibrary = true
        try {
            storedBooks = await epubStorage.getBooks()

            // Load progress for each book
            const progressMap = new Map<string, ReadingProgress>()
            for (const book of storedBooks) {
                const progress = await epubStorage.getProgress(book.id)
                if (progress) {
                    progressMap.set(book.id, progress)
                }
            }
            bookProgresses = progressMap
        } catch (error) {
            console.error('Failed to load library:', error)
        } finally {
            isLoadingLibrary = false
        }
    }

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

            // Save the book to storage
            currentBookId = await epubStorage.saveBook(epubData, allWords.length)

            currentWordIndex = 0
            showLibrary = false
            await loadLibrary() // Refresh library
        } catch (error) {
            console.error('Error parsing EPUB:', error)
            errorMessage = `Error parsing EPUB: ${error instanceof Error ? error.message : 'Unknown error'}`
            epubData = null
        } finally {
            isLoading = false
        }
    }

    async function openStoredBook(book: StoredBook) {
        isLoading = true
        try {
            epubData = book.epubData
            currentBookId = book.id
            allWords = epubData.allText.split(/\s+/).filter((word) => word.trim().length > 0)

            // Load saved progress
            const progress = await epubStorage.getProgress(book.id)
            if (progress) {
                currentWordIndex = progress.currentWordIndex
                wordsPerMinute = progress.wordsPerMinute
            } else {
                currentWordIndex = 0
            }

            await epubStorage.updateLastReadDate(book.id)
            showLibrary = false
            await loadLibrary() // Refresh library
        } catch (error) {
            console.error('Error opening book:', error)
            errorMessage = `Error opening book: ${error instanceof Error ? error.message : 'Unknown error'}`
        } finally {
            isLoading = false
        }
    }

    async function deleteStoredBook(bookId: string, event: Event) {
        event.stopPropagation() // Prevent opening the book
        try {
            await epubStorage.deleteBook(bookId)
            await loadLibrary()
        } catch (error) {
            console.error('Error deleting book:', error)
        }
    }

    async function saveProgress() {
        if (!currentBookId || allWords.length === 0) return

        const progress: ReadingProgress = {
            bookId: currentBookId,
            currentWordIndex,
            wordsPerMinute,
            lastReadDate: new Date(),
            progressPercentage: (currentWordIndex / allWords.length) * 100,
        }

        try {
            await epubStorage.saveProgress(progress)
        } catch (error) {
            console.error('Error saving progress:', error)
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

        // Start auto-save interval
        if (progressSaveInterval) {
            clearInterval(progressSaveInterval)
        }
        progressSaveInterval = setInterval(saveProgress, 10000) // Save every 10 seconds
    }

    function pauseReading() {
        isPlaying = false
        if (readingInterval) {
            clearTimeout(readingInterval)
            readingInterval = null
        }

        // Stop auto-save interval and save current progress
        if (progressSaveInterval) {
            clearInterval(progressSaveInterval)
            progressSaveInterval = null
        }
        saveProgress()
    }

    function getPuncturationMultiplier(word: string): number {
        // Check for punctuation at the end of the word
        const lastChar = word.slice(-1)
        if (lastChar === '.') return periodMultiplier
        if (lastChar === ',') return commaMultiplier
        if (lastChar === ';' || lastChar === ':') return semicolonMultiplier
        if (lastChar === '!' || lastChar === '?') return exclamationMultiplier
        return 1 // No punctuation: normal speed
    }

    function scheduleNextWord() {
        if (currentWordIndex >= allWords.length - 1) {
            pauseReading()
            return
        }

        // Get the current word to check for punctuation
        const currentWordText = allWords[currentWordIndex] || ''
        const multiplier = getPuncturationMultiplier(currentWordText)

        // Calculate interval in milliseconds with punctuation pause
        const baseIntervalMs = Math.max(60000 / wordsPerMinute, 50) // Minimum 50ms interval
        const actualIntervalMs = baseIntervalMs * multiplier

        readingInterval = setTimeout(() => {
            if (!isPlaying) return // Safety check in case reading was paused
            currentWordIndex++
            scheduleNextWord() // Schedule the next word
        }, actualIntervalMs)
    }

    function updateReadingSpeed() {
        if (readingInterval) {
            clearTimeout(readingInterval)
            readingInterval = null
        }

        if (!isPlaying) return

        scheduleNextWord()
    }

    function resetReading() {
        pauseReading()
        currentWordIndex = 0
        saveProgress() // Save the reset position
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

    function backToLibrary() {
        pauseReading()
        epubData = null
        currentBookId = null
        allWords = []
        currentWordIndex = 0
        showLibrary = true
    }

    // Effect for cleanup only
    $effect(() => {
        return () => {
            if (readingInterval) {
                clearTimeout(readingInterval)
                readingInterval = null
            }
            if (progressSaveInterval) {
                clearInterval(progressSaveInterval)
                progressSaveInterval = null
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
        {#if showLibrary}
            <div class="p-4">
                <div class="mx-auto max-w-4xl">
                    <!-- Header -->
                    <div class="mb-8 text-center">
                        <div
                            class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        >
                            <Icon name="book" size={32} className="text-white" />
                        </div>
                        <h1 class="mb-3 text-4xl font-bold text-gray-800">EPUB Speed Reader</h1>
                        <p class="text-gray-600">Your personal library of speed-readable books</p>
                    </div>

                    <!-- Upload Section -->
                    <div class="mb-8">
                        <div
                            class="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-xl backdrop-blur-sm"
                        >
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
                                        <Icon
                                            name="upload-cloud"
                                            size={32}
                                            className="mx-auto mb-2"
                                        />
                                        <span class="text-sm font-medium"
                                            >Add a new EPUB file to your library</span
                                        >
                                    </div>
                                </div>
                            </div>

                            {#if isLoading}
                                <div class="mt-4 flex items-center justify-center py-6">
                                    <div class="flex items-center space-x-3">
                                        <div
                                            class="h-6 w-6 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"
                                        ></div>
                                        <span class="font-medium text-gray-700"
                                            >Adding to library...</span
                                        >
                                    </div>
                                </div>
                            {/if}

                            {#if errorMessage}
                                <div
                                    class="mt-4 flex items-start space-x-3 rounded-xl border border-red-200 bg-red-50 p-4"
                                >
                                    <Icon
                                        name="alert-circle"
                                        size={20}
                                        className="mt-0.5 flex-shrink-0 text-red-500"
                                    />
                                    <div>
                                        <h4 class="font-medium text-red-800">Error</h4>
                                        <p class="mt-1 text-sm text-red-700">{errorMessage}</p>
                                    </div>
                                </div>
                            {/if}
                        </div>
                    </div>

                    <!-- Library -->
                    {#if isLoadingLibrary}
                        <div class="flex items-center justify-center py-12">
                            <div class="flex items-center space-x-3">
                                <div
                                    class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"
                                ></div>
                                <span class="font-medium text-gray-700">Loading library...</span>
                            </div>
                        </div>
                    {:else if storedBooks.length === 0}
                        <div class="py-12 text-center">
                            <Icon name="book" size={48} className="mx-auto mb-4 text-gray-400" />
                            <h3 class="mb-2 text-xl font-semibold text-gray-700">No books yet</h3>
                            <p class="text-gray-500">Upload your first EPUB file to get started</p>
                        </div>
                    {:else}
                        <div>
                            <h2 class="mb-4 text-2xl font-bold text-gray-800">
                                Your Library ({storedBooks.length} books)
                            </h2>
                            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {#each storedBooks as book (book.id)}
                                    {@const progress = bookProgresses.get(book.id)}
                                    {@const progressPercentage =
                                        progress && book.totalWords > 0
                                            ? Math.round(
                                                  (progress.currentWordIndex / book.totalWords) *
                                                      100,
                                              )
                                            : 0}
                                    <div
                                        class="group relative cursor-pointer rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
                                        onclick={() => openStoredBook(book)}
                                    >
                                        <div class="mb-4">
                                            <h3 class="line-clamp-2 font-semibold text-gray-800">
                                                {book.title}
                                            </h3>
                                            {#if book.author}
                                                <p class="mt-1 text-sm text-gray-600">
                                                    by {book.author}
                                                </p>
                                            {/if}
                                        </div>

                                        <div class="mb-4">
                                            <div
                                                class="mb-1 flex justify-between text-xs text-gray-500"
                                            >
                                                <span>Progress</span>
                                                <span>{progressPercentage}%</span>
                                            </div>
                                            <div class="h-2 rounded-full bg-gray-200">
                                                <div
                                                    class="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                                                    style="width: {progressPercentage}%"
                                                ></div>
                                            </div>
                                        </div>

                                        <div
                                            class="flex items-center justify-between text-xs text-gray-500"
                                        >
                                            <span>{book.totalWords.toLocaleString()} words</span>
                                            <span>
                                                {new Date(book.lastReadDate).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <!-- Progress indicator badge -->
                                        {#if progressPercentage > 0}
                                            <div class="absolute top-2 left-2">
                                                {#if progressPercentage >= 100}
                                                    <div
                                                        class="rounded-full bg-green-500 px-2 py-1 text-xs font-semibold text-white"
                                                    >
                                                        Complete
                                                    </div>
                                                {:else}
                                                    <div
                                                        class="rounded-full bg-indigo-500 px-2 py-1 text-xs font-semibold text-white"
                                                    >
                                                        {progressPercentage}%
                                                    </div>
                                                {/if}
                                            </div>
                                        {/if}

                                        <!-- Delete button -->
                                        <button
                                            onclick={(e) => deleteStoredBook(book.id, e)}
                                            class="absolute top-2 right-2 rounded-full bg-red-500 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                                            title="Delete book"
                                        >
                                            <Icon name="trash-2" size={12} />
                                        </button>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        {:else}
            <div class="flex flex-col items-center justify-start p-2 sm:p-4">
                <div class="w-full max-w-2xl space-y-4 sm:space-y-8">
                    <!-- Current Word Display with Context -->
                    <div class="relative">
                        <div
                            class="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-100 to-purple-100 opacity-60 blur-xl"
                        ></div>
                        <div
                            class="relative flex min-h-[120px] items-center justify-center overflow-hidden rounded-2xl border border-gray-200/50 bg-gradient-to-br from-gray-50 to-white p-4 shadow-inner sm:min-h-[160px] sm:p-8 md:p-12"
                        >
                            <div
                                class="relative flex h-full w-full items-center justify-center select-none"
                            >
                                <!-- Container for the current word with before/after positioned relative to it -->
                                <div class="relative flex items-center">
                                    <!-- Before words - positioned to the left of current word -->
                                    <div class="mr-2 flex items-center gap-2 sm:mr-4 sm:gap-3">
                                        {#each surroundingWords.before as word, i (surroundingWords.before.length - 1 - i)}
                                            <span
                                                class="font-mono text-xl whitespace-nowrap text-gray-400 sm:text-2xl md:text-3xl"
                                            >
                                                {surroundingWords.before[
                                                    surroundingWords.before.length - 1 - i
                                                ]}
                                            </span>
                                        {/each}
                                    </div>

                                    <!-- Current word - centered within its container -->
                                    <span
                                        class="rounded-lg bg-gradient-to-r from-indigo-100 to-purple-100 px-2 py-1 font-mono text-3xl font-bold text-gray-900 sm:px-3 sm:text-4xl md:text-5xl"
                                    >
                                        {surroundingWords.current}
                                    </span>

                                    <!-- After words - positioned to the right of current word -->
                                    <div class="ml-2 flex items-center gap-2 sm:ml-4 sm:gap-3">
                                        {#each surroundingWords.after as word, i (i)}
                                            <span
                                                class="font-mono text-xl whitespace-nowrap text-gray-400 sm:text-2xl md:text-3xl"
                                            >
                                                {word}
                                            </span>
                                        {/each}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Progress -->
                    <div class="space-y-3 sm:space-y-4">
                        <div class="flex justify-between text-xs font-medium sm:text-sm">
                            <div class="flex items-center space-x-1 text-gray-600 sm:space-x-2">
                                <Icon name="info" size={14} className="sm:w-4 sm:h-4" />
                                <span class="hidden sm:inline">Word </span>
                                <span>{(currentWordIndex + 1).toLocaleString()}</span>
                            </div>
                            <div
                                class="flex items-center space-x-1 font-bold text-indigo-600 sm:space-x-2"
                            >
                                <span>{progressPercentage.toFixed(1)}%</span>
                            </div>
                            <div class="flex items-center space-x-1 text-gray-600 sm:space-x-2">
                                <span>{allWords.length.toLocaleString()}</span>
                                <span class="hidden sm:inline">total</span>
                                <Icon name="file-text" size={14} className="sm:w-4 sm:h-4" />
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
                    <div class="flex items-center justify-center space-x-4 sm:space-x-8">
                        <button
                            onclick={resetReading}
                            class="rounded-full bg-gray-200 p-3 text-gray-600 transition-all duration-200 hover:scale-110 hover:bg-gray-300 sm:p-4"
                            title="Reset to beginning"
                        >
                            <Icon name="refresh" size={20} className="sm:w-6 sm:h-6" />
                        </button>

                        <button
                            onclick={togglePlayPause}
                            class="rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-4 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl disabled:opacity-50 sm:p-6"
                            disabled={allWords.length === 0}
                            aria-label={isPlaying ? 'Pause' : 'Play'}
                        >
                            {#if isPlaying}
                                <Icon name="pause" size={24} className="sm:w-8 sm:h-8" />
                            {:else}
                                <Icon name="play" size={24} className="sm:w-8 sm:h-8" />
                            {/if}
                        </button>

                        <div class="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                            <div class="flex items-center space-x-1 sm:space-x-2">
                                <input
                                    id="wpm"
                                    type="number"
                                    bind:value={wordsPerMinute}
                                    oninput={handleWpmChange}
                                    min="50"
                                    max="1000"
                                    step="10"
                                    class="w-20 rounded-full border-gray-200 bg-white px-3 py-1.5 text-center text-sm font-bold text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 focus:outline-none sm:w-24 sm:px-4 sm:py-2"
                                />
                                <label
                                    for="wpm"
                                    class="text-xs font-semibold text-gray-700 sm:text-sm"
                                    >WPM</label
                                >
                            </div>

                            <div class="flex items-center space-x-1 sm:space-x-2">
                                <input
                                    id="context"
                                    type="number"
                                    bind:value={surroundingWordsCount}
                                    min="0"
                                    max="8"
                                    step="1"
                                    class="w-14 rounded-full border-gray-200 bg-white px-2 py-1.5 text-center text-sm font-bold text-purple-600 shadow-sm focus:border-purple-300 focus:ring-2 focus:ring-purple-200 focus:outline-none sm:w-16 sm:px-3 sm:py-2"
                                />
                                <label
                                    for="context"
                                    class="text-xs font-semibold text-gray-700 sm:text-sm"
                                    >Context</label
                                >
                            </div>
                        </div>
                    </div>

                    <!-- Quick WPM presets -->
                    <div class="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                        {#each [200, 300, 400, 500, 600] as preset (preset)}
                            <button
                                onclick={() => {
                                    wordsPerMinute = preset
                                    handleWpmChange()
                                }}
                                class="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-200 sm:px-4 sm:py-2 sm:text-sm"
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

                    <!-- Extra Settings Toggle & Panel -->
                    <div class="mt-4">
                        <button
                            onclick={() => (showExtraSettings = !showExtraSettings)}
                            class="mx-auto flex items-center justify-center space-x-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-200 focus:ring-2 focus:ring-gray-300 focus:outline-none"
                        >
                            <Icon
                                name={showExtraSettings ? 'chevron-up' : 'chevron-down'}
                                size={16}
                            />
                            <span>Extra Settings</span>
                        </button>

                        <!-- Extra Settings Panel as horizontal row -->
                        {#if showExtraSettings}
                            <div
                                class="mt-4 w-full rounded-xl border border-gray-200 bg-gray-50/50 p-4 transition-all"
                            >
                                <h4 class="mb-3 text-center text-sm font-semibold text-gray-700">
                                    Punctuation Pause Multipliers
                                </h4>
                                <div
                                    class="flex flex-wrap items-center justify-center gap-3 sm:gap-4"
                                >
                                    <div class="flex items-center space-x-1">
                                        <input
                                            id="period"
                                            type="number"
                                            bind:value={periodMultiplier}
                                            min="1"
                                            max="10"
                                            step="0.5"
                                            class="w-14 rounded-full border-gray-200 bg-white px-2 py-1 text-center text-sm font-bold text-emerald-600 shadow-sm focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                                        />
                                        <label
                                            for="period"
                                            class="text-xs font-medium text-gray-600"
                                            >. Period</label
                                        >
                                    </div>

                                    <div class="flex items-center space-x-1">
                                        <input
                                            id="comma"
                                            type="number"
                                            bind:value={commaMultiplier}
                                            min="1"
                                            max="10"
                                            step="0.5"
                                            class="w-14 rounded-full border-gray-200 bg-white px-2 py-1 text-center text-sm font-bold text-blue-600 shadow-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                                        />
                                        <label for="comma" class="text-xs font-medium text-gray-600"
                                            >, Comma</label
                                        >
                                    </div>

                                    <div class="flex items-center space-x-1">
                                        <input
                                            id="semicolon"
                                            type="number"
                                            bind:value={semicolonMultiplier}
                                            min="1"
                                            max="10"
                                            step="0.5"
                                            class="w-14 rounded-full border-gray-200 bg-white px-2 py-1 text-center text-sm font-bold text-orange-600 shadow-sm focus:border-orange-300 focus:ring-2 focus:ring-orange-200 focus:outline-none"
                                        />
                                        <label
                                            for="semicolon"
                                            class="text-xs font-medium text-gray-600"
                                            >; : Colon</label
                                        >
                                    </div>

                                    <div class="flex items-center space-x-1">
                                        <input
                                            id="exclamation"
                                            type="number"
                                            bind:value={exclamationMultiplier}
                                            min="1"
                                            max="10"
                                            step="0.5"
                                            class="w-14 rounded-full border-gray-200 bg-white px-2 py-1 text-center text-sm font-bold text-red-600 shadow-sm focus:border-red-300 focus:ring-2 focus:ring-red-200 focus:outline-none"
                                        />
                                        <label
                                            for="exclamation"
                                            class="text-xs font-medium text-gray-600"
                                            >! ? Exclaim</label
                                        >
                                    </div>
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Table of Contents below the reader -->
                {#if epubData && epubData.tableOfContents.length > 1}
                    <div class="mt-8 w-full max-w-2xl sm:mt-12">
                        <button
                            onclick={() => (showTableOfContents = !showTableOfContents)}
                            class="mb-3 flex w-full items-center gap-2 text-base font-bold text-gray-800 transition-colors hover:text-indigo-700 sm:mb-4 sm:text-lg"
                        >
                            <Icon name="menu" size={18} className="text-indigo-500 sm:w-5 sm:h-5" />
                            <span>Table of Contents</span>
                            <Icon
                                name={showTableOfContents ? 'chevron-up' : 'chevron-down'}
                                size={16}
                                className="ml-auto text-gray-400"
                            />
                        </button>

                        {#if showTableOfContents}
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
                        {/if}
                    </div>
                {/if}

                <!-- Back to Library Button -->
                <div class="mt-6 w-full max-w-2xl sm:mt-8">
                    <button
                        onclick={backToLibrary}
                        class="flex w-full items-center justify-center space-x-2 rounded-xl bg-gray-100 px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-200 sm:px-4 sm:py-3 sm:text-base"
                    >
                        <Icon name="arrow-left" size={14} className="sm:w-4 sm:h-4" />
                        <span>Back to Library</span>
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
