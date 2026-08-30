<script lang="ts">
    import type { Chapter } from 'poltak-epub-parser'
    import {
        calculatePageCount,
        getKeyboardPageTurn,
        getPointerPageTurn,
        type PageTurn,
    } from '$lib/speed-reader/immersive-pagination'
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
    let pointerStart: { id: number; x: number; y: number } | null = null
    let paginationGeneration = 0
    let openAtLastPageAfterChapterChange = false
    let previousRootOverflow: string | null = null
    const canTurnPrevious = $derived(currentPage > 0 || chapterIndex > 0)
    const canTurnNext = $derived(currentPage < pageCount - 1 || chapterIndex < chapterCount - 1)

    function getFullscreenElement(): Element | null {
        const webkitDocument = document as WebkitDocument
        return document.fullscreenElement ?? webkitDocument.webkitFullscreenElement ?? null
    }

    function syncFullscreenState() {
        isFullscreen = usesFullscreenFallback || getFullscreenElement() === readerElement
        if (!isFullscreen) pointerStart = null
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

        pagedViewport.scrollTo({
            left: currentPage * pageWidth,
            top: 0,
            behavior,
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

    function handlePointerDown(event: PointerEvent) {
        if (!event.isPrimary) return
        pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY }
        try {
            pagedViewport?.setPointerCapture?.(event.pointerId)
        } catch {
            // Some WebKit versions expose the method before they accept the pointer.
        }
    }

    function handlePointerUp(event: PointerEvent) {
        if (!pointerStart || pointerStart.id !== event.pointerId || !pagedViewport) return

        const start = pointerStart
        pointerStart = null
        const bounds = pagedViewport.getBoundingClientRect()
        const turn = getPointerPageTurn({
            startX: start.x,
            startY: start.y,
            endX: event.clientX,
            endY: event.clientY,
            viewportLeft: bounds.left,
            viewportWidth: bounds.width,
        })

        if (turn) turnPage(turn)
    }

    function handlePointerCancel() {
        pointerStart = null
    }

    function handlePageKeydown(event: KeyboardEvent) {
        const turn = getKeyboardPageTurn(event.key, event.shiftKey)
        if (!turn) return

        event.preventDefault()
        turnPage(turn)
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

<article
    bind:this={readerElement}
    class="immersive-reader"
    class:fullscreen-active={isFullscreen}
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
                    <button type="button" class="exit-fullscreen" onclick={exitFullscreen}>
                        Exit fullscreen
                    </button>
                </div>
            </header>

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
                        <span
                            class="page-cue page-cue-left"
                            class:disabled={!canTurnPrevious}
                            aria-hidden="true">‹</span
                        >
                        <span
                            class="page-cue page-cue-right"
                            class:disabled={!canTurnNext}
                            aria-hidden="true">›</span
                        >
                    </div>
                </div>
                <p class="paged-instructions">
                    Tap left or right, swipe horizontally, or use the arrow keys to turn pages.
                </p>
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
            <button type="button" class="enter-fullscreen" onclick={enterFullscreen}>
                Full screen
            </button>
        </div>

        {#if fullscreenError}
            <p class="fullscreen-error" role="alert">{fullscreenError}</p>
        {/if}

        {@render chapterText()}
        {@render chapterNavigation()}
    {/if}
</article>

<style>
    .immersive-reader {
        width: 100%;
        min-width: 0;
        max-width: 52rem;
        margin: 0 auto;
        padding: clamp(1.25rem, 4vw, 3rem);
        box-sizing: border-box;
        background: var(--c-surface);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
    }

    .immersive-heading-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        border-bottom: 1px solid var(--c-border);
        margin-bottom: clamp(1.5rem, 4vw, 3rem);
        padding-bottom: 1.25rem;
    }

    .immersive-heading-copy {
        min-width: 0;
    }

    .immersive-heading-row :global(.immersive-header) {
        border: 0;
        margin: 0;
        padding: 0;
    }

    .immersive-header {
        border-bottom: 1px solid var(--c-border);
        margin-bottom: clamp(1.5rem, 4vw, 3rem);
        padding-bottom: 1.25rem;
        break-inside: avoid;
    }

    .immersive-kicker,
    .immersive-progress {
        margin: 0;
        color: var(--c-text-light);
        font-size: 0.875rem;
    }

    .immersive-header h2 {
        margin: 0.5rem 0;
        font-size: clamp(1.75rem, 4vw, 2.5rem);
        line-height: 1.15;
    }

    .enter-fullscreen,
    .exit-fullscreen,
    .fullscreen-mode-switch button {
        border: 1px solid var(--c-border);
        border-radius: var(--radius-md);
        background: var(--c-bg-subtle);
        color: var(--c-text);
        font-weight: 650;
    }

    .enter-fullscreen {
        flex: 0 0 auto;
        padding: 0.7rem 0.9rem;
    }

    .enter-fullscreen:hover,
    .exit-fullscreen:hover,
    .fullscreen-mode-switch button:hover {
        border-color: var(--c-primary);
        color: var(--c-primary);
    }

    .fullscreen-error {
        margin: -1rem 0 1.5rem;
        color: var(--c-danger, #b42318);
    }

    .immersive-content {
        color: var(--c-text);
        font-family: var(--font-serif);
        font-size: clamp(1.1rem, 2vw, 1.35rem);
        line-height: 1.8;
        overflow-wrap: anywhere;
        outline-offset: 0.35rem;
    }

    .immersive-content p {
        margin: 0 0 1.35em;
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
        border-top: 1px solid var(--c-border);
        color: var(--c-text-light);
        font-size: 0.875rem;
    }

    .immersive-navigation button {
        padding: 0.65rem 0.85rem;
        border: 1px solid var(--c-border);
        border-radius: var(--radius-md);
        background: var(--c-bg-subtle);
        color: var(--c-text);
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
        background: var(--c-surface);
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
        background: var(--c-surface);
        box-shadow: none;
    }

    .fullscreen-reader {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr) auto;
        width: 100%;
        height: 100%;
        min-height: 0;
        background: var(--c-surface);
        color: var(--c-text);
    }

    .fullscreen-toolbar {
        z-index: 2;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
        align-items: center;
        gap: 1rem;
        padding: 0.75rem clamp(0.75rem, 2.5vw, 2rem);
        border-bottom: 1px solid var(--c-border);
        background: color-mix(in srgb, var(--c-surface) 94%, transparent);
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
        color: var(--c-text-light);
        font-size: 0.8rem;
    }

    .fullscreen-mode-switch {
        display: flex;
        padding: 0.2rem;
        border: 1px solid var(--c-border);
        border-radius: var(--radius-md);
        background: var(--c-bg-subtle);
    }

    .fullscreen-mode-switch button {
        padding: 0.5rem 0.75rem;
        border-color: transparent;
        background: transparent;
    }

    .fullscreen-mode-switch button.active {
        border-color: var(--c-border);
        background: var(--c-surface);
        color: var(--c-primary);
        box-shadow: var(--shadow-sm);
    }

    .fullscreen-toolbar-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
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

    .paged-frame {
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

    .page-cue {
        position: fixed;
        top: 50%;
        display: grid;
        width: 2.25rem;
        height: 3.5rem;
        place-items: center;
        border: 1px solid var(--c-border);
        border-radius: 999px;
        background: color-mix(in srgb, var(--c-surface) 88%, transparent);
        color: var(--c-text-light);
        font-size: 2rem;
        line-height: 1;
        pointer-events: none;
        transform: translateY(-50%);
    }

    .page-cue-left {
        left: clamp(0.4rem, 1.5vw, 1.25rem);
    }

    .page-cue-right {
        right: clamp(0.4rem, 1.5vw, 1.25rem);
    }

    .page-cue.disabled {
        opacity: 0.25;
    }

    .paged-instructions {
        margin: 0;
        padding: 0.65rem 1rem;
        color: var(--c-text-light);
        font-size: 0.8rem;
        text-align: center;
    }

    .continuous-viewport {
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

    .fullscreen-reader.continuous-mode {
        grid-template-rows: auto minmax(0, 1fr);
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

        .paged-frame {
            padding-top: 1rem;
        }
    }
</style>
