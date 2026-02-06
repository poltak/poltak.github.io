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
    let isMobile = $state(false)

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

        const updateMobile = () => {
            isMobile = window.matchMedia('(max-width: 768px)').matches
        }

        updateMobile()
        window.addEventListener('resize', updateMobile)

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
            window.removeEventListener('resize', updateMobile)
        }
    })
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
        background: linear-gradient(180deg, rgba(0, 212, 255, 0.08), transparent 65%),
            var(--c-bg-subtle);
        border-right: 1px solid var(--c-border);
        padding: 2rem 1.75rem;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        box-shadow: 8px 0 0 var(--shadow-block);

        @media (max-width: 1024px) {
            align-items: stretch;
            padding: 1.5rem 1rem;
        }

        @media (max-width: 992px) {
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
        border: 1px solid var(--c-border);
        padding: 1.25rem 1.5rem;
        background: var(--c-surface);
        box-shadow: 10px 10px 0 var(--shadow-block);
        border-radius: var(--radius-md);
        text-align: center;

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
            box-shadow: none;
            border: none;
            background: transparent;
            padding: 0;
        }

        @media (max-width: 520px) {
            flex-direction: column;
            align-items: stretch;
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

        @media (max-width: 992px) {
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            position: relative;
        }

        @media (min-width: 769px) and (max-width: 1024px) {
            width: 100%;
            box-sizing: border-box;
        }
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

        @media (max-width: 992px) {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.5rem;
            background: transparent;
            box-shadow: none;
            padding: 0;
            flex: 1 1 auto;
            min-width: 0;
        }

        @media (min-width: 769px) and (max-width: 1024px) {
            width: 100%;
            box-sizing: border-box;
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

        @media (max-width: 992px) {
            padding: 0.25rem 0.5rem;
            font-size: 0.9rem;
            width: 100%;
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

        @media (max-width: 992px) {
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

    .theme-picker {
        position: fixed;
        left: 1rem;
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
        padding: 0;
        cursor: pointer;
        box-shadow: 3px 3px 0 var(--shadow-block);
    }

    .theme-panel {
        position: absolute;
        left: 0;
        bottom: 0;
        min-width: 12rem;
        background: var(--c-surface);
        border: 1px solid var(--c-border);
        box-shadow: 6px 6px 0 var(--shadow-block);
        padding: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        opacity: 0;
        pointer-events: none;
        transform: scale(0.9);
        transform-origin: bottom left;
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
        padding: 0;
        cursor: pointer;
        box-shadow: 3px 3px 0 var(--shadow-block);
    }

    .theme-swatches button.active {
        outline: 2px solid var(--c-primary);
        outline-offset: 2px;
    }

    @media (max-width: 768px) {
        .theme-picker {
            left: 0.75rem;
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
