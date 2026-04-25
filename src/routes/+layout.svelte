<script lang="ts">
    import '../app.css'
    import { base } from '$app/paths'
    import { page } from '$app/stores'
    import { onMount } from 'svelte'

    let { children } = $props()

    const isActive = (path: string) => $page.url.pathname === `${base}${path}`

    const themes = [
        { id: 'cyan', label: 'Cyan', color: '#00d4ff' },
        { id: 'acid', label: 'Acid', color: '#2cff8e' },
        { id: 'amber', label: 'Amber', color: '#f0a01e' },
        { id: 'magenta', label: 'Magenta', color: '#ff6fe9' },
        { id: 'red', label: 'Red', color: '#ff6a4f' },
        { id: 'teal', label: 'Teal', color: '#2bd3c3' },
        { id: 'violet', label: 'Violet', color: '#7c5cff' },
    ]

    let currentTheme = $state('cyan')
    let pickerOpen = $state(false)
    let shouldCloseOnClick = false

    function applyTheme(theme: string) {
        currentTheme = theme
        if (typeof document !== 'undefined') {
            document.documentElement.dataset.theme = theme
            localStorage.setItem('theme', theme)
        }
    }

    onMount(() => {
        const saved = localStorage.getItem('theme')
        const theme = saved || 'cyan'
        currentTheme = theme
        document.documentElement.dataset.theme = theme

        const media = window.matchMedia('(prefers-color-scheme: dark)')
        document.documentElement.classList.toggle('dark', media.matches)
        media.addEventListener('change', (event) => {
            document.documentElement.classList.toggle('dark', event.matches)
        })

        const closeOnOutside = (event: MouseEvent | TouchEvent) => {
            const target = event.target as HTMLElement | null
            if (!target?.closest('.theme-picker')) {
                if (shouldCloseOnClick) {
                    pickerOpen = false
                } else {
                    shouldCloseOnClick = true
                }
            }
        }
        document.addEventListener('click', closeOnOutside, true)
        document.addEventListener('touchstart', closeOnOutside, true)
        return () => {
            document.removeEventListener('click', closeOnOutside, true)
            document.removeEventListener('touchstart', closeOnOutside, true)
        }
    })
</script>

<div class="nav-area">
    <nav class="nav-bar">
        <div class="nav-header">
            <a href="{base}/" class="site-title">Jon<br />Samosir</a>
            <p class="site-role">Software Developer</p>
        </div>
        <div class="nav-links">
            <a class="nav-link" class:active={isActive('/')} href="{base}/">
                <span class="nav-glyph">[]</span>
                <span>About</span>
            </a>
            <a class="nav-link" class:active={isActive('/cv')} href="{base}/cv">
                <span class="nav-glyph">#</span>
                <span>Résumé</span>
            </a>
            <a class="nav-link" class:active={isActive('/contact')} href="{base}/contact">
                <span class="nav-glyph">@</span>
                <span>Contact</span>
            </a>
            <a class="nav-link" class:active={isActive('/fun')} href="{base}/fun">
                <span class="nav-glyph">./</span>
                <span>Projects / Fun</span>
            </a>
        </div>
        <div class="sidebar-panel sidebar-stats" aria-label="Site metadata">
            <div>
                <span>Location</span>
                <strong>Earth</strong>
            </div>
            <div>
                <span>Focus</span>
                <strong>Remote Dev</strong>
            </div>
            <div>
                <span>Stack</span>
                <strong>TypeScript<br />React<br />SvelteKit</strong>
            </div>
            <div>
                <span>Status</span>
                <strong><i></i>Building</strong>
            </div>
            <div>
                <span>Updated</span>
                <strong>Apr 2026</strong>
            </div>
        </div>
        <div class="sidebar-panel color-panel" aria-label="Color mode">
            <div class="panel-title">Color Mode</div>
            <div class="mode-row">
                <span>Light</span>
                <span class="mode-switch"><i></i></span>
                <span>Dark</span>
            </div>
            <p>Dark mode enabled</p>
        </div>
        <div class="sidebar-footer">
            <p>© 2026 Jon Samosir</p>
            <p>// Handcrafted with code</p>
        </div>
    </nav>
</div>

<div class="content-area">
    <div class="content-wrapper">
        {@render children?.()}
    </div>
</div>

<div
    class="theme-picker"
    aria-label="Theme picker"
    role="presentation"
    class:open={pickerOpen}
    onmouseenter={() => (pickerOpen = true)}
    onmouseleave={() => (pickerOpen = false)}
