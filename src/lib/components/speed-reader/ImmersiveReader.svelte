<script lang="ts">
    import type { Chapter } from 'poltak-epub-parser'
    import { splitPlainTextIntoParagraphs } from '$lib/speed-reader/reader-content'
    import { tick } from 'svelte'

    interface Props {
        chapter: Chapter
        chapterIndex: number
        chapterCount: number
        progressPercentage: number
        totalWords: number
        onPrevious: () => void
        onNext: () => void
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
    let renderedChapterId = $state<string | null>(null)

    $effect(() => {
        const chapterId = chapter.id
        if (chapterId === renderedChapterId) return
        renderedChapterId = chapterId
        void tick().then(() => {
            const scrollIntoView = readerElement?.scrollIntoView
            if (typeof scrollIntoView === 'function') {
                scrollIntoView.call(readerElement, { block: 'start' })
            }
        })
    })
</script>

<article bind:this={readerElement} class="immersive-reader" aria-labelledby={headingId}>
    <header class="immersive-header">
        <p class="immersive-kicker">Chapter {chapterIndex + 1} of {chapterCount}</p>
        <h2 id={headingId}>{chapter.title || `Chapter ${chapterIndex + 1}`}</h2>
        <p class="immersive-progress">
            {progressPercentage.toFixed(1)}% complete · {totalWords.toLocaleString()} words in book
        </p>
    </header>

    <div class="immersive-content">
        {#if paragraphs.length > 0}
            {#each paragraphs as paragraph}
                <p>{paragraph}</p>
            {/each}
        {:else}
            <p>This chapter has no readable text.</p>
        {/if}
    </div>

    <nav class="immersive-navigation" aria-label="Chapter navigation">
        <button type="button" onclick={onPrevious} disabled={chapterIndex <= 0}>
            Previous chapter
        </button>
        <span aria-live="polite">Chapter {chapterIndex + 1} of {chapterCount}</span>
        <button type="button" onclick={onNext} disabled={chapterIndex >= chapterCount - 1}>
            Next chapter
        </button>
    </nav>
</article>

<style>
    .immersive-reader {
        width: 100%;
        max-width: 52rem;
        margin: 0 auto;
        padding: clamp(1.25rem, 4vw, 3rem);
        background: var(--c-surface);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
    }

    .immersive-header {
        border-bottom: 1px solid var(--c-border);
        margin-bottom: clamp(1.5rem, 4vw, 3rem);
        padding-bottom: 1.25rem;
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

    .immersive-content {
        color: var(--c-text);
        font-family: var(--font-serif);
        font-size: clamp(1.1rem, 2vw, 1.35rem);
        line-height: 1.8;
        outline-offset: 0.35rem;
    }

    .immersive-content p {
        margin: 0 0 1.35em;
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

    @media screen and (max-width: 576px) {
        .immersive-navigation {
            align-items: stretch;
            flex-direction: column;
            text-align: center;
        }
    }
</style>
