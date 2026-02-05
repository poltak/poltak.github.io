<script lang="ts">
    import { parseEpub, type EpubData, type TableOfContents } from 'poltak-epub-parser'
    import { epubStorage, type StoredBook, type ReadingProgress } from '$lib/storage/epub-storage'
    import Icon from '$lib/components/icons/Icon.svelte'
    import { getPunctuationMultiplier } from '$lib/punctuation-utils'
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

    // Rewind functionality
    let isRewinding = $state(false)
    let rewindInterval = $state<number | null>(null)
    // Track whether reading should resume after rewinding
    let resumeAfterRewind = false

    // Hold to pause functionality
    let wasPlayingBeforeHold = $state(false)

    // Reset confirmation
    let showResetConfirmation = $state(false)

    // Number of surrounding words to show on each side
    let surroundingWordsCount = $state(5)

    // Punctuation pause multipliers
    let periodMultiplier = $state(3)
    let commaMultiplier = $state(2)
    let semicolonMultiplier = $state(2.5)
    let exclamationMultiplier = $state(3)

    // Extra settings panel visibility
    let showExtraSettings = $state(false)

    // Table of contents visibility
    let showTableOfContents = $state(false)

    // Fullscreen functionality
    let isFullscreen = $state(false)
    let wordContainer = $state<HTMLDivElement | null>(null)

    // Track current chapter to detect transitions
    let currentChapterIndex = $state(0)

    // Chapter progress calculations
    const currentChapter = $derived.by(() => {
        if (!epubData || !epubData.tableOfContents.length) return null
        return epubData.tableOfContents[currentChapterIndex] || null
    })

    const chapterProgress = $derived.by(() => {
        if (!currentChapter || !epubData)
            return { percentage: 0, wordsRemaining: 0, timeRemaining: 0 }

        const nextChapter = epubData.tableOfContents[currentChapterIndex + 1]
        const chapterEndIndex = nextChapter ? nextChapter.wordStartIndex : allWords.length
        const chapterTotalWords = chapterEndIndex - currentChapter.wordStartIndex
        const wordsReadInChapter = Math.max(0, currentWordIndex - currentChapter.wordStartIndex)
        const wordsRemaining = Math.max(0, chapterTotalWords - wordsReadInChapter)
        const percentage =
            chapterTotalWords > 0 ? (wordsReadInChapter / chapterTotalWords) * 100 : 0
        const timeRemaining = wordsPerMinute > 0 ? Math.ceil(wordsRemaining / wordsPerMinute) : 0

        return { percentage, wordsRemaining, timeRemaining }
    })

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
            epubData = await parseEpub(file)

            // Split all text into words for speed reading
            allWords = epubData.allText.split(/\s+/).filter((word) => word.trim().length > 0)

            // Save the book to storage
            currentBookId = await epubStorage.saveBook(epubData, allWords.length)

            currentWordIndex = 0
            currentChapterIndex = 0
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
            currentChapterIndex = getChapterIndex(currentWordIndex)

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

    function scheduleNextWord() {
        if (currentWordIndex >= allWords.length - 1) {
            pauseReading()
            return
        }

        // Get the current word to check for punctuation
        const currentWordText = allWords[currentWordIndex] || ''
        const multiplier = getPunctuationMultiplier(
            currentWordText,
            periodMultiplier,
            commaMultiplier,
            semicolonMultiplier,
            exclamationMultiplier,
        )

        // Calculate interval in milliseconds with punctuation pause
        const baseIntervalMs = Math.max(60000 / wordsPerMinute, 50) // Minimum 50ms interval
        const actualIntervalMs = baseIntervalMs * multiplier

        readingInterval = setTimeout(() => {
            if (!isPlaying) return // Safety check in case reading was paused

            currentWordIndex++

            // Detect chapter change & pause if a new chapter is reached
            const newChap = getChapterIndex(currentWordIndex)
            if (newChap !== currentChapterIndex) {
                currentChapterIndex = newChap
                pauseReading()
                return // don't schedule next word until user resumes
            }

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

    function startRewind() {
        if (allWords.length === 0 || currentWordIndex <= 0) return

        // If currently playing, pause and remember to resume later
        resumeAfterRewind = isPlaying
        if (isPlaying) {
            pauseReading()
        }

        isRewinding = true

        // Use faster speed for rewinding
        const rewindSpeed = Math.min(wordsPerMinute * 2, 800) // 2x speed, max 800 WPM
        const intervalMs = Math.max(60000 / rewindSpeed, 25) // Minimum 25ms interval

        clearInterval(rewindInterval!)
        rewindInterval = setInterval(() => {
            if (currentWordIndex <= 0) {
                stopRewind()
                return
            }
            currentWordIndex--
        }, intervalMs)
    }

    function stopRewind() {
        isRewinding = false
        if (rewindInterval) {
            clearInterval(rewindInterval)
            rewindInterval = null
        }

        // Resume reading if it was playing before rewinding
        if (resumeAfterRewind) {
            startReading()
        }
        resumeAfterRewind = false
    }

    function resetReading() {
        if (showResetConfirmation) {
            // Confirmed reset
            pauseReading()
            stopRewind()
            currentWordIndex = 0
            currentChapterIndex = 0
            saveProgress() // Save the reset position
            showResetConfirmation = false
        } else {
            // Show confirmation
            showResetConfirmation = true
        }
    }

    function cancelReset() {
        showResetConfirmation = false
    }

    function navigateToChapter(wordStartIndex: number) {
        const wasPlaying = isPlaying
        if (isPlaying) {
            pauseReading()
        }

        currentWordIndex = Math.min(wordStartIndex, allWords.length - 1)
        currentChapterIndex = getChapterIndex(currentWordIndex)

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
        currentChapterIndex = 0
        showLibrary = true
    }

    // Effect for cleanup only
    $effect(() => {
        return () => {
            if (readingInterval) {
                clearTimeout(readingInterval)
                readingInterval = null
            }
            if (rewindInterval) {
                clearInterval(rewindInterval)
                rewindInterval = null
            }
            if (progressSaveInterval) {
                clearInterval(progressSaveInterval)
                progressSaveInterval = null
            }
        }
    })

    function toggleFullscreen() {
        if (!wordContainer) return

        if (!isFullscreen) {
            // Enter fullscreen
            if (wordContainer.requestFullscreen) {
                wordContainer.requestFullscreen()
            } else if ((wordContainer as any).webkitRequestFullscreen) {
                ;(wordContainer as any).webkitRequestFullscreen()
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen()
            } else if ((document as any).webkitExitFullscreen) {
                ;(document as any).webkitExitFullscreen()
            }
        }
    }

    onMount(() => {
        const handler = () => {
            isFullscreen = !!document.fullscreenElement
        }
        document.addEventListener('fullscreenchange', handler)
        return () => document.removeEventListener('fullscreenchange', handler)
    })

    function getChapterIndex(wordIndex: number): number {
        if (!epubData) return 0
        // Assumes tableOfContents is sorted by wordStartIndex / order
        for (let i = epubData.tableOfContents.length - 1; i >= 0; i--) {
            if (wordIndex >= epubData.tableOfContents[i].wordStartIndex) return i
        }
        return 0
    }

    function handleHoldStart(event: MouseEvent | TouchEvent) {
        // Don't trigger hold-to-pause if clicking on interactive elements
        const target = event.target as HTMLElement
        if (target.closest('button') || target.closest('[role="button"]')) {
            return
        }

        if (isPlaying) {
            wasPlayingBeforeHold = true
            pauseReading()
        }
    }

    function handleHoldEnd() {
        if (wasPlayingBeforeHold) {
            wasPlayingBeforeHold = false
            startReading()
        }
    }
</script>

<svelte:head>
    <title>Speed Reader</title>
    <meta name="description" content="A fast EPUB speed reader with adjustable reading speed" />
</svelte:head>

<main class="app-container">
    {#if showLibrary}
        <div class="library-view">
            <div class="library-header">
                <div class="logo-circle">
                    <Icon name="book" size={32} />
                </div>
                <h1>EPUB Speed Reader</h1>
                <p>Your personal library of speed-readable books</p>
                <p class="built-on">
                    Built on
                    <a
                        href="https://www.npmjs.com/package/poltak-epub-parser"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        poltak-epub-parser
                    </a>
                </p>
            </div>

            <div class="upload-section">
                <div class="upload-card">
                    <div class="file-input-wrapper">
                        <input
                            bind:this={fileInput}
                            type="file"
                            accept=".epub"
                            onchange={handleFileUpload}
                            class="file-input"
                        />
                        <div class="upload-placeholder">
                            <Icon name="upload-cloud" size={32} className="mb-2" />
                            <span>Add a new EPUB book to your library</span>
                        </div>
                    </div>

                    {#if isLoading}
                        <div class="status-message loading">
                            <div class="spinner"></div>
                            <span>Adding book to shelves...</span>
                        </div>
                    {/if}

                    {#if errorMessage}
                        <div class="status-message error">
                            <Icon name="alert-circle" size={20} />
                            <div class="error-content">
                                <h4>Oops!</h4>
                                <p>{errorMessage}</p>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>

            <div class="tip-card">
                <div class="tip-content">
                    <div class="tip-header-container">
                        <Icon name="info" size={14} />
                        <h4>Looking for books to try?</h4>
                    </div>
                    <p>
                        Check out <a
                            href="https://standardebooks.org/"
                            target="_blank"
                            rel="noopener noreferrer">Standard Ebooks</a
                        > for high-quality, beautifully formatted public domain EPUB files that work
                        perfectly with this speed reader.
                    </p>
                </div>
            </div>

            <div class="library-content">
                {#if isLoadingLibrary}
                    <div class="status-message loading">
                        <div class="spinner"></div>
                        <span>Dusting off the books...</span>
                    </div>
                {:else if storedBooks.length === 0}
                    <div class="empty-library">
                        <Icon name="book" size={48} className="empty-icon" />
                        <h3>It's quiet here...</h3>
                        <p>Upload a book to start reading!</p>
                    </div>
                {:else}
                    <div class="library-header-row">
                        <h2>Your Library <span>({storedBooks.length})</span></h2>
                    </div>
                    <div class="book-grid">
                        {#each storedBooks as book (book.id)}
                            {@const progress = bookProgresses.get(book.id)}
                            {@const progressPercentage =
                                progress && book.totalWords > 0
                                    ? Math.round(
                                          (progress.currentWordIndex / book.totalWords) * 100,
                                      )
                                    : 0}

                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <div
                                class="book-card"
                                role="button"
                                tabindex="0"
                                onclick={() => openStoredBook(book)}
                            >
                                <div class="book-info">
                                    <h3 class="book-title">{book.title}</h3>
                                    {#if book.author}
                                        <p class="book-author">by {book.author}</p>
                                    {/if}
                                </div>

                                <div class="book-progress">
                                    <div class="progress-labels">
                                        <span>Progress</span>
                                        <span>{progressPercentage}%</span>
                                    </div>
                                    <div class="progress-track">
                                        <div
                                            class="progress-fill"
                                            style="width: {progressPercentage}%"
                                        ></div>
                                    </div>
                                </div>

                                <div class="book-meta">
                                    <span>{(book.totalWords / 1000).toFixed(1)}k words</span>
                                    <span>{new Date(book.lastReadDate).toLocaleDateString()}</span>
                                </div>

                                {#if progressPercentage > 0}
                                    <div
                                        class="book-badge {progressPercentage >= 100
                                            ? 'completed'
                                            : 'in-progress'}"
                                    >
                                        {progressPercentage >= 100
                                            ? 'Done'
                                            : `${progressPercentage}%`}
                                    </div>
                                {/if}

                                <button
                                    onclick={(e) => {
                                        e.stopPropagation()
                                        deleteStoredBook(book.id, e)
                                    }}
                                    class="delete-btn"
                                    title="Delete book"
                                >
                                    <Icon name="trash-2" size={16} />
                                </button>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    {:else}
        <div class="reader-view">
            <!-- Word Display -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                bind:this={wordContainer}
                class="reader-stage"
                onmousedown={handleHoldStart}
                onmouseup={handleHoldEnd}
                onmouseleave={handleHoldEnd}
                ontouchstart={handleHoldStart}
                ontouchend={handleHoldEnd}
                ontouchcancel={handleHoldEnd}
            >
                <div class="word-display">
                    <div class="context-words before">
                        {#each surroundingWords.before as word}
                            <span>{word}</span>
                        {/each}
                    </div>

                    <div class="current-word-container">
                        <span class="current-word">{surroundingWords.current}</span>
                    </div>

                    <div class="context-words after">
                        {#each surroundingWords.after as word}
                            <span>{word}</span>
                        {/each}
                    </div>
                </div>

                <!-- Chapter Progress -->
                {#if currentChapter && epubData && epubData.tableOfContents.length > 1}
                    <div class="chapter-progress-bar">
                        <div
                            class="chapter-fill"
                            style="width: {chapterProgress.percentage}%"
                        ></div>
                    </div>
                    {#if chapterProgress.timeRemaining > 0}
                        <div class="chapter-time">
                            {chapterProgress.timeRemaining}m left in chapter
                        </div>
                    {/if}
                {/if}

                <!-- Overlay Controls (Fullscreen/Rewind when fullscreen) -->
                <div class="reader-overlay">
                    {#if isFullscreen}
                        <div class="fs-controls fs-controls-rewind">
                            <button
                                onmousedown={startRewind}
                                onmouseup={stopRewind}
                                onmouseleave={stopRewind}
                                ontouchstart={startRewind}
                                ontouchend={stopRewind}
                                class="fs-btn rewind"
                                disabled={allWords.length === 0 || currentWordIndex <= 0}
                                class:active={isRewinding}
                            >
                                <Icon name="rewind" size={24} />
                            </button>
                        </div>

                        <div class="fs-controls fs-controls-play-pause">
                            <button
                                onclick={togglePlayPause}
                                class="fs-btn play"
                                disabled={allWords.length === 0}
                            >
                                <Icon name={isPlaying ? 'pause' : 'play'} size={32} />
                            </button>
                        </div>
                    {/if}

                    <button class="fs-toggle" onclick={toggleFullscreen} title="Toggle Fullscreen">
                        <Icon name={isFullscreen ? 'minimize' : 'maximize'} size={20} />
                    </button>
                </div>
            </div>

            <!-- Reader Controls & Stats -->
            <div class="reader-controls-container">
                <div class="progress-stats">
                    <div class="stat">
                        <span>Word {(currentWordIndex + 1).toLocaleString()}</span>
                    </div>
                    <div class="stat main-stat">
                        {progressPercentage.toFixed(1)}%
                    </div>
                    <div class="stat">
                        <span>{allWords.length.toLocaleString()} total</span>
                    </div>
                </div>
                <div class="main-progress-track">
                    <div class="main-progress-fill" style="width: {progressPercentage}%"></div>
                </div>

                <div class="primary-controls">
                    <button
                        onmousedown={startRewind}
                        onmouseup={stopRewind}
                        onmouseleave={stopRewind}
                        ontouchstart={startRewind}
                        ontouchend={stopRewind}
                        class="control-btn rewind"
                        disabled={allWords.length === 0 || currentWordIndex <= 0}
                        class:active={isRewinding}
                    >
                        <Icon name="rewind" size={24} />
                    </button>

                    <button
                        onclick={togglePlayPause}
                        class="control-btn play-pause"
                        disabled={allWords.length === 0}
                    >
                        <Icon name={isPlaying ? 'pause' : 'play'} size={32} />
                    </button>
                </div>

                <div class="settings-row">
                    <div class="setting-group">
                        <input
                            id="context"
                            type="number"
                            bind:value={surroundingWordsCount}
                            min="0"
                            max="100"
                            step="1"
                        />
                        <label for="context">Context</label>
                    </div>
                    <div class="setting-group">
                        <input
                            id="wpm"
                            type="number"
                            bind:value={wordsPerMinute}
                            oninput={handleWpmChange}
                            min="50"
                            max="1000"
                            step="10"
                        />
                        <label for="wpm">WPM</label>
                    </div>
                </div>

                <div class="presets-row">
                    {#each [200, 300, 400, 500, 600] as preset}
                        <button
                            onclick={() => {
                                wordsPerMinute = preset
                                handleWpmChange()
                            }}
                            class="preset-btn {wordsPerMinute === preset ? 'active' : ''}"
                        >
                            {preset}
                        </button>
                    {/each}
                </div>

                <div class="extra-settings-section">
                    <button
                        onclick={() => (showExtraSettings = !showExtraSettings)}
                        class="toggle-extras"
                    >
                        <span>Extra Settings</span>
                        <Icon name={showExtraSettings ? 'chevron-up' : 'chevron-down'} size={16} />
                    </button>

                    {#if showExtraSettings}
                        <div class="extras-panel">
                            <h4>Punctuation Pause Multipliers</h4>
                            <div class="multipliers-grid">
                                <div class="mult-group">
                                    <input
                                        id="mult-period"
                                        type="number"
                                        bind:value={periodMultiplier}
                                        min="1"
                                        max="10"
                                        step="0.5"
                                    />
                                    <label for="mult-period">. Period</label>
                                </div>
                                <div class="mult-group">
                                    <input
                                        id="mult-comma"
                                        type="number"
                                        bind:value={commaMultiplier}
                                        min="1"
                                        max="10"
                                        step="0.5"
                                    />
                                    <label for="mult-comma">, Comma</label>
                                </div>
                                <div class="mult-group">
                                    <input
                                        id="mult-semi"
                                        type="number"
                                        bind:value={semicolonMultiplier}
                                        min="1"
                                        max="10"
                                        step="0.5"
                                    />
                                    <label for="mult-semi">; Colon</label>
                                </div>
                                <div class="mult-group">
                                    <input
                                        id="mult-exclaim"
                                        type="number"
                                        bind:value={exclamationMultiplier}
                                        min="1"
                                        max="10"
                                        step="0.5"
                                    />
                                    <label for="mult-exclaim">! Exclaim</label>
                                </div>
                            </div>
                            <div class="extras-actions">
                                <button onclick={resetReading} class="reset-btn">
                                    <Icon name="refresh" size={16} />
                                    <span>Reset to Beginning</span>
                                </button>
                            </div>
                        </div>
                    {/if}
                </div>

                {#if epubData && epubData.tableOfContents.length > 1}
                    <div class="toc-section">
                        <button
                            onclick={() => (showTableOfContents = !showTableOfContents)}
                            class="toc-toggle"
                        >
                            <Icon name="menu" size={18} />
                            <span>Table of Contents</span>
                            <Icon
                                name={showTableOfContents ? 'chevron-up' : 'chevron-down'}
                                size={16}
                                className="arrow"
                            />
                        </button>

                        {#if showTableOfContents}
                            <div class="toc-list">
                                {#each epubData.tableOfContents as item, idx (item.order)}
                                    {@const nextStart =
                                        epubData.tableOfContents[idx + 1]?.wordStartIndex ??
                                        allWords.length}
                                    {@const wordCount = nextStart - item.wordStartIndex}
                                    {@const estMinutes = Math.max(
                                        1,
                                        Math.round(wordCount / wordsPerMinute),
                                    )}
                                    {@const isActive = isChapterActive(item)}

                                    <button
                                        onclick={() => navigateToChapter(item.wordStartIndex)}
                                        class="toc-item {isActive ? 'active' : ''}"
                                    >
                                        <span class="chapter-num">{item.order + 1}</span>
                                        <div class="chapter-info">
                                            <span class="chapter-title"
                                                >{item.title || `Chapter ${item.order + 1}`}</span
                                            >
                                            <span class="chapter-meta"
                                                >{wordCount.toLocaleString()} words · {estMinutes} min</span
                                            >
                                        </div>
                                        <Icon name="chevron-right" size={16} className="arrow" />
                                    </button>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/if}

                <button onclick={backToLibrary} class="back-link">
                    <Icon name="arrow-left" size={14} />
                    <span>Back to Library</span>
                </button>
            </div>
        </div>
    {/if}

    {#if showResetConfirmation}
        <div class="modal-overlay">
            <div class="modal-card">
                <div class="modal-header">
                    <div class="icon-danger"><Icon name="alert-triangle" size={20} /></div>
                    <h3>Reset Progress?</h3>
                </div>
                <p>This will return you to the start of the book.</p>
                <div class="modal-actions">
                    <button onclick={cancelReset} class="btn-secondary">Cancel</button>
                    <button onclick={resetReading} class="btn-danger">Reset</button>
                </div>
            </div>
        </div>
    {/if}
</main>

<style>
    /* Reset & Base */
    .app-container {
        font-family: var(--font-sans);
        color: var(--c-text);
        min-height: 100vh;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 2rem 1rem;
        box-sizing: border-box;
    }

    button {
        cursor: pointer;
        border: none;
        background: none;
        font-family: inherit;
    }

    input {
        font-family: inherit;
        color: var(--c-text);
    }

    h1,
    h2,
    h3,
    h4 {
        font-family: var(--font-serif);
        margin: 0;
        color: var(--c-text);
    }

    /* Library View */
    .library-view {
        width: 100%;
    }

    .library-header {
        text-align: center;
        margin-bottom: 3rem;
    }

    .logo-circle {
        width: 4rem;
        height: 4rem;
        background-color: var(--c-primary);
        color: white;
        border-radius: var(--radius-full);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1rem;
        box-shadow: var(--shadow-md);
    }

    .library-header h1 {
        font-size: 2rem;
        color: var(--c-text);
        margin-bottom: 0.5rem;
    }

    .library-header p {
        color: var(--c-text-light);
        font-size: 1.125rem;
    }

    .built-on {
        margin-top: 0.75rem;
        font-size: 0.95rem;
        color: var(--c-text-light);
    }

    .built-on a {
        color: var(--c-primary);
        text-decoration: none;
        border-bottom: 1px dashed var(--c-border);
        transition:
            color 0.2s,
            border-color 0.2s;
    }

    .built-on a:hover {
        color: var(--c-primary-dark);
        border-color: var(--c-primary);
    }

    .upload-card {
        background: var(--c-surface);
        border-radius: var(--radius-lg);
        padding: 2rem;
        box-shadow: var(--shadow-lg);
        margin-bottom: 2rem;
        border: 1px solid var(--c-border-light);
    }

    .file-input-wrapper {
        position: relative;
        border: 2px dashed var(--c-border-dashed);
        border-radius: var(--radius-md);
        transition: all 0.2s;
        height: 150px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--c-bg-subtle);
    }

    .file-input-wrapper:hover {
        border-color: var(--c-primary);
        background: var(--c-primary-hover-bg);
    }

    .file-input {
        position: absolute;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
        z-index: 10;
    }

    .upload-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        color: var(--c-text-light);
        pointer-events: none;
        text-align: center;
    }

    .status-message {
        margin-top: 1rem;
        padding: 1rem;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .status-message.loading {
        background: var(--c-primary-light);
        color: var(--c-primary-dark);
    }

    .status-message.error {
        background: var(--c-danger-bg);
        color: var(--c-danger);
        border: 1px solid var(--c-danger-border);
    }

    .spinner {
        width: 1.25rem;
        height: 1.25rem;
        border: 2px solid currentColor;
        border-right-color: transparent;
        border-radius: 50%;
        animation: spin 0.75s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .tip-card {
        background: var(--c-info-bg);
        border: 1px solid var(--c-info-border);
        border-radius: var(--radius-md);
        padding: 1rem;
        display: flex;
        gap: 1rem;
        margin-bottom: 3rem;
        color: var(--c-info-text);
    }

    .tip-card a {
        color: var(--c-info-link);
        font-weight: 600;
        text-decoration: underline;
    }

    .tip-header-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 1rem;
    }

    /* Book Grid */
    .library-header-row {
        margin-bottom: 1.5rem;
    }

    .book-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1.5rem;
    }

    .book-card {
        cursor: pointer;
        background: var(--c-surface);
        padding: 1.5rem;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--c-border-light);
        position: relative;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .book-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
        border-color: var(--c-primary-light);
    }

    .book-title {
        font-size: 1.1rem;
        line-height: 1.4;
        margin-bottom: 0.25rem;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        line-clamp: 2;
        overflow: hidden;
        color: var(--c-text);
    }

    .book-author {
        font-family: var(--font-sans);
        font-size: 0.875rem;
        color: var(--c-text-light);
    }

    .progress-labels {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        margin-bottom: 0.25rem;
        color: var(--c-text-light);
        font-weight: 500;
    }

    .progress-track {
        height: 0.5rem;
        background: var(--c-progress-track);
        border-radius: var(--radius-full);
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--c-primary), var(--c-primary-gradient-to));
        transition: width 0.3s ease;
    }

    .book-meta {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        color: var(--c-text-muted);
        margin-top: auto;
    }

    .book-badge {
        position: absolute;
        top: -0.5rem;
        left: 1rem;
        padding: 0.25rem 0.75rem;
        border-radius: var(--radius-full);
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        box-shadow: var(--shadow-sm);
    }

    .book-badge.completed {
        background: var(--c-success);
        color: white;
    }

    .book-badge.in-progress {
        background: var(--c-primary);
        color: white;
    }

    .delete-btn {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        color: var(--c-text-muted);
        padding: 0.25rem;
        border-radius: var(--radius-full);
        opacity: 0;
        transition: all 0.2s;
    }

    .book-card:hover .delete-btn {
        opacity: 1;
    }

    .delete-btn:hover {
        background: var(--c-danger-bg);
        color: var(--c-danger);
    }

    .empty-library {
        text-align: center;
        padding: 4rem 0;
        color: var(--c-text-light);
    }

    /* Reader View */
    .reader-view {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .reader-stage {
        position: relative;
        background: var(--c-surface);
        border-radius: var(--radius-lg);
        box-shadow:
            var(--shadow-lg),
            inset 0 0 0 1px var(--c-border-light);
        height: 660px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        overflow: hidden;

        @media screen and (orientation: landscape) {
            height: 300px;
        }

        @media screen and (display-mode: fullscreen) {
            border-radius: 0;
        }
    }

    .word-display {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        width: 100%;
        text-align: center;
    }

    .context-words {
        color: var(--c-context-text);
        font-family: var(--font-mono);
        font-size: 1.5rem;
        height: 12rem;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
        gap: 1rem;
        opacity: 0.6;
    }

    .current-word-container {
        margin: 2rem 0;
        min-height: 5rem;
        display: flex;
        align-items: center;
    }

    .current-word {
        font-family: var(--font-mono);
        font-size: 4rem;
        font-weight: 700;
        color: var(--c-text);
        line-height: 1;
    }

    /* Chapter Progress inside Reader */
    .chapter-progress-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 4px;
        background: var(--c-border-light);
    }

    .chapter-fill {
        height: 100%;
        background: var(--c-accent);
        transition: width 0.2s linear;
    }

    .chapter-time {
        position: absolute;
        bottom: 0.75rem;
        left: 0.75rem;
        font-size: 0.75rem;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        pointer-events: none;
    }

    .reader-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
    }

    .fs-toggle {
        pointer-events: auto;
        position: absolute;
        bottom: 0.75rem;
        right: 0.75rem;
        width: 2.5rem;
        height: 2.5rem;
        background: var(--c-bg-input);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: var(--shadow-sm);
        color: var(--c-text);
        transition: background 0.2s;
        border: 1px solid var(--c-border-light);
    }

    .fs-toggle:hover {
        background: var(--c-bg-subtle);
        transform: scale(1.1);
    }

    .fs-controls-rewind {
        left: 0.75rem;
    }

    .fs-controls-play-pause {
        right: 0.75rem;
    }

    .fs-controls {
        position: absolute;
        right: 0.75rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
        height: 100%;
        pointer-events: auto;
    }

    .fs-btn {
        background: var(--c-surface);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--c-text);
        box-shadow: var(--shadow-lg);
        transition: transform 0.1s;
        border: 1px solid var(--c-border-light);
    }

    .fs-btn.play {
        width: 4rem;
        height: 4rem;
        color: var(--c-primary);
    }

    .fs-btn.rewind {
        width: 3rem;
        height: 3rem;
        color: var(--c-accent);
    }

    .fs-btn:hover {
        transform: scale(1.1);
        background: var(--c-bg-subtle);
    }

    /* Control Panel */
    .reader-controls-container {
        background: var(--c-surface);
        padding: 2rem;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
    }

    .progress-stats {
        display: flex;
        justify-content: space-between;
        font-size: 0.875rem;
        color: var(--c-text-light);
        margin-bottom: 0.5rem;
    }

    .main-stat {
        color: var(--c-primary);
        font-weight: 700;
        font-size: 1.1rem;
    }

    .main-progress-track {
        height: 0.75rem;
        background: var(--c-progress-track);
        border-radius: var(--radius-full);
        margin-bottom: 2rem;
        overflow: hidden;
    }

    .main-progress-fill {
        height: 100%;
        background: var(--c-primary);
        transition: width 0.3s ease;
    }

    .primary-controls {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 2rem;
        margin-bottom: 2rem;
    }

    .control-btn {
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        box-shadow: var(--shadow-md);
    }

    .control-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        box-shadow: none;
    }

    .control-btn:active:not(:disabled) {
        transform: scale(0.95);
    }

    .control-btn.rewind {
        width: 3.5rem;
        height: 3.5rem;
        background: var(--c-accent-light);
        color: var(--c-accent);
        border: 2px solid var(--c-accent-border);
    }

    .control-btn.rewind:hover:not(:disabled) {
        background: var(--c-accent);
        color: white;
        border-color: var(--c-accent);
    }

    .control-btn.play-pause {
        width: 5rem;
        height: 5rem;
        background: var(--c-primary);
        color: white;
        box-shadow: 0 10px 25px -5px var(--c-shadow-primary);
    }

    .control-btn.play-pause:hover:not(:disabled) {
        transform: scale(1.05);
        background: var(--c-primary-dark);
    }

    .settings-row {
        display: flex;
        justify-content: center;
        gap: 1.5rem;
        margin-bottom: 1.5rem;

        @media screen and (max-width: 576px) {
            flex-direction: column;
            margin: 2rem auto;
            width: 10rem;
        }
    }

    .setting-group {
        display: flex;
        align-items: center;
        background: var(--c-bg-subtle);
        padding: 0.25rem 0.75rem;
        border-radius: var(--radius-full);
        border: 1px solid var(--c-border);
    }

    .setting-group input {
        width: 4rem;
        border: none;
        background: transparent;
        font-weight: 700;
        color: var(--c-text);
        text-align: center;
        font-size: 1rem;
    }

    .setting-group input:focus {
        outline: none;
    }

    .setting-group label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--c-text-light);
        margin-left: 0.25rem;
        text-transform: uppercase;
    }

    .presets-row {
        display: flex;
        justify-content: center;
        gap: 1rem;
        flex-wrap: wrap;
        margin-bottom: 2rem;
    }

    .preset-btn {
        padding: 0.4rem 1rem;
        border-radius: var(--radius-full);
        font-size: 0.875rem;
        font-weight: 600;
        background: var(--c-surface);
        border: 1px solid var(--c-border);
        color: var(--c-text-light);
        transition: all 0.2s;
    }

    .preset-btn:hover {
        border-color: var(--c-primary);
        color: var(--c-primary);
    }

    .preset-btn.active {
        background: var(--c-primary);
        color: white;
        border-color: var(--c-primary);
    }

    /* Extras */
    .extra-settings-section {
        border-top: 1px solid var(--c-border);
        padding-top: 1.5rem;
        margin-bottom: 1.5rem;
    }

    .toggle-extras {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        width: 100%;
        color: var(--c-text-light);
        font-weight: 500;
        font-size: 0.9rem;
    }

    .extras-panel {
        margin-top: 1.5rem;
        background: var(--c-bg-subtle);
        border-radius: var(--radius-md);
        padding: 1.5rem;
    }

    .extras-panel h4 {
        text-align: center;
        font-size: 0.9rem;
        color: var(--c-text);
        margin-bottom: 1rem;
    }

    .multipliers-grid {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .mult-group {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .mult-group input {
        width: 3.5rem;
        text-align: center;
        padding: 0.25rem;
        border-radius: 0.25rem;
        border: 1px solid var(--c-border);
        margin-bottom: 0.25rem;
        background: var(--c-bg-input);
        color: var(--c-text);
    }

    .mult-group label {
        font-size: 0.7rem;
        color: var(--c-text-light);
    }

    .extras-actions {
        margin-top: 1.5rem;
        display: flex;
        justify-content: center;
    }

    .reset-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--c-danger);
        font-size: 0.9rem;
        padding: 0.5rem 1rem;
        border-radius: var(--radius-md);
    }

    .reset-btn:hover {
        background: var(--c-danger-bg);
    }

    /* TOC */
    .toc-section {
        border-top: 1px solid var(--c-border);
        padding-top: 1.5rem;
    }

    .toc-toggle {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        font-weight: 700;
        color: var(--c-text);
        font-size: 1.1rem;
        margin-bottom: 1rem;
    }

    .toc-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-height: 400px;
        overflow-y: auto;
        padding-right: 0.5rem;
    }

    .toc-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem;
        border-radius: var(--radius-md);
        text-align: left;
        transition: background 0.2s;
    }

    .toc-item:hover {
        background: var(--c-bg-subtle);
    }

    .toc-item.active {
        background: var(--c-primary-light);
    }

    .chapter-num {
        width: 1.75rem;
        height: 1.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--c-border);
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--c-text-light);
    }

    .toc-item.active .chapter-num {
        background: white;
        color: var(--c-primary);
    }

    .chapter-info {
        flex: 1;
        min-width: 0;
    }

    .chapter-title {
        display: block;
        font-weight: 500;
        font-size: 0.95rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--c-text);
    }

    .toc-item.active .chapter-title {
        color: var(--c-primary);
    }

    .chapter-meta {
        font-size: 0.75rem;
        color: var(--c-text-light);
    }

    .toc-item :global(.arrow) {
        color: var(--c-text-muted);
    }

    .back-link {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        width: 100%;
        padding: 1rem;
        margin-top: 2rem;
        color: var(--c-text-light);
        background: var(--c-bg-subtle);
        border-radius: var(--radius-md);
        font-weight: 500;
        transition: all 0.2s;
    }

    .back-link:hover {
        background: var(--c-border);
        color: var(--c-text);
    }

    /* Modal */
    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        padding: 1rem;
        backdrop-filter: blur(2px);
    }

    .modal-card {
        background: var(--c-surface);
        padding: 2rem;
        border-radius: var(--radius-lg);
        width: 100%;
        max-width: 24rem;
        box-shadow: var(--shadow-lg);
    }

    .modal-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .icon-danger {
        color: var(--c-danger);
        background: var(--c-danger-bg);
        padding: 0.5rem;
        border-radius: 50%;
    }

    .modal-actions {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
    }

    .btn-secondary,
    .btn-danger {
        flex: 1;
        padding: 0.75rem;
        border-radius: var(--radius-md);
        font-weight: 600;
    }

    .btn-secondary {
        background: var(--c-surface);
        border: 1px solid var(--c-border);
        color: var(--c-text);
    }

    .btn-danger {
        background: var(--c-danger);
        color: white;
    }
</style>