>
    <button
        type="button"
        class="theme-toggle"
        style={`--swatch:${themes.find((t) => t.id === currentTheme)?.color ?? '#00d4ff'}`}
        aria-label="Open theme picker"
        onclick={(event) => {
            event.stopPropagation()
            pickerOpen = !pickerOpen
            shouldCloseOnClick = false
        }}
        ontouchstart={(event) => {
            event.stopPropagation()
            shouldCloseOnClick = false
            pickerOpen = !pickerOpen
        }}
    ></button>
    <div class="theme-panel">
        <div class="theme-title">Theme</div>
        <div class="theme-swatches">
            {#each themes as theme}
                <button
                    type="button"
                    class:active={currentTheme === theme.id}
                    style={`--swatch:${theme.color}`}
                    aria-label={`Switch to ${theme.label} theme`}
                    onclick={(event) => {
                        event.stopPropagation()
                        applyTheme(theme.id)
                        shouldCloseOnClick = true
                    }}
                ></button>
            {/each}
        </div>
    </div>
</div>

<style>
    .nav-area {
        grid-column: 1 / 2;
        padding: 1.5rem 1.5rem 1.5rem 1.25rem;
        display: flex;
        flex-direction: column;
        align-items: stretch;

        @media (max-width: 1024px) {
            padding: 1.5rem 1rem;
        }

        @media (max-width: 992px) {
            grid-column: 1 / -1;
            padding: 1rem 1rem 0;
            align-items: center;
        }
    }

    .nav-bar {
        position: sticky;
        top: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.45rem;
        border: 1px solid var(--c-border-light);
        padding: 1.35rem 1.25rem;
        background: color-mix(in srgb, var(--c-bg-subtle) 38%, transparent);
        max-height: calc(100vh - 3rem);
        overflow: auto;

        @media (max-width: 1024px) {
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
        }

        @media (max-width: 992px) {
            position: static;
            flex-direction: row;
            align-items: center;
            justify-content: flex-start;
            width: 100%;
            max-width: 768px;
            gap: 0.75rem;
            border-width: 0 0 1px;
            padding: 0 0 0.9rem;
            background: transparent;
        }

        @media (max-width: 576px) {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
            padding: 0 0 0.9rem;
        }
    }

    .nav-header {
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
        padding: 0 0 1.4rem;
        border-bottom: 1px solid var(--c-border-light);

        @media (max-width: 992px) {
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            position: relative;
        }

        @media (min-width: 993px) and (max-width: 1024px) {
            width: 100%;
            box-sizing: border-box;
        }
    }

    .site-title {
        font-family: var(--font-serif);
        font-weight: 700;
        font-size: clamp(1.75rem, 2.5vw, 2.2rem);
        color: var(--c-primary);
        text-decoration: none;
        line-height: 1;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    .site-title:hover {
        color: var(--c-primary);
        text-decoration: none;
    }

    .site-role {
        color: var(--c-text-muted);
        font-family: var(--font-mono);
        font-size: 0.82rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        margin: 0;
        text-transform: uppercase;
    }

    .nav-links {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0;

        @media (max-width: 992px) {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            gap: 0.5rem;
            padding: 0;
            flex: 1 1 auto;
            min-width: 0;
        }

        @media (min-width: 993px) and (max-width: 1024px) {
            width: 100%;
            box-sizing: border-box;
        }

        @media (max-width: 576px) {
            gap: 0.5rem;
        }
    }

    .nav-link {
        color: var(--c-text-light);
        text-decoration: none;
        font-family: var(--font-mono);
        font-weight: 700;
        display: grid;
        grid-template-columns: 1.4rem 1fr auto;
        gap: 0.65rem;
        align-items: center;
        padding: 0.78rem 0.8rem;
        border-radius: 0;
        margin-right: 0;
        border: 1px solid transparent;
        font-size: 0.92rem;
        width: 100%;
        text-align: left;
        box-sizing: border-box;
        text-transform: uppercase;

        @media (max-width: 992px) {
            padding: 0.45rem 0;
            border-width: 0 0 1px;
            display: inline-flex;
            width: auto;
            text-align: center;
        }

        @media (max-width: 576px) {
            padding: 0.35rem 0.75rem;
        }
    }

    .nav-link:hover {
        color: var(--c-primary);
        border-color: var(--c-border-light);
        text-decoration: none;
    }

    .nav-link.active {
        color: var(--c-primary);
        border-color: var(--c-border);
        background: var(--c-primary-light);
        font-weight: 750;
    }

    .nav-link.active::after {
        content: '->';
        color: var(--c-primary);
    }

    .nav-glyph {
        color: var(--c-text-muted);
        font-size: 0.86rem;
    }

    .nav-link.active .nav-glyph,
    .nav-link:hover .nav-glyph {
        color: var(--c-primary);
    }

    .sidebar-panel,
    .sidebar-footer {
        border: 1px solid var(--c-border-light);
        padding: 0.9rem;
        font-family: var(--font-mono);
    }

    .sidebar-stats {
        display: grid;
        gap: 0.65rem;
    }

    .sidebar-stats div {
        display: grid;
        grid-template-columns: 5.3rem 1fr;
        gap: 0.7rem;
        align-items: start;
    }

    .sidebar-stats span,
    .panel-title {
        color: var(--c-text-muted);
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    .sidebar-stats strong {
        color: var(--c-text-light);
        font-size: 0.8rem;
        font-weight: 500;
        line-height: 1.45;
    }

    .sidebar-stats i {
        display: inline-block;
        width: 0.45rem;
        height: 0.45rem;
        margin-right: 0.45rem;
        background: var(--c-primary);
        border-radius: 50%;
        vertical-align: 0.05rem;
    }

    .color-panel {
        display: grid;
        gap: 0.8rem;
    }

    .mode-row {
        display: grid;
        grid-template-columns: 1fr 4rem 1fr;
        align-items: center;
        gap: 0.6rem;
        color: var(--c-text-muted);
        font-size: 0.78rem;
    }

    .mode-row span:last-child {
        color: var(--c-text-light);
        text-align: right;
    }

    .mode-switch {
        position: relative;
        height: 1.4rem;
        border: 1px solid var(--c-border-light);
        background: var(--c-primary-light);
    }

    .mode-switch i {
        position: absolute;
        top: 50%;
        right: 0.25rem;
        width: 0.85rem;
        height: 0.85rem;
        background: var(--c-primary);
        border-radius: 50%;
        transform: translateY(-50%);
    }

    .color-panel p,
    .sidebar-footer p {
        color: var(--c-text-muted);
        font-size: 0.78rem;
        margin: 0;
    }

    .color-panel p {
        color: color-mix(in srgb, var(--c-primary) 70%, var(--c-text-light));
        text-align: center;
    }

    .sidebar-footer {
        display: grid;
        gap: 0.55rem;
    }

    .sidebar-footer p:last-child {
        color: color-mix(in srgb, var(--c-primary) 60%, var(--c-text-muted));
    }

    @media (max-width: 992px) {
        .site-role,
        .nav-glyph,
        .nav-link.active::after,
        .sidebar-panel,
        .sidebar-footer {
            display: none;
        }
    }

    .content-area {
        grid-column: 2 / 3;
        padding: 4.5rem 4rem 4rem 0;

        @media (max-width: 992px) {
            grid-column: 1 / -1;
            padding: 3rem 1.25rem;
        }

        @media (min-width: 576px) and (max-width: 992px) {
            padding: 3rem 4rem;
        }
    }

    .content-wrapper {
        animation: fade-in 0.5s ease-out;
        max-width: var(--content-max-width);
        width: 100%;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    .theme-picker {
        position: fixed;
        right: 1rem;
        bottom: 1rem;
        width: 2.6rem;
        height: 2.6rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        z-index: 20;
    }

    .theme-toggle {
        width: 100%;
        height: 100%;
        border: 1px solid var(--c-border);
        background: var(--swatch);
        border-radius: var(--radius-full);
        padding: 0;
        cursor: pointer;
        box-shadow: var(--shadow-sm);
    }

    .theme-panel {
        position: absolute;
        right: 0;
        bottom: 0;
        min-width: 12rem;
        background: var(--c-surface);
        border: 1px solid var(--c-border);
        box-shadow: var(--shadow-md);
        border-radius: 14px;
        padding: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        opacity: 0;
        pointer-events: none;
        transform: scale(0.9);
        transform-origin: bottom right;
        transition:
            opacity 0.2s ease,
            transform 0.2s ease;
    }

    .theme-picker:hover .theme-panel,
    .theme-picker.open .theme-panel {
        opacity: 1;
        pointer-events: auto;
        transform: scale(1);
    }

    .theme-picker:hover .theme-toggle,
    .theme-picker.open .theme-toggle {
        opacity: 0;
        pointer-events: none;
    }

    .theme-title {
        font-size: 0.65rem;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        color: var(--c-text-muted);
        background: transparent;
        border: none;
        padding: 0;
        text-align: left;
        cursor: pointer;
    }

    .theme-swatches {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
    }

    .theme-swatches button {
        width: 1.25rem;
        height: 1.25rem;
        border: 1px solid var(--c-border);
        background: var(--swatch);
        border-radius: var(--radius-full);
        padding: 0;
        cursor: pointer;
        box-shadow: var(--shadow-sm);
    }

    .theme-swatches button.active {
        outline: 2px solid var(--c-primary);
        outline-offset: 2px;
    }

    @media (max-width: 768px) {
        .theme-picker {
            right: 0.75rem;
            bottom: 0.75rem;
            width: 2rem;
            height: 2rem;
        }

        .theme-panel {
            min-width: 12rem;
        }
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
