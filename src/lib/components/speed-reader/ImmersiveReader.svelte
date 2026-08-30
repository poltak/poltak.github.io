<script lang="ts">
    import type { Chapter } from 'poltak-epub-parser'
    import {
        calculatePageCount,
        getKeyboardPageTurn,
        getPageDragScrollLeft,
        getPointerPageTurn,
        type PageTurn,
    } from '$lib/speed-reader/immersive-pagination'
    import {
        DEFAULT_READER_SETTINGS,
        READER_FONT_OPTIONS,
        READER_TEXT_ALIGN_OPTIONS,
        READER_THEME_OPTIONS,
        getReaderFontStack,
        loadReaderSettings,
        saveReaderSettings,
        type ReaderSettings,
        type ReaderTextAlign,
        type ReaderTheme,
    } from '$lib/speed-reader/immersive-settings'
    import { splitPlainTextIntoParagraphs } from '$lib/speed-reader/reader-content'
    import { onMount, tick } from 'svelte'

    interface Props {
        chapter: Chapter
        chapterIndex: number
        chapterCount: number
        progressPercentage: number
        totalWords: number
        onPrevious: () => void
        onNext: () => void
    }

    type FullscreenMode = 'paged' | 'continuous'
    type WebkitDocument = Document & {
        webkitFullscreenElement?: Element | null
        webkitExitFullscreen?: () => Promise<void> | void
    }
    type WebkitElement = HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void> | void
    }

    let {
        chapter,
        chapterIndex,
        chapterCount,
        progressPercentage,
        totalWords,
        onPrevious,
        onNext,
    }: Props = $props()

    const paragraphs = $derived(splitPlainTextIntoParagraphs(chapter.content))
    const headingId = $derived(`immersive-chapter-${chapter.id}`)

    let readerElement = $state<HTMLElement>()
    let pagedViewport = $state<HTMLElement>()
    let pagedContent = $state<HTMLElement>()
    let continuousViewport = $state<HTMLElement>()
    let renderedChapterId = $state<string | null>(null)
    let isFullscreen = $state(false)
    let usesFullscreenFallback = $state(false)
    let fullscreenMode = $state<FullscreenMode>('paged')
    let fullscreenError = $state<string | null>(null)
    let currentPage = $state(0)
    let pageCount = $state(1)
    let pageWidth = $state(0)
    let settingsOpen = $state(false)
    let readerSettings = $state<ReaderSettings>({ ...DEFAULT_READER_SETTINGS })
    let pointerStart: {
        id: number
        x: number
        y: number
        pointerType: string
        axis: 'undecided' | 'horizontal' | 'vertical' | 'mouse-moved'
        dragging: boolean
        captured: boolean
    } | null = null
    let paginationGeneration = 0
    let openAtLastPageAfterChapterChange = false
    let previousRootOverflow: string | null = null
    const DRAG_START_DISTANCE = 8
    const readerStyle = $derived(
        `--reader-font-family: ${getReaderFontStack(readerSettings.font)}; --reader-text-scale: ${readerSettings.textScale}%;`,
    )

    function getFullscreenElement(): Element | null {
        const webkitDocument = document as WebkitDocument
        return document.fullscreenElement ?? webkitDocument.webkitFullscreenElement ?? null
    }

    function syncFullscreenState() {
        isFullscreen = usesFullscreenFallback || getFullscreenElement() === readerElement
        if (!isFullscreen) cancelPointerInteraction(false)
    }

    function startFullscreenFallback() {
        if (previousRootOverflow === null) {
            previousRootOverflow = document.documentElement.style.overflow
        }
        document.documentElement.style.overflow = 'hidden'
        usesFullscreenFallback = true
        isFullscreen = true
    }

    function stopFullscreenFallback() {
        if (previousRootOverflow !== null) {
            document.documentElement.style.overflow = previousRootOverflow
            previousRootOverflow = null
        }
        usesFullscreenFallback = false
        isFullscreen = false
    }

    async function enterFullscreen() {
        if (!readerElement) return
        fullscreenError = null

        try {
            const webkitElement = readerElement as WebkitElement
            if (typeof readerElement.requestFullscreen === 'function') {
                await readerElement.requestFullscreen()
            } else if (typeof webkitElement.webkitRequestFullscreen === 'function') {
                await webkitElement.webkitRequestFullscreen()
            } else {
                startFullscreenFallback()
                return
            }
            syncFullscreenState()
        } catch {
            startFullscreenFallback()
        }
    }

    async function exitFullscreen() {
        fullscreenError = null

        try {
            if (usesFullscreenFallback) {
                stopFullscreenFallback()
                return
            }

            const webkitDocument = document as WebkitDocument
            if (typeof document.exitFullscreen === 'function') {
                await document.exitFullscreen()
            } else if (typeof webkitDocument.webkitExitFullscreen === 'function') {
                await webkitDocument.webkitExitFullscreen()
            }
            syncFullscreenState()
        } catch (error) {
            fullscreenError =
                error instanceof Error ? error.message : 'Unable to exit fullscreen reading.'
        }
    }

    function scrollToCurrentPage(behavior: ScrollBehavior = 'smooth') {
        if (!pagedViewport || typeof pagedViewport.scrollTo !== 'function') return

        const resolvedBehavior =
            behavior === 'smooth' &&
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
                ? 'auto'
                : behavior

        pagedViewport.scrollTo({
            left: currentPage * pageWidth,
            top: 0,
            behavior: resolvedBehavior,
        })
    }

    async function refreshPagination() {
        const generation = ++paginationGeneration
        await tick()

        if (
            generation !== paginationGeneration ||
            !isFullscreen ||
            fullscreenMode !== 'paged' ||
            !pagedViewport ||
            !pagedContent
        ) {
            return
        }

        const nextPageWidth = pagedViewport.clientWidth
        if (nextPageWidth <= 0) {
            pageCount = 1
            pageWidth = 0
            return
        }

        pageWidth = nextPageWidth
        await tick()
        if (generation !== paginationGeneration || !pagedContent) return

        pageCount = calculatePageCount(pagedContent.scrollWidth, nextPageWidth)
        if (openAtLastPageAfterChapterChange) {
            currentPage = pageCount - 1
            openAtLastPageAfterChapterChange = false
        } else {
            currentPage = Math.min(currentPage, pageCount - 1)
        }
        scrollToCurrentPage('auto')
    }

    function turnPage(direction: PageTurn) {
        if (direction === 'next') {
            if (currentPage < pageCount - 1) {
                currentPage += 1
                scrollToCurrentPage()
            } else if (chapterIndex < chapterCount - 1) {
                openAtLastPageAfterChapterChange = false
                onNext()
            }
            return
        }

        if (currentPage > 0) {
            currentPage -= 1
            scrollToCurrentPage()
        } else if (chapterIndex > 0) {
            openAtLastPageAfterChapterChange = true
            onPrevious()
        }
    }

    function releasePointerCapture(pointer: NonNullable<typeof pointerStart>) {
        if (!pointer.captured || !pagedViewport) return

        try {
            pagedViewport.releasePointerCapture?.(pointer.id)
        } catch {
            // The pointer may already have been released by the browser.
        }
    }

    function cancelPointerInteraction(snapBack: boolean) {
        const pointer = pointerStart
        pointerStart = null
        if (!pointer) return

        releasePointerCapture(pointer)
        if (snapBack && pointer.dragging) scrollToCurrentPage()
    }

    function handlePointerDown(event: PointerEvent) {
        if (!event.isPrimary) return

        const pointerType = event.pointerType || 'touch'
        const pointer = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            pointerType,
            axis: 'undecided' as const,
            dragging: false,
            captured: false,
        }
        pointerStart = pointer

        if (pointerType === 'mouse') return

        try {
            pagedViewport?.setPointerCapture?.(event.pointerId)
            pointer.captured = true
        } catch {
            // Some WebKit versions expose the method before they accept the pointer.
        }
    }

    function handlePointerMove(event: PointerEvent) {
        const pointer = pointerStart
        if (!pointer || pointer.id !== event.pointerId || !pagedViewport) return

        const deltaX = event.clientX - pointer.x
        const deltaY = event.clientY - pointer.y
        const absoluteDeltaX = Math.abs(deltaX)
        const absoluteDeltaY = Math.abs(deltaY)

        if (pointer.pointerType === 'mouse') {
            if (absoluteDeltaX > DRAG_START_DISTANCE || absoluteDeltaY > DRAG_START_DISTANCE) {
                pointer.axis = 'mouse-moved'
            }
            return
        }

        if (pointer.axis === 'undecided') {
            if (absoluteDeltaX <= DRAG_START_DISTANCE && absoluteDeltaY <= DRAG_START_DISTANCE) {
                return
            }

            pointer.axis = absoluteDeltaX > absoluteDeltaY ? 'horizontal' : 'vertical'
        }

        if (pointer.axis !== 'horizontal' || pageWidth <= 0) return

        pointer.dragging = true
        pagedViewport.scrollLeft = getPageDragScrollLeft({
            currentPage,
            pageWidth,
            viewportWidth: pagedViewport.clientWidth,
            contentWidth: pagedContent?.scrollWidth ?? 0,
            deltaX,
        })
        event.preventDefault()
    }

    function handlePointerUp(event: PointerEvent) {
        if (!pointerStart || pointerStart.id !== event.pointerId || !pagedViewport) return

        const start = pointerStart
        pointerStart = null
        releasePointerCapture(start)

        if (start.axis === 'vertical' || start.axis === 'mouse-moved') {
            if (start.dragging) scrollToCurrentPage()
            return
        }

        const bounds = pagedViewport.getBoundingClientRect()
        const turn = getPointerPageTurn({
            startX: start.x,
            startY: start.y,
            endX: event.clientX,
            endY: event.clientY,
            viewportLeft: bounds.left,
            viewportWidth: bounds.width,
        })

        if (turn) {
            turnPage(turn)
        } else if (start.dragging) {
            scrollToCurrentPage()
        }
    }

    function handlePointerCancel() {
        cancelPointerInteraction(true)
    }

    function handlePageKeydown(event: KeyboardEvent) {
        const turn = getKeyboardPageTurn(event.key, event.shiftKey)
        if (!turn) return

        event.preventDefault()
        turnPage(turn)
    }

    function updateReaderSetting<K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) {
        readerSettings[key] = value
        saveReaderSettings(readerSettings)

        if ((key === 'font' || key === 'textScale') && isFullscreen && fullscreenMode === 'paged') {
            void refreshPagination()
        }
    }

    function updateTextScale(event: Event) {
        const input = event.currentTarget as HTMLInputElement
        updateReaderSetting('textScale', Number(input.value))
    }

    function updateFont(event: Event) {
        const select = event.currentTarget as HTMLSelectElement
        if (READER_FONT_OPTIONS.some((option) => option.id === select.value)) {
            updateReaderSetting('font', select.value as ReaderSettings['font'])
        }
    }

    function updateTextAlign(textAlign: ReaderTextAlign) {
        updateReaderSetting('textAlign', textAlign)
    }

    function updateTheme(theme: ReaderTheme) {
        updateReaderSetting('theme', theme)
    }

    function toggleReadingSettings() {
        settingsOpen = !settingsOpen
        if (isFullscreen && fullscreenMode === 'paged') void refreshPagination()
    }

    function setFullscreenMode(mode: FullscreenMode) {
        if (mode === fullscreenMode) return

        fullscreenMode = mode
        currentPage = 0
        pageCount = 1
        void tick().then(() => {
            if (mode === 'continuous') {
                if (continuousViewport) continuousViewport.scrollTop = 0
            } else {
                void refreshPagination()
            }
        })
    }

    onMount(() => {
        readerSettings = loadReaderSettings()

        const handleFullscreenChange = () => syncFullscreenState()
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange)

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange)
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
            paginationGeneration += 1
            if (usesFullscreenFallback) stopFullscreenFallback()
        }
    })

    $effect(() => {
        const chapterId = chapter.id
        if (chapterId === renderedChapterId) return

        renderedChapterId = chapterId
        currentPage = 0
        pageCount = 1

        void tick().then(() => {
            if (isFullscreen) {
                if (continuousViewport) continuousViewport.scrollTop = 0
                if (fullscreenMode === 'paged') void refreshPagination()
                return
            }

            const scrollIntoView = readerElement?.scrollIntoView
            if (typeof scrollIntoView === 'function') {
                scrollIntoView.call(readerElement, { block: 'start' })
            }
        })
    })

    $effect(() => {
        const shouldPaginate =
            isFullscreen &&
            fullscreenMode === 'paged' &&
            Boolean(pagedViewport) &&
            Boolean(pagedContent)
        const chapterId = chapter.id
        const paragraphCount = paragraphs.length
        if (!shouldPaginate || !chapterId || paragraphCount < 0) return

        const update = () => void refreshPagination()
        update()
        window.addEventListener('resize', update)

        const resizeObserver =
            typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null
        if (resizeObserver && pagedViewport) resizeObserver.observe(pagedViewport)

        void document.fonts?.ready.then(update)

        return () => {
            paginationGeneration += 1
            window.removeEventListener('resize', update)
            resizeObserver?.disconnect()
        }
    })
