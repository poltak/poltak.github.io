<script lang="ts">
    import '../app.css'
    import { base } from '$app/paths'
    import { page } from '$app/stores'
    import { cubicOut } from 'svelte/easing'
    import { onMount, tick } from 'svelte'
    import { fade } from 'svelte/transition'
    import {
        COLOR_MODE_STORAGE_KEY,
        DEFAULT_THEME,
        THEMES as themes,
        THEME_STORAGE_KEY,
        isThemeId,
        type ColorMode,
    } from '$lib/theme'

    let { children } = $props()

    const navItems = [
        { path: '/', glyph: '[]', label: 'About' },
        { path: '/cv', glyph: '#', label: 'Resume' },
        { path: '/contact', glyph: '@', label: 'Contact' },
        { path: '/fun', glyph: './', label: 'Fun' },
    ]

    const isActive = (path: string) => {
        const pathname = $page.url.pathname
        const target = `${base}${path}`

        if (path === '/') {
            return pathname === target
        }

        return pathname === target || pathname.startsWith(`${target}/`)
    }

    // The inline script in app.html sets the root attributes before this component runs.
    const root = typeof document === 'undefined' ? null : document.documentElement
    const initialTheme = root?.dataset.theme
    let currentTheme = $state<string>(isThemeId(initialTheme) ? initialTheme : DEFAULT_THEME)
    let colorMode = $state<ColorMode>(
        root && initialTheme && !root.classList.contains('dark') ? 'light' : 'dark',
    )
    let pickerOpen = $state(false)
    let reduceMotion = $state(false)
    let navLinksElement: HTMLDivElement
    let navLinkElements = $state<HTMLAnchorElement[]>([])
    let navIndicatorStyle = $state('opacity: 0;')
    // Until the first measurement is painted, the active link draws its own highlight.
    let navIndicatorReady = $state(false)
    let themeToggle: HTMLButtonElement
    let hasColorPreference = false

    function readPreference(key: string): string | null {
        try {
            return localStorage.getItem(key)
        } catch {
            return null
        }
    }

    function writePreference(key: string, value: string) {
        try {
            localStorage.setItem(key, value)
        } catch {
            // Theme controls still work when browser storage is unavailable.
        }
    }

    function applyTheme(theme: string) {
        currentTheme = theme
        if (typeof document !== 'undefined') {
            document.documentElement.dataset.theme = theme
            writePreference(THEME_STORAGE_KEY, theme)
        }
    }

    function applyColorMode(mode: ColorMode, persist = true) {
        colorMode = mode
        if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', mode === 'dark')
            if (persist) {
                hasColorPreference = true
                writePreference(COLOR_MODE_STORAGE_KEY, mode)
            }
        }
    }

    function toggleColorMode() {
        applyColorMode(colorMode === 'dark' ? 'light' : 'dark')
    }

    async function updateNavIndicator() {
        await tick()

        const activeIndex = navItems.findIndex((item) => isActive(item.path))
        const activeElement = navLinkElements[activeIndex]

        if (!navLinksElement || !activeElement) {
            navIndicatorStyle = 'opacity: 0;'
            return
        }

        const containerRect = navLinksElement.getBoundingClientRect()
        const activeRect = activeElement.getBoundingClientRect()

        navIndicatorStyle = [
            'opacity: 1',
            `width: ${activeRect.width}px`,
            `height: ${activeRect.height}px`,
            `transform: translate3d(${activeRect.left - containerRect.left}px, ${activeRect.top - containerRect.top}px, 0)`,
        ].join(';')

        if (!navIndicatorReady) {
            requestAnimationFrame(() => (navIndicatorReady = true))
        }
    }

    $effect(() => {
        $page.url.pathname
        updateNavIndicator()
    })

    onMount(() => {
        const saved = readPreference(THEME_STORAGE_KEY)
        const theme = isThemeId(saved) ? saved : DEFAULT_THEME
        currentTheme = theme
        document.documentElement.dataset.theme = theme

        const media = window.matchMedia('(prefers-color-scheme: dark)')
        const savedColorMode = readPreference(COLOR_MODE_STORAGE_KEY)
        hasColorPreference = savedColorMode === 'light' || savedColorMode === 'dark'
        applyColorMode(
            savedColorMode === 'light' || savedColorMode === 'dark'
                ? savedColorMode
                : media.matches
                  ? 'dark'
                  : 'light',
            false,
        )
        const syncColorPreference = (event: MediaQueryListEvent) => {
            if (!hasColorPreference) {
                applyColorMode(event.matches ? 'dark' : 'light', false)
            }
        }
        media.addEventListener('change', syncColorPreference)

        const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)')
        reduceMotion = motionMedia.matches
        const syncMotionPreference = (event: MediaQueryListEvent) => {
            reduceMotion = event.matches
        }
        motionMedia.addEventListener('change', syncMotionPreference)

        const closeOnOutside = (event: PointerEvent) => {
            const target = event.target
            if (!(target instanceof Element) || !target.closest('.display-panel, .theme-toggle')) {
                pickerOpen = false
            }
        }
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && pickerOpen) {
                pickerOpen = false
                themeToggle?.focus()
            }
        }
        window.addEventListener('resize', updateNavIndicator)
        document.addEventListener('pointerdown', closeOnOutside, true)
        document.addEventListener('keydown', closeOnEscape)
        return () => {
            window.removeEventListener('resize', updateNavIndicator)
            document.removeEventListener('pointerdown', closeOnOutside, true)
            document.removeEventListener('keydown', closeOnEscape)
            media.removeEventListener('change', syncColorPreference)
            motionMedia.removeEventListener('change', syncMotionPreference)
        }
    })
