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
            <span class="site-subtitle">Software Engineer</span>
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
        background: var(--c-bg-subtle);
        border-right: 1px solid var(--c-border);
        padding: 2rem;
        display: flex;
        flex-direction: column;
        align-items: flex-end;

        @media (max-width: 1024px) {
            align-items: center;
        }

        @media (max-width: 768px) {
            grid-column: 1 / -1;
            border-right: none;
            border-bottom: 1px solid var(--c-border);
            padding: 1rem;
            align-items: center;
        }
    }

    .nav-bar {
        position: sticky;
        top: 2rem;
        display: flex;
        flex-direction: column;
        gap: 2rem;
        text-align: right;

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
        }
    }

    .nav-header {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .site-title {
        font-family: var(--font-serif);
        font-weight: 900;
        font-size: 1.5rem;
        color: var(--c-text);
        text-decoration: none;
        line-height: 1.2;
    }

    .site-title:hover {
        color: var(--c-primary);
        text-decoration: none;
    }

    .site-subtitle {
        font-size: 0.875rem;
        color: var(--c-text-light);
        font-weight: 500;
        text-transform: uppercase;
    }

    .nav-links {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        @media (max-width: 768px) {
            flex-direction: row;
            gap: 1rem;
        }
    }

    .nav-link {
        color: var(--c-text-light);
        text-decoration: none;
        font-weight: 500;
        padding: 0.5rem 1rem;
        border-radius: var(--radius-md);
        transition: all 0.2s;
        margin-right: -1rem;

        @media (max-width: 1024px) {
            margin-right: 0;
        }

        @media (max-width: 768px) {
            padding: 0.25rem 0.5rem;
            font-size: 0.9rem;
        }
    }

    .nav-link:hover {
        color: var(--c-primary);
        background: var(--c-primary-light);
        text-decoration: none;
    }

    .nav-link.active {
        color: var(--c-primary);
        background: var(--c-primary-light);
        font-weight: 700;
    }

    .content-area {
        grid-column: 2 / 3;
        padding: 4rem 2rem;
        /* width: 100%; */

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