</script>

{#snippet chapterHeader()}
    <header class="immersive-header">
        <p class="immersive-kicker">Chapter {chapterIndex + 1} of {chapterCount}</p>
        <h2 id={headingId}>{chapter.title || `Chapter ${chapterIndex + 1}`}</h2>
        <p class="immersive-progress">
            {progressPercentage.toFixed(1)}% complete · {totalWords.toLocaleString()} words in book
        </p>
    </header>
{/snippet}

{#snippet chapterText()}
    <div class="immersive-content">
        {#if paragraphs.length > 0}
            {#each paragraphs as paragraph}
                <p>{paragraph}</p>
            {/each}
        {:else}
            <p>This chapter has no readable text.</p>
        {/if}
    </div>
{/snippet}

{#snippet chapterNavigation()}
    <nav class="immersive-navigation" aria-label="Chapter navigation">
        <button type="button" onclick={onPrevious} disabled={chapterIndex <= 0}>
            Previous chapter
        </button>
        <span aria-live="polite">Chapter {chapterIndex + 1} of {chapterCount}</span>
        <button type="button" onclick={onNext} disabled={chapterIndex >= chapterCount - 1}>
            Next chapter
        </button>
    </nav>
{/snippet}

{#snippet readingSettingsPanel()}
    <section id="immersive-reading-settings" class="reading-settings" aria-label="Reading settings">
        <div class="reading-settings-grid">
            <fieldset class="reading-setting-group">
                <legend>Text alignment</legend>
                <div class="reading-setting-options" role="group" aria-label="Text alignment">
                    {#each READER_TEXT_ALIGN_OPTIONS as option}
                        <button
                            type="button"
                            class:active={readerSettings.textAlign === option.id}
                            aria-pressed={readerSettings.textAlign === option.id}
                            onclick={() => updateTextAlign(option.id)}
                        >
                            {option.label}
                        </button>
                    {/each}
                </div>
            </fieldset>

            <div class="reading-setting-group">
                <label for="immersive-text-size">
                    <span>Text size</span>
                    <output for="immersive-text-size">{readerSettings.textScale}%</output>
                </label>
                <input
                    id="immersive-text-size"
                    type="range"
                    min="50"
                    max="200"
                    step="5"
                    value={readerSettings.textScale}
                    aria-label="Text size"
                    oninput={updateTextScale}
                />
            </div>

            <div class="reading-setting-group">
                <label for="immersive-font">Font</label>
                <select id="immersive-font" value={readerSettings.font} onchange={updateFont}>
                    {#each READER_FONT_OPTIONS as option}
                        <option value={option.id}>{option.label}</option>
                    {/each}
                </select>
                <small>Uses fonts already available on this device.</small>
            </div>

            <fieldset class="reading-setting-group">
                <legend>Viewing theme</legend>
                <div class="reading-setting-options" role="group" aria-label="Viewing theme">
                    {#each READER_THEME_OPTIONS as option}
                        <button
                            type="button"
                            class:active={readerSettings.theme === option.id}
                            aria-pressed={readerSettings.theme === option.id}
                            onclick={() => updateTheme(option.id)}
                        >
                            {option.label}
                        </button>
                    {/each}
                </div>
            </fieldset>
        </div>
    </section>
{/snippet}

<article
    bind:this={readerElement}
    class="immersive-reader"
    class:fullscreen-active={isFullscreen}
    class:reading-align-left={readerSettings.textAlign === 'left'}
    class:reading-align-center={readerSettings.textAlign === 'center'}
    class:reading-align-justify={readerSettings.textAlign === 'justify'}
    data-reading-theme={readerSettings.theme}
    style={readerStyle}
    aria-labelledby={headingId}
>
    {#if isFullscreen}
        <div class="fullscreen-reader" class:continuous-mode={fullscreenMode === 'continuous'}>
            <header class="fullscreen-toolbar">
                <div class="fullscreen-book-position">
                    <strong>{chapter.title || `Chapter ${chapterIndex + 1}`}</strong>
                    <span>Chapter {chapterIndex + 1} of {chapterCount}</span>
                </div>

                <div class="fullscreen-mode-switch" role="group" aria-label="Reading layout">
                    <button
                        type="button"
                        class:active={fullscreenMode === 'paged'}
                        aria-pressed={fullscreenMode === 'paged'}
                        onclick={() => setFullscreenMode('paged')}
                    >
                        Page by page
                    </button>
                    <button
                        type="button"
                        class:active={fullscreenMode === 'continuous'}
                        aria-pressed={fullscreenMode === 'continuous'}
                        onclick={() => setFullscreenMode('continuous')}
                    >
                        Continuous flow
                    </button>
                </div>

                <div class="fullscreen-toolbar-actions">
                    {#if fullscreenError}
                        <span class="fullscreen-toolbar-error" role="alert">{fullscreenError}</span>
                    {/if}
                    {#if fullscreenMode === 'paged'}
                        <span class="page-position" aria-live="polite">
                            Page {currentPage + 1} of {pageCount}
                        </span>
                    {/if}
                    <button
                        type="button"
                        class="reading-settings-toggle"
                        aria-expanded={settingsOpen}
                        aria-controls="immersive-reading-settings"
                        onclick={toggleReadingSettings}
                    >
                        Reading settings
                    </button>
                    <button type="button" class="exit-fullscreen" onclick={exitFullscreen}>
                        Exit fullscreen
                    </button>
                </div>
            </header>

            {#if settingsOpen}
                {@render readingSettingsPanel()}
            {/if}

            {#if fullscreenMode === 'paged'}
                <div class="paged-frame">
                    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
                    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                    <div
                        bind:this={pagedViewport}
                        class="paged-viewport"
                        tabindex="0"
                        role="group"
                        aria-roledescription="paged reader"
                        aria-label="Paged chapter. Tap either side, swipe horizontally, or use arrow keys to turn pages."
                        onpointerdown={handlePointerDown}
                        onpointermove={handlePointerMove}
                        onpointerup={handlePointerUp}
                        onpointercancel={handlePointerCancel}
                        onkeydown={handlePageKeydown}
                    >
                        <div
                            bind:this={pagedContent}
                            class="paged-content"
                            style:--page-width={pageWidth > 0 ? `${pageWidth}px` : '100%'}
                        >
                            {@render chapterHeader()}
                            {@render chapterText()}
                        </div>
                    </div>
                </div>
            {:else}
                <div bind:this={continuousViewport} class="continuous-viewport">
                    <div class="continuous-content">
                        {@render chapterHeader()}
                        {@render chapterText()}
                        {@render chapterNavigation()}
                    </div>
                </div>
            {/if}
        </div>
    {:else}
        <div class="immersive-heading-row">
            <div class="immersive-heading-copy">
                {@render chapterHeader()}
            </div>
            <div class="immersive-heading-actions">
                <button
                    type="button"
                    class="reading-settings-toggle"
                    aria-expanded={settingsOpen}
                    aria-controls="immersive-reading-settings"
                    onclick={toggleReadingSettings}
                >
                    Reading settings
                </button>
                <button type="button" class="enter-fullscreen" onclick={enterFullscreen}>
                    Full screen
                </button>
            </div>
        </div>

        {#if settingsOpen}
            {@render readingSettingsPanel()}
        {/if}

        {#if fullscreenError}
            <p class="fullscreen-error" role="alert">{fullscreenError}</p>
        {/if}

        {@render chapterText()}
        {@render chapterNavigation()}
    {/if}
</article>

<style>
    .immersive-reader {
        --reader-bg: #fffdf8;
        --reader-text: #1f2926;
        --reader-muted: #51605b;
        --reader-border: rgba(31, 41, 38, 0.2);
        --reader-subtle: #f0f3ef;
        --reader-font-family: var(--font-serif);
        --reader-text-scale: 100%;
        width: 100%;
        min-width: 0;
        max-width: 52rem;
        margin: 0 auto;
        padding: clamp(1.25rem, 4vw, 3rem);
        box-sizing: border-box;
        background: var(--reader-bg);
        color: var(--reader-text);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
    }

    .immersive-reader[data-reading-theme='sepia'] {
        --reader-bg: #f4ecd8;
        --reader-text: #453b2a;
        --reader-muted: #74644a;
        --reader-border: rgba(69, 59, 42, 0.25);
        --reader-subtle: #eadfc5;
        color-scheme: light;
    }

    .immersive-reader[data-reading-theme='oled-dark'] {
        --reader-bg: #000;
        --reader-text: #8a9b95;
        --reader-muted: #64736e;
        --reader-border: rgba(138, 155, 149, 0.34);
        --reader-subtle: #111615;
        color-scheme: dark;
    }

    .immersive-reader[data-reading-theme='oled-day'] {
        --reader-bg: #000;
        --reader-text: #f4f6f5;
        --reader-muted: #b9c5c1;
        --reader-border: rgba(244, 246, 245, 0.32);
        --reader-subtle: #141817;
        color-scheme: dark;
    }

    .immersive-reader[data-reading-theme='light'] {
        color-scheme: light;
    }

    .immersive-heading-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        border-bottom: 1px solid var(--reader-border);
        margin-bottom: clamp(1.5rem, 4vw, 3rem);
        padding-bottom: 1.25rem;
    }

    .immersive-heading-copy {
        min-width: 0;
    }

    .immersive-heading-actions {
        display: flex;
        flex: 0 0 auto;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 0.65rem;
    }

    .immersive-heading-row :global(.immersive-header) {
        border: 0;
        margin: 0;
        padding: 0;
    }

    .immersive-header {
        border-bottom: 1px solid var(--reader-border);
        margin-bottom: clamp(1.5rem, 4vw, 3rem);
        padding-bottom: 1.25rem;
        break-inside: avoid;
    }

    .immersive-kicker,
    .immersive-progress {
        margin: 0;
        color: var(--reader-muted);
        font-size: 0.875rem;
    }

    .immersive-header h2 {
        margin: 0.5rem 0;
        color: var(--reader-text);
        font-family: var(--reader-font-family);
        font-size: clamp(1.75rem, 4vw, 2.5rem);
        line-height: 1.15;
    }

    .enter-fullscreen,
    .exit-fullscreen,
    .fullscreen-mode-switch button,
    .reading-settings-toggle {
        border: 1px solid var(--reader-border);
        border-radius: var(--radius-md);
        background: var(--reader-subtle);
        color: var(--reader-text);
        font-weight: 650;
    }

    .enter-fullscreen {
        flex: 0 0 auto;
        padding: 0.7rem 0.9rem;
    }

    .reading-settings-toggle {
        flex: 0 0 auto;
        padding: 0.7rem 0.9rem;
        white-space: nowrap;
    }

    .enter-fullscreen:hover,
    .exit-fullscreen:hover,
    .fullscreen-mode-switch button:hover,
    .reading-settings-toggle:hover {
        border-color: var(--c-primary);
        color: var(--c-primary);
    }

    .fullscreen-error {
        margin: -1rem 0 1.5rem;
        color: var(--c-danger, #b42318);
    }

    .immersive-content {
        color: var(--reader-text);
        font-family: var(--reader-font-family);
        font-size: clamp(1.1rem, 2vw, 1.35rem);
        overflow-wrap: anywhere;
        outline-offset: 0.35rem;
    }

    .reading-align-left .immersive-content {
        text-align: left;
    }

    .reading-align-center .immersive-content {
        text-align: center;
    }

    .reading-align-justify .immersive-content {
        text-align: justify;
    }

    .immersive-content p {
        margin: 0 0 1.35em;
        color: var(--reader-text);
        font-family: var(--reader-font-family);
        font-size: var(--reader-text-scale);
        line-height: 1.8;
        orphans: 3;
        widows: 3;
    }

    .immersive-content p:last-child {
        margin-bottom: 0;
    }

    .immersive-navigation {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-top: clamp(1.5rem, 4vw, 3rem);
        padding-top: 1.25rem;
        border-top: 1px solid var(--reader-border);
        color: var(--reader-muted);
        font-size: 0.875rem;
    }

    .immersive-navigation button {
        padding: 0.65rem 0.85rem;
        border: 1px solid var(--reader-border);
        border-radius: var(--radius-md);
        background: var(--reader-subtle);
        color: var(--reader-text);
        font-weight: 600;
    }

    .immersive-navigation button:hover:not(:disabled) {
        border-color: var(--c-primary);
        color: var(--c-primary);
    }

    .immersive-navigation button:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }

    .immersive-reader:fullscreen,
    .immersive-reader:-webkit-full-screen {
        width: 100%;
        height: 100%;
        max-width: none;
        margin: 0;
        padding: 0;
        overflow: hidden;
        border-radius: 0;
        background: var(--reader-bg);
        box-shadow: none;
    }

    .immersive-reader.fullscreen-active {
        position: fixed;
        z-index: 1000;
        inset: 0;
        width: 100dvw;
        height: 100dvh;
        max-width: none;
        margin: 0;
        padding: 0;
        overflow: hidden;
        border-radius: 0;
        background: var(--reader-bg);
        box-shadow: none;
    }

    .fullscreen-reader {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        min-height: 0;
        background: var(--reader-bg);
        color: var(--reader-text);
    }

    .fullscreen-toolbar {
        z-index: 2;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
        align-items: center;
        gap: 1rem;
        padding: 0.75rem clamp(0.75rem, 2.5vw, 2rem);
        border-bottom: 1px solid var(--reader-border);
        background: color-mix(in srgb, var(--reader-bg) 94%, transparent);
    }

    .fullscreen-book-position {
        display: flex;
        min-width: 0;
        flex-direction: column;
    }

    .fullscreen-book-position strong {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .fullscreen-book-position span,
    .page-position {
        color: var(--reader-muted);
        font-size: 0.8rem;
    }

    .fullscreen-mode-switch {
        display: flex;
        padding: 0.2rem;
        border: 1px solid var(--reader-border);
        border-radius: var(--radius-md);
        background: var(--reader-subtle);
    }

    .fullscreen-mode-switch button {
        padding: 0.5rem 0.75rem;
        border-color: transparent;
        background: transparent;
    }

    .fullscreen-mode-switch button.active {
        border-color: var(--reader-border);
        background: var(--reader-bg);
        color: var(--c-primary);
        box-shadow: var(--shadow-sm);
    }

    .fullscreen-toolbar-actions {
        display: flex;
        min-width: 0;
        align-items: center;
        justify-content: flex-end;
        flex-wrap: wrap;
        gap: 0.8rem;
    }

    .fullscreen-toolbar-error {
        max-width: 16rem;
        overflow: hidden;
        color: var(--c-danger, #b42318);
        font-size: 0.75rem;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .exit-fullscreen {
        padding: 0.55rem 0.75rem;
    }

    .reading-settings {
        width: 100%;
        min-width: 0;
        margin: 0 0 clamp(1.5rem, 4vw, 3rem);
        padding: 1rem;
        box-sizing: border-box;
        border: 1px solid var(--reader-border);
        background: var(--reader-subtle);
        color: var(--reader-text);
        overflow-x: hidden;
    }

    .fullscreen-reader > .reading-settings {
        flex: 0 0 auto;
        max-height: min(55dvh, 28rem);
        min-height: 0;
        margin: 0;
        border-width: 0 0 1px;
        overflow-y: auto;
    }

    .reading-settings-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
        min-width: 0;
    }

    .reading-setting-group {
        min-width: 0;
        min-inline-size: 0;
        margin: 0;
        padding: 0;
        border: 0;
    }

    .reading-setting-group > label,
    .reading-setting-group > legend {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 0.5rem;
        width: 100%;
        margin: 0 0 0.45rem;
        padding: 0;
        box-sizing: border-box;
        color: var(--reader-muted);
        font-size: 0.8rem;
        font-weight: 750;
    }

    .reading-setting-options {
        display: flex;
        min-width: 0;
        flex-wrap: wrap;
        gap: 0.35rem;
    }

    .reading-setting-options button {
        min-width: 0;
        flex: 1 1 4.5rem;
        padding: 0.45rem 0.55rem;
        border: 1px solid var(--reader-border);
        border-radius: var(--radius-sm);
        background: var(--reader-bg);
        color: var(--reader-text);
        font: inherit;
        font-size: 0.8rem;
        font-weight: 650;
        overflow-wrap: anywhere;
    }

    .reading-setting-options button:hover,
    .reading-setting-options button.active {
        border-color: var(--c-primary);
        color: var(--c-primary);
    }

    .reading-setting-options button.active {
        background: color-mix(in srgb, var(--c-primary) 10%, var(--reader-bg));
    }

    .reading-setting-group select,
    .reading-setting-group input[type='range'] {
        display: block;
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
    }

    .reading-setting-group select {
        min-height: 2.35rem;
        padding: 0.4rem 0.55rem;
        border: 1px solid var(--reader-border);
        border-radius: var(--radius-sm);
        background: var(--reader-bg);
        color: var(--reader-text);
        font: inherit;
        font-size: 0.85rem;
    }

    .reading-setting-group input[type='range'] {
        accent-color: var(--c-primary);
    }

    .reading-setting-group small {
        display: block;
        margin-top: 0.35rem;
        color: var(--reader-muted);
        font-size: 0.7rem;
        line-height: 1.35;
    }

    .paged-frame {
        flex: 1 1 auto;
        min-width: 0;
        min-height: 0;
        padding: clamp(1rem, 3vw, 2.5rem) clamp(2rem, 6vw, 6rem) 0;
        overflow: hidden;
    }

    .paged-viewport {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        touch-action: pan-y pinch-zoom;
        cursor: pointer;
        outline-offset: 0.25rem;
        user-select: text;
    }

    .paged-content {
        width: 100%;
        height: 100%;
        column-width: var(--page-width);
        column-gap: 0;
        column-fill: auto;
        overflow-wrap: anywhere;
    }

    .paged-content :global(.immersive-header),
    .paged-content :global(.immersive-content) {
        padding: 0 clamp(0.25rem, 1vw, 1rem);
    }

    .continuous-viewport {
        flex: 1 1 auto;
        min-width: 0;
        min-height: 0;
        overflow-x: hidden;
        overflow-y: auto;
        overscroll-behavior: contain;
        touch-action: pan-y pinch-zoom;
        scrollbar-gutter: stable;
    }

    .continuous-content {
        width: min(100%, 52rem);
        min-width: 0;
        margin: 0 auto;
        padding: clamp(1.5rem, 5vw, 4rem) clamp(1.25rem, 5vw, 3rem);
        box-sizing: border-box;
    }

    @media screen and (max-width: 760px) {
        .fullscreen-toolbar {
            grid-template-columns: minmax(0, 1fr) auto;
        }

        .fullscreen-mode-switch {
            grid-column: 1 / -1;
            grid-row: 2;
            justify-self: center;
        }

        .page-position {
            display: none;
        }

        .fullscreen-toolbar-actions {
            gap: 0.35rem;
        }

        .paged-frame {
            padding-right: 2.25rem;
            padding-left: 2.25rem;
        }
    }

    @media screen and (max-width: 576px) {
        .immersive-reader {
            padding: 0.75rem;
        }

        .immersive-heading-row {
            align-items: stretch;
            flex-direction: column;
        }

        .enter-fullscreen {
            align-self: flex-start;
        }

        .immersive-navigation {
            align-items: stretch;
            flex-direction: column;
            text-align: center;
        }

        .fullscreen-book-position span {
            display: none;
        }

        .immersive-heading-actions {
            flex-direction: column;
            align-items: stretch;
        }

        .fullscreen-toolbar {
            gap: 0.5rem;
            padding: 0.55rem 0.65rem;
        }

        .fullscreen-mode-switch {
            width: 100%;
        }

        .fullscreen-mode-switch button {
            flex: 1;
        }

        .continuous-content {
            padding: 1rem 0.75rem;
        }

        .reading-settings {
            padding: 0.75rem;
        }

        .reading-settings-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
        }

        .fullscreen-toolbar-actions .reading-settings-toggle,
        .fullscreen-toolbar-actions .exit-fullscreen {
            padding: 0.45rem 0.5rem;
            font-size: 0.72rem;
        }

        .paged-frame {
            padding-top: 1rem;
        }
    }
</style>
