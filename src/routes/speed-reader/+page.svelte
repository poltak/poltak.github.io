<script lang="ts">
    import { parseEpub, type EpubData, type TableOfContents } from 'poltak-epub-parser'
    import { epubStorage, type StoredBook, type ReadingProgress } from '$lib/storage/epub-storage'
    import Icon from '$lib/components/icons/Icon.svelte'
    import { SpeedReaderEngine } from '$lib/speed-reader-engine'
    import ImmersiveReader from '$lib/components/speed-reader/ImmersiveReader.svelte'
    import { calculateProgressPercentage } from '$lib/speed-reader/progress'
    import {
        createBrowserSpeechProvider,
        SpeechController,
        type SpeechControllerState,
        type SpeechVoice,
    } from '$lib/speed-reader/speech'
    import { onMount, tick } from 'svelte'

    type ReaderMode = 'speed' | 'immersive'

    let fileInput = $state<HTMLInputElement>()
    let epubData = $state<EpubData | null>(null)
    let currentBookId = $state<string | null>(null)
    let isLoading = $state(false)
    let errorMessage = $state('')
    let isPlaying = $state(false)
    let wordsPerMinute = $state(250)
    let currentWordIndex = $state(0)
    let allWords = $state<string[]>([])
    let storedBooks = $state<StoredBook[]>([])
    let showLibrary = $state(true)
    let isLoadingLibrary = $state(false)
    let bookProgresses = $state<Map<string, ReadingProgress>>(new Map())

    // Rewind functionality
    let isRewinding = $state(false)
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

    // Normal reading and browser speech controls
    let readerMode = $state<ReaderMode>('speed')
    let selectedVoiceName = $state('')
    let speechRate = $state(1)
    let speechVoices = $state<SpeechVoice[]>([])
    let resetCancelButton = $state<HTMLButtonElement>()

    const speechProvider = createBrowserSpeechProvider()
    let speechState = $state<SpeechControllerState>({
        status: speechProvider.supported ? 'idle' : 'unsupported',
        chapterIndex: 0,
        voiceName: '',
        rate: 1,
        errorMessage: speechProvider.supported
            ? null
            : 'Text to speech is not supported in this browser.',
    })

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
        const percentage = calculateProgressPercentage(wordsReadInChapter, chapterTotalWords)
        const wordsRemaining =
            percentage >= 100 ? 0 : Math.max(0, chapterTotalWords - wordsReadInChapter)
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
        calculateProgressPercentage(currentWordIndex, allWords.length),
    )

    const immersiveChapter = $derived(epubData?.chapters[currentChapterIndex] ?? null)

    const isChapterActive = $derived((item: TableOfContents): boolean => {
        if (!epubData) return false
        const nextChapter = epubData.tableOfContents[item.order + 1]
        return (
            currentWordIndex >= item.wordStartIndex &&
            (nextChapter ? currentWordIndex < nextChapter.wordStartIndex : true)
        )
    })

    // Auto-save progress every 10 seconds while reading
    let progressSaveInterval: ReturnType<typeof setInterval> | null = null

    const engine = new SpeedReaderEngine({
        onUpdate: (state) => {
            allWords = state.allWords
            currentWordIndex = state.currentWordIndex
            currentChapterIndex = state.currentChapterIndex
            isPlaying = state.isPlaying
            isRewinding = state.isRewinding
            wordsPerMinute = state.wordsPerMinute
            periodMultiplier = state.periodMultiplier
            commaMultiplier = state.commaMultiplier
            semicolonMultiplier = state.semicolonMultiplier
            exclamationMultiplier = state.exclamationMultiplier
        },
    })

    const speechController = new SpeechController(speechProvider, {
        onStateChange: (state) => {
            speechState = state
        },
        onChapterChange: (chapterIndex) => {
            navigateToChapterIndex(chapterIndex, false)
        },
        onComplete: () => {
            if (allWords.length > 0) {
                engine.navigateToWord(allWords.length - 1)
                void saveProgress()
            }
        },
    })

    onMount(async () => {
        try {
            await epubStorage.init()
            await loadLibrary()
        } catch (error) {
            console.error('Failed to initialize storage:', error)
        }
    })

    function refreshSpeechVoices() {
        speechVoices = speechController.getVoices()
        if (selectedVoiceName && speechVoices.some((voice) => voice.name === selectedVoiceName)) {
            return
        }

        selectedVoiceName = speechVoices.find((voice) => voice.default)?.name ?? ''
        speechController.setVoice(selectedVoiceName)
    }

    onMount(() => {
        refreshSpeechVoices()
        if (!speechProvider.supported) return

        const handler = () => refreshSpeechVoices()
        window.speechSynthesis.addEventListener('voiceschanged', handler)
        return () => window.speechSynthesis.removeEventListener('voiceschanged', handler)
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
            if (fileInput) fileInput.value = ''
            return
        }

        isLoading = true
        errorMessage = ''

        try {
            epubData = await parseEpub(file)

            engine.loadBook(epubData.allText, epubData.tableOfContents)
            speechController.setBook(epubData.chapters)

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
            engine.loadBook(epubData.allText, epubData.tableOfContents)
            speechController.setBook(epubData.chapters)

            // Load saved progress
            const progress = await epubStorage.getProgress(book.id)
            if (progress) {
                currentWordIndex = progress.currentWordIndex
                wordsPerMinute = progress.wordsPerMinute
                engine.setWordsPerMinute(progress.wordsPerMinute)
                engine.navigateToWord(progress.currentWordIndex)
                speechController.selectChapter(engine.getState().currentChapterIndex)
            } else {
                currentWordIndex = 0
                speechController.selectChapter(0)
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
            progressPercentage: calculateProgressPercentage(currentWordIndex, allWords.length),
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
        if (speechState.status === 'playing' || speechState.status === 'paused') {
            speechController.stop()
        }
        engine.start()

        if (!engine.getState().isPlaying) return

        // Start auto-save interval
        if (progressSaveInterval) {
            clearInterval(progressSaveInterval)
        }
        progressSaveInterval = setInterval(saveProgress, 10000) // Save every 10 seconds
    }

    function pauseReading() {
        engine.pause()

        // Stop auto-save interval and save current progress
        if (progressSaveInterval) {
            clearInterval(progressSaveInterval)
            progressSaveInterval = null
        }
        void saveProgress()
    }

    function updateReadingSpeed() {
        engine.setWordsPerMinute(wordsPerMinute)
        wordsPerMinute = engine.getState().wordsPerMinute
    }

    function startRewind() {
        if (allWords.length === 0 || currentWordIndex <= 0) return

        resumeAfterRewind = isPlaying
        if (isPlaying) {
            pauseReading()
        }

        engine.startRewind()
    }

    function stopRewind() {
        engine.stopRewind()

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
            speechController.stop()
            engine.reset()
            speechController.selectChapter(0)
            void saveProgress() // Save the reset position
            showResetConfirmation = false
        } else {
            // Show confirmation
            showResetConfirmation = true
        }
    }

    function cancelReset() {
        showResetConfirmation = false
    }

    function handleWpmChange() {
        updateReadingSpeed()
    }

    function handleMultiplierChange() {
        engine.setPunctuationMultipliers({
            periodMultiplier,
            commaMultiplier,
            semicolonMultiplier,
            exclamationMultiplier,
        })
        const state = engine.getState()
        periodMultiplier = state.periodMultiplier
        commaMultiplier = state.commaMultiplier
        semicolonMultiplier = state.semicolonMultiplier
        exclamationMultiplier = state.exclamationMultiplier
    }

    function navigateToChapterIndex(chapterIndex: number, stopSpeech = true) {
        if (!epubData || epubData.tableOfContents.length === 0) return

        const item = epubData.tableOfContents[chapterIndex]
        if (!item) return

        if (stopSpeech) speechController.stop()
        engine.navigateToWord(item.wordStartIndex)
        speechController.selectChapter(chapterIndex)
    }

    function navigateToChapter(wordStartIndex: number, chapterIndex: number) {
        if (speechState.status === 'playing' || speechState.status === 'paused') {
            speechController.stop()
        }
        engine.navigateToWord(wordStartIndex)
        speechController.selectChapter(chapterIndex)
    }

    function previousChapter() {
        navigateToChapterIndex(currentChapterIndex - 1)
    }

    function nextChapter() {
        navigateToChapterIndex(currentChapterIndex + 1)
    }

    function startSpeech() {
        if (!epubData) return
        if (isPlaying) pauseReading()
        speechController.play(currentChapterIndex)
    }

    function pauseSpeech() {
        speechController.pause()
    }

    function resumeSpeech() {
        speechController.resume()
    }

    function stopSpeech() {
        speechController.stop()
    }

    function setReaderMode(mode: ReaderMode) {
        if (mode === 'immersive' && isPlaying) pauseReading()
        readerMode = mode
    }

    function handleSpeechVoiceChange() {
        speechController.setVoice(selectedVoiceName)
    }

    function handleSpeechRateChange() {
        speechController.setRate(speechRate)
        speechRate = speechController.getState().rate
    }

    function backToLibrary() {
        speechController.setBook([])
        pauseReading()
        stopRewind()
        resumeAfterRewind = false
        showResetConfirmation = false
        epubData = null
        currentBookId = null
        engine.loadBook('', [])
        readerMode = 'speed'
        showLibrary = true
    }

    // Effect for cleanup only
    $effect(() => {
        if (showResetConfirmation) {
            void tick().then(() => resetCancelButton?.focus())
        }

        return () => {
            engine.cleanup()
            speechController.cleanup()
            if (progressSaveInterval) {
                clearInterval(progressSaveInterval)
                progressSaveInterval = null
            }
        }
    })

    async function toggleFullscreen() {
        if (!wordContainer) return

        try {
            if (!isFullscreen) {
                if (wordContainer.requestFullscreen) {
                    await wordContainer.requestFullscreen()
                } else if ((wordContainer as any).webkitRequestFullscreen) {
                    await (wordContainer as any).webkitRequestFullscreen()
                }
            } else if (document.exitFullscreen) {
                await document.exitFullscreen()
            } else if ((document as any).webkitExitFullscreen) {
                await (document as any).webkitExitFullscreen()
            }
        } catch (error) {
            console.error('Unable to change fullscreen state:', error)
        }
    }

    onMount(() => {
        const handler = () => {
            isFullscreen = !!(
                document.fullscreenElement || (document as any).webkitFullscreenElement
            )
        }
        document.addEventListener('fullscreenchange', handler)
        document.addEventListener('webkitfullscreenchange', handler)
        return () => {
            document.removeEventListener('fullscreenchange', handler)
            document.removeEventListener('webkitfullscreenchange', handler)
        }
    })

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

    function handleResetKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            event.preventDefault()
            cancelReset()
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
                    <label class="file-input-wrapper" for="epub-upload">
                        <input
                            bind:this={fileInput}
                            id="epub-upload"
                            type="file"
                            accept=".epub"
                            onchange={handleFileUpload}
                            class="file-input"
                            aria-describedby="epub-upload-help"
                        />
                        <span class="upload-placeholder" id="epub-upload-help">
                            <Icon name="upload-cloud" size={32} className="mb-2" />
                            <span>Add a new EPUB book to your library</span>
                        </span>
                    </label>

                    {#if isLoading}
                        <div class="status-message loading" role="status" aria-live="polite">
                            <div class="spinner"></div>
                            <span>Adding book to shelves...</span>
                        </div>
                    {/if}

                    {#if errorMessage}
                        <div class="status-message error" role="alert">
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
                        > for high-quality, beautifully formatted public domain EPUB files that work perfectly
                        with this speed reader.
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

                            <article class="book-card">
                                <button
                                    type="button"
                                    class="book-open"
                                    onclick={() => openStoredBook(book)}
                                    aria-label={`Open ${book.title}`}
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
                                        <div
                                            class="progress-track"
                                            role="progressbar"
                                            aria-label={`${book.title} reading progress`}
                                            aria-valuemin="0"
                                            aria-valuemax="100"
                                            aria-valuenow={progressPercentage}
                                        >
                                            <div
                                                class="progress-fill"
                                                style="width: {progressPercentage}%"
                                            ></div>
                                        </div>
                                    </div>

                                    <div class="book-meta">
                                        <span>{(book.totalWords / 1000).toFixed(1)}k words</span>
                                        <span
                                            >{new Date(
                                                book.lastReadDate,
                                            ).toLocaleDateString()}</span
                                        >
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
                                </button>

                                <button
                                    type="button"
                                    onclick={(event) => deleteStoredBook(book.id, event)}
                                    class="delete-btn"
                                    aria-label={`Delete ${book.title}`}
                                    title="Delete book"
                                >
                                    <Icon name="trash-2" size={16} />
                                </button>
                            </article>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    {:else}
        <div class="reader-view">
            <div class="mode-toggle" role="group" aria-label="Reading mode">
                <button
                    type="button"
                    class:active={readerMode === 'speed'}
                    aria-pressed={readerMode === 'speed'}
                    onclick={() => setReaderMode('speed')}
                >
                    Speed reader
                </button>
                <button
                    type="button"
                    class:active={readerMode === 'immersive'}
                    aria-pressed={readerMode === 'immersive'}
                    onclick={() => setReaderMode('immersive')}
                >
                    Immersive reader
                </button>
            </div>

            {#if readerMode === 'immersive' && immersiveChapter}
                <ImmersiveReader
                    chapter={immersiveChapter}
                    chapterIndex={currentChapterIndex}
                    chapterCount={epubData?.chapters.length ?? 0}
                    {progressPercentage}
                    totalWords={allWords.length}
                    onPrevious={previousChapter}
                    onNext={nextChapter}
                />
            {:else}
                <!-- Word Display -->
                <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                <div
                    bind:this={wordContainer}
                    class="reader-stage"
                    role="region"
                    aria-label="Speed reading display"
                    onmousedown={handleHoldStart}
                    onmouseup={handleHoldEnd}
                    onmouseleave={handleHoldEnd}
                    ontouchstart={handleHoldStart}
                    ontouchend={handleHoldEnd}
                    ontouchcancel={handleHoldEnd}
                >
                    <div class="word-display">
                        <div class="context-words before" aria-hidden="true">
                            {#each surroundingWords.before as word}
                                <span>{word}</span>
                            {/each}
                        </div>

                        <div class="current-word-container">
                            <span class="current-word" aria-live="polite" aria-atomic="true"
                                >{surroundingWords.current}</span
                            >
                        </div>

                        <div class="context-words after" aria-hidden="true">
                            {#each surroundingWords.after as word}
                                <span>{word}</span>
                            {/each}
                        </div>
                    </div>

                    <!-- Chapter Progress -->
                    {#if currentChapter && epubData && epubData.tableOfContents.length > 1}
                        <div
                            class="chapter-progress-bar"
                            role="progressbar"
                            aria-label="Chapter progress"
                            aria-valuemin="0"
                            aria-valuemax="100"
                            aria-valuenow={chapterProgress.percentage}
                        >
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
                                    type="button"
                                    onmousedown={startRewind}
                                    onmouseup={stopRewind}
                                    onmouseleave={stopRewind}
                                    ontouchstart={startRewind}
                                    ontouchend={stopRewind}
                                    class="fs-btn rewind"
                                    disabled={allWords.length === 0 || currentWordIndex <= 0}
                                    class:active={isRewinding}
                                    aria-label="Rewind speed reading"
                                    aria-pressed={isRewinding}
                                >
                                    <Icon name="rewind" size={24} />
                                </button>
                            </div>

                            <div class="fs-controls fs-controls-play-pause">
                                <button
                                    type="button"
                                    onclick={togglePlayPause}
                                    class="fs-btn play"
                                    disabled={allWords.length === 0}
                                    aria-label={isPlaying
                                        ? 'Pause speed reading'
                                        : 'Start speed reading'}
                                    aria-pressed={isPlaying}
                                >
                                    <Icon name={isPlaying ? 'pause' : 'play'} size={32} />
                                </button>
                            </div>
                        {/if}

                        <button
                            type="button"
                            class="fs-toggle"
                            onclick={toggleFullscreen}
                            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                            aria-pressed={isFullscreen}
                            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                        >
                            <Icon name={isFullscreen ? 'minimize' : 'maximize'} size={20} />
                        </button>
                    </div>
                </div>
            {/if}

            <!-- Reader Controls & Stats -->
            <div class="reader-controls-container">
                <div class="progress-stats">
                    <div class="stat">
                        <span
                            >Word {allWords.length > 0
                                ? (currentWordIndex + 1).toLocaleString()
                                : '0'}</span
                        >
                    </div>
                    <div class="stat main-stat">
                        {progressPercentage.toFixed(1)}%
                    </div>
                    <div class="stat">
                        <span>{allWords.length.toLocaleString()} total</span>
                    </div>
                </div>
                <div class="main-progress-track">
                    <div
                        class="main-progress-fill"
                        role="progressbar"
                        aria-label="Book reading progress"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-valuenow={progressPercentage}
                        style="width: {progressPercentage}%"
                    ></div>
                </div>

                {#if readerMode === 'speed'}
                    <div class="primary-controls">
                        <button
                            type="button"
                            onmousedown={startRewind}
                            onmouseup={stopRewind}
                            onmouseleave={stopRewind}
                            ontouchstart={startRewind}
                            ontouchend={stopRewind}
                            class="control-btn rewind"
                            disabled={allWords.length === 0 || currentWordIndex <= 0}
                            class:active={isRewinding}
                            aria-label="Rewind speed reading"
                            aria-pressed={isRewinding}
                        >
                            <Icon name="rewind" size={24} />
                        </button>

                        <button
                            type="button"
                            onclick={togglePlayPause}
                            class="control-btn play-pause"
                            disabled={allWords.length === 0}
                            aria-label={isPlaying ? 'Pause speed reading' : 'Start speed reading'}
                            aria-pressed={isPlaying}
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
                                type="button"
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
                            type="button"
                            onclick={() => (showExtraSettings = !showExtraSettings)}
                            class="toggle-extras"
                            aria-expanded={showExtraSettings}
                            aria-controls="extra-settings-panel"
                        >
                            <span>Extra Settings</span>
                            <Icon
                                name={showExtraSettings ? 'chevron-up' : 'chevron-down'}
                                size={16}
                            />
                        </button>

                        {#if showExtraSettings}
                            <div class="extras-panel" id="extra-settings-panel">
                                <h4>Punctuation Pause Multipliers</h4>
                                <div class="multipliers-grid">
                                    <div class="mult-group">
                                        <input
                                            id="mult-period"
                                            type="number"
                                            bind:value={periodMultiplier}
                                            oninput={handleMultiplierChange}
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
                                            oninput={handleMultiplierChange}
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
                                            oninput={handleMultiplierChange}
                                            min="1"
                                            max="10"
                                            step="0.5"
                                        />
                                        <label for="mult-semi">; Semicolon</label>
                                    </div>
                                    <div class="mult-group">
                                        <input
                                            id="mult-exclaim"
                                            type="number"
                                            bind:value={exclamationMultiplier}
                                            oninput={handleMultiplierChange}
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
                {/if}

                <section class="speech-section" aria-labelledby="speech-heading">
                    <div class="speech-heading-row">
                        <h3 id="speech-heading">Listen</h3>
                        <span class="speech-status" role="status" aria-live="polite">
                            {#if speechState.status === 'playing'}
                                Speaking chapter {speechState.chapterIndex + 1}
                            {:else if speechState.status === 'paused'}
                                Paused
                            {:else if speechState.status === 'error'}
                                Speech error
                            {:else}
                                Text to speech
                            {/if}
                        </span>
                    </div>

                    {#if speechState.status === 'unsupported'}
                        <p class="speech-message" role="status">
                            Text to speech is not available in this browser. You can still use the
                            reader normally.
                        </p>
                    {:else}
                        <div class="speech-options">
                            <div class="speech-option">
                                <label for="speech-voice">Voice</label>
                                <select
                                    id="speech-voice"
                                    bind:value={selectedVoiceName}
                                    onchange={handleSpeechVoiceChange}
                                >
                                    <option value="">System default</option>
                                    {#each speechVoices as voice (voice.name)}
                                        <option value={voice.name}
                                            >{voice.name} ({voice.lang})</option
                                        >
                                    {/each}
                                </select>
                            </div>
                            <div class="speech-option speech-rate-option">
                                <label for="speech-rate">Rate</label>
                                <input
                                    id="speech-rate"
                                    type="range"
                                    min="0.5"
                                    max="2"
                                    step="0.1"
                                    bind:value={speechRate}
                                    oninput={handleSpeechRateChange}
                                    aria-valuemin="0.5"
                                    aria-valuemax="2"
                                    aria-valuenow={speechRate}
                                />
                                <output for="speech-rate">{speechRate.toFixed(1)}×</output>
                            </div>
                        </div>
                        <div class="speech-actions">
                            {#if speechState.status === 'playing'}
                                <button type="button" onclick={pauseSpeech}>Pause speech</button>
                            {:else if speechState.status === 'paused'}
                                <button type="button" onclick={resumeSpeech}>Resume speech</button>
                            {:else}
                                <button type="button" onclick={startSpeech} disabled={!epubData}>
                                    Play speech
                                </button>
                            {/if}
                            <button
                                type="button"
                                onclick={stopSpeech}
                                disabled={speechState.status !== 'playing' &&
                                    speechState.status !== 'paused'}
                            >
                                Stop speech
                            </button>
                        </div>
                    {/if}
                    {#if speechState.errorMessage}
                        <p class="speech-message error" role="alert">{speechState.errorMessage}</p>
                    {/if}
                </section>

                {#if epubData && epubData.tableOfContents.length > 1}
                    <div class="toc-section">
                        <button
                            type="button"
                            onclick={() => (showTableOfContents = !showTableOfContents)}
                            class="toc-toggle"
                            aria-expanded={showTableOfContents}
                            aria-controls="table-of-contents"
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
                            <div class="toc-list" id="table-of-contents">
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
                                        type="button"
                                        onclick={() =>
                                            navigateToChapter(item.wordStartIndex, item.order)}
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
        <div class="modal-overlay" role="presentation">
            <div
                class="modal-card"
                role="dialog"
                tabindex="-1"
                aria-modal="true"
                aria-labelledby="reset-dialog-title"
                onkeydown={handleResetKeydown}
            >
                <div class="modal-header">
                    <div class="icon-danger"><Icon name="alert-triangle" size={20} /></div>
                    <h3 id="reset-dialog-title">Reset Progress?</h3>
                </div>
                <p>This will return you to the start of the book.</p>
                <div class="modal-actions">
                    <button
                        type="button"
                        bind:this={resetCancelButton}
                        onclick={cancelReset}
                        class="btn-secondary">Cancel</button
                    >
                    <button type="button" onclick={resetReading} class="btn-danger">Reset</button>
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

    .file-input-wrapper:focus-within {
        outline: 2px solid var(--c-primary);
        outline-offset: 3px;
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

    .book-open {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
        padding: 0;
        text-align: left;
        color: inherit;
    }

    .book-open:focus-visible {
        outline: 2px solid var(--c-primary);
        outline-offset: 3px;
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

    .mode-toggle {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
    }

    .mode-toggle button {
        padding: 0.65rem 1rem;
        border: 1px solid var(--c-border);
        border-radius: var(--radius-full);
        color: var(--c-text-light);
        font-weight: 600;
    }

    .mode-toggle button:hover,
    .mode-toggle button.active {
        border-color: var(--c-primary);
        background: var(--c-primary-light);
        color: var(--c-primary-dark);
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

    .speech-section {
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--c-border);
    }

    .speech-heading-row,
    .speech-options,
    .speech-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .speech-heading-row {
        justify-content: space-between;
        margin-bottom: 1rem;
    }

    .speech-heading-row h3 {
        font-size: 1rem;
    }

    .speech-status,
    .speech-message {
        color: var(--c-text-light);
        font-size: 0.875rem;
    }

    .speech-message {
        margin: 0;
    }

    .speech-message.error {
        margin-top: 0.75rem;
        color: var(--c-danger);
    }

    .speech-options {
        flex-wrap: wrap;
        margin-bottom: 1rem;
    }

    .speech-option {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .speech-option label {
        color: var(--c-text-light);
        font-size: 0.8rem;
        font-weight: 600;
    }

    .speech-option select {
        max-width: 15rem;
        padding: 0.35rem;
        border: 1px solid var(--c-border);
        border-radius: var(--radius-md);
        background: var(--c-bg-input);
        color: var(--c-text);
    }

    .speech-rate-option input {
        width: 8rem;
    }

    .speech-rate-option output {
        min-width: 2.5rem;
        color: var(--c-text-light);
        font-variant-numeric: tabular-nums;
    }

    .speech-actions button {
        padding: 0.55rem 0.85rem;
        border: 1px solid var(--c-border);
        border-radius: var(--radius-md);
        background: var(--c-bg-subtle);
        color: var(--c-text);
        font-weight: 600;
    }

    .speech-actions button:first-child {
        border-color: var(--c-primary);
        background: var(--c-primary);
        color: white;
    }

    .speech-actions button:hover:not(:disabled) {
        border-color: var(--c-primary);
    }

    .speech-actions button:disabled {
        cursor: not-allowed;
        opacity: 0.5;
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

    .reader-stage:focus-visible {
        outline: 2px solid var(--c-primary);
        outline-offset: 3px;
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
