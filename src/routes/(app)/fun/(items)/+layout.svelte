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
        margin-bottom: 2rem;
        flex-wrap: wrap;
    }

    .hero-text {
        max-width: 650px;
    }

    .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.1em;
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--c-text-muted);
        margin-bottom: 0.5rem;
    }

    .lede {
        font-size: 1.1rem;
        color: var(--c-text-light);
    }

    .back-link {
        color: var(--c-primary-dark);
        text-decoration: none;
        font-weight: 600;
        background: var(--c-primary-light);
        padding: 0.5rem 1rem;
        border-radius: var(--radius-full);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .back-link:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-sm);
    }

    .fun-body {
        margin-bottom: 2rem;
    }
</style>
