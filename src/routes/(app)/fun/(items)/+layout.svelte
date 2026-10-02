<script lang="ts">
    import { base } from '$app/paths'
    import { page } from '$app/stores'

    let { children } = $props()

    const title = $derived(($page.data?.fun?.title ?? 'Fun') as string)
    const description = $derived(($page.data?.fun?.description ?? '') as string)
</script>

<svelte:head>
    <title>{title} · Jon Samosir</title>
</svelte:head>

<header class="terminal-hero fun-item-hero">
    <p class="terminal-prompt">&gt;_</p>
    <h1>{title}</h1>
    <a class="terminal-index hero-back" href="{base}/fun">../ Fun</a>
</header>

{#if description}
    <p class="lede">{description}</p>
{/if}

<div class="fun-body">
    {@render children?.()}
</div>

<style>
    .fun-item-hero {
        margin-bottom: 1.25rem;
    }

    /* Project titles are longer than the section titles, so they use a smaller size. */
    :global(.content-area) .fun-item-hero h1 {
        font-size: clamp(1.9rem, 4.5vw, 3rem);
    }

    .lede {
        color: var(--c-text-light);
        font-size: 1.05rem;
        line-height: 1.7;
        margin: 0 0 2rem;
        max-width: var(--measure);
    }

    .hero-back:hover {
        color: var(--c-text);
        text-decoration: underline;
        text-underline-offset: 0.25rem;
    }

    .fun-body {
        margin-bottom: 2rem;
    }

    :global(.fun-body p),
    :global(.fun-body li) {
        color: var(--c-text-light);
        line-height: 1.65;
    }

    :global(.fun-body a) {
        color: var(--c-primary);
        font-weight: 700;
    }

    :global(.fun-body h1),
    :global(.fun-body h2),
    :global(.fun-body h3),
    :global(.fun-body h4) {
        color: var(--c-text);
        font-family: var(--font-mono);
        letter-spacing: 0.02em;
    }

    :global(.fun-body .card h2),
    :global(.fun-body .viewer-header h2),
    :global(.fun-body .terminal-panel h2),
    :global(.fun-body .maze-controls h3) {
        color: var(--c-primary);
        font-size: 1.1rem;
        font-weight: 800;
        line-height: 1.25;
        margin: 0 0 1rem;
        text-transform: uppercase;
    }

    :global(.fun-body .card),
    :global(.fun-body .upload-card),
    :global(.fun-body .tip-card),
    :global(.fun-body .book-card),
    :global(.fun-body .reader-stage),
    :global(.fun-body .reader-controls-container),
    :global(.fun-body .extras-panel),
    :global(.fun-body .action-card),
    :global(.fun-body .viewer-item),
    :global(.fun-body .modal-card) {
        border-radius: 0 !important;
        box-shadow: none !important;
    }

    :global(.fun-body button),
    :global(.fun-body .file-input),
    :global(.fun-body .chrome-store-link),
    :global(.fun-body .back-link),
    :global(.fun-body .actions a) {
        border-radius: 0 !important;
    }

    :global(.fun-body .app-container) {
        align-items: stretch;
        font-family: var(--font-mono);
        min-height: 0;
        padding: 0;
    }

    :global(.fun-body .library-header) {
        border-bottom: 1px dashed var(--c-border-dashed);
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        text-align: left !important;
    }

    :global(.fun-body .logo-circle) {
        display: none !important;
    }

    :global(.fun-body .library-header h1) {
        color: var(--c-primary);
        font-family: var(--font-mono);
        font-size: 1.35rem;
        text-transform: uppercase;
    }

    :global(.fun-body .upload-card),
    :global(.fun-body .tip-card),
    :global(.fun-body .book-card),
    :global(.fun-body .reader-stage),
    :global(.fun-body .reader-controls-container),
    :global(.fun-body .extras-panel),
    :global(.fun-body .modal-card) {
        background: transparent !important;
        border: 1px solid var(--c-border) !important;
    }

    :global(.fun-body .file-input-wrapper),
    :global(.fun-body .setting-group),
    :global(.fun-body .toc-item),
    :global(.fun-body .back-link),
    :global(.fun-body .preset-btn),
    :global(.fun-body .chapter-num),
    :global(.fun-body .status-message) {
        border-radius: 0 !important;
    }

    :global(.fun-body .control-btn),
    :global(.fun-body .fs-btn),
    :global(.fun-body .fs-toggle),
    :global(.fun-body .delete-btn),
    :global(.fun-body .book-badge),
    :global(.fun-body .icon-danger) {
        box-shadow: none !important;
    }

    :global(.fun-body .current-word),
    :global(.fun-body .book-title) {
        font-family: var(--font-mono);
    }
</style>