</script>

<!-- The default title. A page sets its own title after this one. -->
<svelte:head>
    <title>Jon Samosir</title>
</svelte:head>

<div class="nav-area">
    <nav class="nav-bar">
        <div class="nav-header">
            <a href="{base}/" class="site-title">Jon Samosir</a>
        </div>
        <div class="nav-links" class:ready={navIndicatorReady} bind:this={navLinksElement}>
            <span class="nav-active-indicator" style={navIndicatorStyle}></span>
            {#each navItems as item, index}
                <a
                    class="nav-link"
                    class:active={isActive(item.path)}
                    href="{base}{item.path}"
                    bind:this={navLinkElements[index]}
                >
                    <span class="nav-glyph">{item.glyph}</span>
                    <span>{item.label}</span>
                </a>
            {/each}
        </div>
        <div class="sidebar-panel sidebar-stats" aria-label="Site metadata">
            <div>
                <span>Location</span>
                <strong>Hoi An, Viet Nam</strong>
            </div>
            <div>
                <span>Role</span>
                <strong>Senior Product Engineer</strong>
            </div>
            <div>
                <span>Status</span>
                <strong><i></i>Open to remote collaboration</strong>
            </div>
            <div>
                <span>Updated</span>
                <strong>July 2026</strong>
            </div>
        </div>
        <!-- In the sidebar on wide screens. On narrow screens the corner button opens it. -->
        <div
            class="sidebar-panel display-panel"
            class:open={pickerOpen}
            id="display-panel"
            role="group"
            aria-label="Display settings"
        >
            <div class="panel-title">Color mode</div>
            <div class="mode-row">
                <span>Light</span>
                <button
                    type="button"
                    class="mode-switch"
                    aria-label={`Switch to ${colorMode === 'dark' ? 'light' : 'dark'} mode`}
                    aria-pressed={colorMode === 'dark'}
                    onclick={toggleColorMode}
                >
                    <i></i>
                </button>
                <span>Dark</span>
            </div>
            <div class="panel-title">Theme</div>
            <div class="theme-swatches">
                {#each themes as theme}
                    <button
                        type="button"
                        class:active={currentTheme === theme.id}
                        style:--swatch={theme.color}
                        aria-label={`Switch to ${theme.label} theme`}
                        aria-pressed={currentTheme === theme.id}
                        title={theme.label}
                        onclick={() => applyTheme(theme.id)}
                    ></button>
                {/each}
            </div>
        </div>
    </nav>
</div>

<div class="content-area">
    <div class="content-wrapper">
        {#key $page.url.pathname}
            <!-- No outro: an outgoing page that stays in the flow puts two pages in the document. -->
            <div class="page" in:fade={{ duration: reduceMotion ? 0 : 120, easing: cubicOut }}>
                {@render children?.()}
            </div>
        {/key}
    </div>
    <footer class="terminal-footer" aria-label="Site footer">
        <span>jon@poltak:~% <i></i></span>
        <span class="copyright">© 2026 poltak</span>
        <nav>
            <a href="https://github.com/poltak">GitHub ↗</a>
            <a href="https://www.linkedin.com/in/jsamosir/">LinkedIn ↗</a>
            <a href="https://x.com/poltak_">X / Twitter ↗</a>
        </nav>
    </footer>
</div>

<button
    type="button"
    class="theme-toggle"
    bind:this={themeToggle}
    aria-label="Open theme picker"
    aria-expanded={pickerOpen}
    aria-controls="display-panel"
    onclick={() => (pickerOpen = !pickerOpen)}
>
    <i></i>
</button>

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
        gap: 0.9rem;
        border: 1px solid var(--c-border-light);
        padding: 1.35rem 1.25rem;
        background: color-mix(in srgb, var(--c-bg-subtle) 38%, transparent);
        /* A sticky sidebar that is taller than the viewport cannot be scrolled into view. */
        max-height: calc(100vh - 3rem);
        box-sizing: border-box;
        overflow-y: auto;
        scrollbar-width: thin;

        @media (max-width: 1024px) {
            width: 100%;
            max-width: 100%;
        }

        @media (max-width: 992px) {
            position: static;
            max-height: none;
            overflow: visible;
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
        padding: 0 0 1.1rem;
        border-bottom: 1px solid var(--c-border-light);

        @media (max-width: 992px) {
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            position: relative;
            padding: 0.75rem 0 1.4rem;
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

    .nav-links {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        padding: 0;

        @media (max-width: 992px) {
            display: flex;
            flex-direction: row;
            justify-content: space-around;
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

    .nav-active-indicator {
        position: absolute;
        left: 0;
        top: 0;
        z-index: 0;
        border: 1px solid var(--c-border);
        background: var(--c-primary-light);
        pointer-events: none;
        visibility: hidden;
    }

    .nav-links.ready .nav-active-indicator {
        visibility: visible;
        transition:
            transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
            width 0.3s cubic-bezier(0.22, 1, 0.36, 1),
            height 0.3s cubic-bezier(0.22, 1, 0.36, 1),
            opacity 0.16s ease;
    }

    .nav-links:not(.ready) .nav-link.active {
        border-color: var(--c-border);
        background: var(--c-primary-light);
    }

    .nav-link {
        position: relative;
        z-index: 1;
        color: var(--c-text-light);
        text-decoration: none;
        font-family: var(--font-mono);
        font-weight: 700;
        display: grid;
        grid-template-columns: 1.4rem 1fr auto;
        gap: 0.65rem;
        align-items: center;
        padding: 0.5rem 0.8rem;
        border-radius: 0;
        margin-right: 0;
        border: 1px solid transparent;
        font-size: 0.92rem;
        width: 100%;
        text-align: left;
        box-sizing: border-box;
        text-transform: uppercase;
        /* No background transition: the highlight moves to the indicator without a fade. */
        transition:
            color 0.2s,
            border-color 0.2s;

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
        border-color: transparent;
        background: transparent;
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

    .sidebar-panel {
        border: 1px solid var(--c-border-light);
        padding: 0.75rem 0.8rem;
        font-family: var(--font-mono);
    }

    .sidebar-stats {
        display: grid;
        gap: 0.5rem;
    }

    /* The label goes above its value. Two columns made the values wrap to three lines. */
    .sidebar-stats div {
        display: grid;
        gap: 0.1rem;
    }

    .sidebar-stats span,
    .panel-title {
        color: var(--c-text-muted);
        font-size: 0.68rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        line-height: 1.3;
        text-transform: uppercase;
    }

    .sidebar-stats strong {
        color: var(--c-text-light);
        font-size: 0.78rem;
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

    .display-panel {
        display: grid;
        gap: 0.55rem;
    }

    .display-panel .panel-title:not(:first-child) {
        margin-top: 0.25rem;
    }

    .mode-row {
        display: grid;
        grid-template-columns: 1fr 4rem 1fr;
        align-items: center;
        gap: 0.6rem;
        color: var(--c-text-muted);
        font-size: 0.78rem;
    }

    /* The root class drives this control, so it is correct before hydration. */
    .mode-row span:last-child {
        text-align: right;
    }

    :global(:root:not(.dark)) .mode-row span:first-child,
    :global(:root.dark) .mode-row span:last-child {
        color: var(--c-primary);
    }

    .mode-switch {
        position: relative;
        height: 1.4rem;
        border: 1px solid var(--c-border);
        background: var(--c-primary-light);
        padding: 0;
        cursor: pointer;
    }

    .mode-switch i {
        position: absolute;
        top: 50%;
        right: calc(100% - 1.1rem);
        width: 0.85rem;
        height: 0.85rem;
        background: var(--c-primary);
        transform: translateY(-50%);
        transition: right 0.18s ease;
    }

    :global(:root.dark) .mode-switch i {
        right: 0.25rem;
    }

    .theme-swatches {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
    }

    .theme-swatches button {
        width: 1.2rem;
        height: 1.2rem;
        border: 1px solid var(--c-border-light);
        background: var(--swatch);
        padding: 0;
        cursor: pointer;
    }

    .theme-swatches button:hover {
        border-color: var(--c-text);
    }

    .theme-swatches button.active {
        outline: 2px solid var(--c-text);
        outline-offset: 2px;
    }

    @media (prefers-reduced-motion: reduce) {
        .mode-switch i {
            transition: none;
        }
    }

    /* Narrow screens have no sidebar panels. This button opens the display panel. */
    .theme-toggle {
        display: none;
        position: fixed;
        right: 0.75rem;
        bottom: 0.75rem;
        z-index: 20;
        width: 2.5rem;
        height: 2.5rem;
        place-items: center;
        border: 1px solid var(--c-border);
        background: var(--c-surface);
        padding: 0;
        cursor: pointer;
        box-shadow: var(--shadow-sm);
    }

    .theme-toggle i {
        width: 1rem;
        height: 1rem;
        background: linear-gradient(135deg, var(--c-primary) 50%, var(--c-text) 50%);
    }

    @media (max-width: 992px) {
        .nav-glyph,
        .nav-link.active::after,
        .sidebar-panel {
            display: none;
        }

        .theme-toggle {
            display: grid;
        }

        .display-panel.open {
            display: grid;
            position: fixed;
            right: 0.75rem;
            bottom: 3.75rem;
            z-index: 20;
            width: 15.5rem;
            padding: 0.9rem;
            border-color: var(--c-border);
            background: var(--c-surface);
            box-shadow: var(--shadow-md);
        }

        .display-panel.open .theme-swatches button {
            width: 1.5rem;
            height: 1.5rem;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .nav-links.ready .nav-active-indicator {
            transition: none;
        }
    }

    .content-area {
        grid-column: 2 / 3;
        padding: 4.5rem 4rem 4rem 0;
        min-height: 100vh;
        display: flex;
        flex-direction: column;

        /* The bottom space keeps the footer links clear of the corner button. */
        @media (max-width: 992px) {
            grid-column: 1 / -1;
            padding: 2.25rem 1.25rem 4.5rem;
        }

        @media (min-width: 576px) and (max-width: 992px) {
            padding: 2.5rem 4rem 4.5rem;
        }
    }

    .content-wrapper {
        animation: fade-in 0.5s ease-out;
        max-width: var(--content-max-width);
        width: 100%;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        flex: 1 0 auto;
    }

    /* All pages use the monospace face. Page styles set the exceptions (titles, reader text). */
    .page,
    .page :global(*) {
        font-family: var(--font-mono);
    }

    .terminal-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        max-width: var(--content-max-width);
        margin-top: 2rem;
        padding: 1.1rem 0 0;
        border-top: 1px solid var(--c-border-light);
        color: var(--c-primary);
        font-family: var(--font-mono);
        font-size: 0.88rem;
        flex-wrap: wrap;
    }

    .terminal-footer .copyright {
        color: var(--c-text-muted);
        font-size: 0.78rem;
    }

    .terminal-footer span i {
        display: inline-block;
        width: 0.55rem;
        height: 1rem;
        margin-left: 0.25rem;
        background: var(--c-primary);
        vertical-align: -0.15rem;
    }

    .terminal-footer nav {
        display: flex;
        gap: 2rem;
        flex-wrap: wrap;
    }

    .terminal-footer a {
        color: var(--c-primary);
        font-family: var(--font-mono);
        font-size: 0.86rem;
        font-weight: 700;
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
