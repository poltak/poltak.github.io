<script lang="ts">
    import '../app.css'
    import { base } from '$app/paths'
    import { page } from '$app/stores'

    let { children } = $props()

    const isActive = (path: string) => $page.url.pathname === `${base}${path}`
</script>

<div class="nav-area">
    <nav class="nav-bar">
        <div class="nav-header">
            <a href="{base}/" class="site-title">Jon Samosir</a>
        </div>
        <div class="nav-links">
            <a class="nav-link" class:active={isActive('/')} href="{base}/">About</a>
            <a class="nav-link" class:active={isActive('/cv')} href="{base}/cv">Résumé</a>
            <a class="nav-link" class:active={isActive('/contact')} href="{base}/contact">Contact</a
            >
            <a class="nav-link" class:active={isActive('/fun')} href="{base}/fun">Fun</a>
        </div>
    </nav>
</div>

<div class="content-area">
    <div class="content-wrapper">
        {@render children?.()}
    </div>
</div>

<style>
    .nav-area {
        grid-column: 1 / 2;
        background: linear-gradient(180deg, rgba(0, 212, 255, 0.08), transparent 65%),
            var(--c-bg-subtle);
        border-right: 1px solid var(--c-border);
        padding: 2rem 1.75rem;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        box-shadow: 8px 0 0 var(--shadow-block);

        @media (max-width: 1024px) {
            align-items: center;
        }

        @media (max-width: 768px) {
            grid-column: 1 / -1;
            border-right: none;
            border-bottom: 1px solid var(--c-border);
            padding: 1rem;
            align-items: center;
            box-shadow: none;
        }
    }

    .nav-bar {
        position: sticky;
        top: 2rem;
        display: flex;
        flex-direction: column;
        gap: 2rem;
        text-align: right;
        border: 1px solid var(--c-border);
        padding: 1.25rem 1.5rem;
        background: var(--c-surface);
        box-shadow: 10px 10px 0 var(--shadow-block);
        border-radius: var(--radius-md);

        @media (max-width: 1024px) {
            text-align: center;
        }

        @media (max-width: 768px) {
            position: static;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            max-width: 600px;
            gap: 1rem;
            text-align: left;
            box-shadow: none;
            border: none;
            background: transparent;
            padding: 0;
        }

        @media (max-width: 520px) {
            flex-direction: column;
            align-items: stretch;
            text-align: center;
            gap: 0.75rem;
            padding: 1rem;
            border: none;
            background: transparent;
        }
    }

    .nav-header {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        border: 1px solid var(--c-border);
        padding: 0.75rem 1rem;
        background: var(--c-surface);
        box-shadow: 6px 6px 0 var(--shadow-block);
        border-radius: var(--radius-md);
    }

    .site-title {
        font-family: var(--font-mono);
        font-weight: 900;
        font-size: 1.5rem;
        color: var(--c-primary);
        text-decoration: none;
        line-height: 1.2;
        text-transform: uppercase;
        letter-spacing: 0.12em;
    }

    .site-title:hover {
        color: var(--c-primary);
        text-decoration: none;
    }

    .nav-links {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        border: 1px solid var(--c-border);
        padding: 0.75rem;
        background: var(--c-surface);
        box-shadow: 6px 6px 0 var(--shadow-block);
        border-radius: var(--radius-md);

        @media (max-width: 768px) {
            flex-direction: row;
            gap: 1rem;
            flex-wrap: wrap;
            justify-content: stretch;
            background: transparent;
            box-shadow: none;
            padding: 0;
        }

        @media (max-width: 520px) {
            gap: 0.5rem;
        }
    }

    .nav-link {
        color: var(--c-text-light);
        text-decoration: none;
        font-weight: 700;
        padding: 0.5rem 1rem;
        border-radius: var(--radius-md);
        transition: all 0.2s;
        margin-right: 0;
        border: 1px solid transparent;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        font-size: 0.8rem;
        width: 100%;
        text-align: center;
        box-sizing: border-box;

        @media (max-width: 768px) {
            padding: 0.25rem 0.5rem;
            font-size: 0.9rem;
            width: auto;
            flex: 1 1 0;
        }

        @media (max-width: 520px) {
            padding: 0.35rem 0.75rem;
        }
    }

    .nav-link:hover {
        color: var(--c-primary);
        background: var(--c-primary-light);
        border-color: var(--c-border);
        text-decoration: none;
    }

    .nav-link.active {
        color: var(--c-primary);
        background: var(--c-primary-light);
        font-weight: 700;
        border-color: var(--c-primary);
    }

    :global(:root:not(.dark)) .nav-header,
    :global(:root:not(.dark)) .nav-links {
        background: transparent;
        box-shadow: none;
    }

    .content-area {
        grid-column: 2 / 3;
        padding: 4rem 2rem;

        @media (max-width: 768px) {
            grid-column: 1 / -1;
            padding: 2rem 1rem;
        }

        @media (min-width: 576px) and (max-width: 1024px) {
            padding: 2rem 4rem;
        }
    }

    .content-wrapper {
        animation: fade-in 0.5s ease-out;
        max-width: var(--content-max-width);
        width: 100%;
        margin: 0 auto;
    }

    @keyframes fade-in {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
