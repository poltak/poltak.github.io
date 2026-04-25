<script lang="ts">
    import { base } from '$app/paths'
    import { page } from '$app/stores'

    let { children } = $props()

    const title = $derived(($page.data?.fun?.title ?? 'Fun') as string)
    const description = $derived(($page.data?.fun?.description ?? '') as string)
</script>

<section class="fun-hero">
    <div class="hero-text">
        <p class="eyebrow">Fun / {title}</p>
        <h1>{title}</h1>
        {#if description}
            <p class="lede">{description}</p>
        {/if}
    </div>
    <a class="back-link" href="{base}/fun">Back to Fun</a>
</section>

<div class="fun-body">
    {@render children?.()}
</div>

<style>
    .fun-hero {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 2rem;
        margin-bottom: 2.5rem;
        flex-wrap: wrap;
        border-bottom: 1px solid var(--c-border-light);
        padding-bottom: 1.5rem;
    }

    .hero-text {
        max-width: 650px;
    }

    .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.16em;
        font-size: 0.75rem;
        font-weight: 800;
        color: var(--c-accent);
        margin-bottom: 0.5rem;
    }

    .lede {
        font-size: 1.1rem;
        color: var(--c-text-light);
    }

    .back-link {
        color: var(--c-primary);
        text-decoration: none;
        font-weight: 750;
        background: var(--c-primary-light);
        padding: 0.55rem 1rem;
        border-radius: var(--radius-full);
        border: 1px solid transparent;
        transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            border-color 0.2s ease;
    }

    .back-link:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-sm);
        border-color: var(--c-border-light);
        text-decoration: none;
    }

    .fun-body {
        margin-bottom: 2rem;
    }
</style>
