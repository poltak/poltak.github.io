<script lang="ts">
    import '../app.css'
    import { base } from '$app/paths'
    import { onMount } from 'svelte'
    import Icon from '$lib/components/icons/Icon.svelte'

    let darkMode = $state(true)
    let { children } = $props()

    onMount(() => {
        // Check for saved theme preference or system preference
        const savedTheme = localStorage.getItem('theme')
        if (
            savedTheme === 'dark' ||
            (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
        ) {
            darkMode = true
            document.documentElement.classList.add('dark')
        } else {
            darkMode = false
            document.documentElement.classList.remove('dark')
        }
    })

    function toggleTheme() {
        darkMode = !darkMode
        localStorage.setItem('theme', darkMode ? 'dark' : 'light')
        document.documentElement.classList.toggle('dark')
    }
</script>

<div class="nav-area nav-split">
    <button class="theme-toggle" onclick={toggleTheme} aria-label="Toggle theme">
        {#if darkMode}
            <Icon name="moon" />
        {:else}
            <Icon name="sun" />
        {/if}
    </button>
    <nav class="nav-bar">
        <a class="nav-link" href="{base}/">About</a>
        <a class="nav-link" href="{base}/cv">Résumé</a>
        <a class="nav-link" href="{base}/contact">Contact</a>
    </nav>
    <!-- <div class="nav-split"></div> -->
</div>

<div class="content-area">
    {@render children?.()}
</div>

<style>
    .nav-area {
        display: flex;
        justify-content: flex-end;
        grid-column: padding-left / split;
        grid-row: content-top / content-bottom;
        padding-right: 2.5rem;
        position: sticky;
        top: 0;

        @media screen and (max-width: 768px) {
            position: static;
            padding-right: 0;
            padding-bottom: 1rem;
        }
    }

    .content-area {
        grid-column: split / padding-right;
        grid-row: content-top / content-bottom;
        padding: 2rem 5rem;

        @media screen and (max-width: 768px) {
            padding: 2rem 1rem;
        }

        @media screen and (max-width: 1024px) {
            padding: 2rem 2rem;
        }
    }

    .nav-split {
        border-right: 1px solid var(--border-color);
        height: fit-content;

        @media screen and (max-width: 768px) {
            border-bottom: 1px solid var(--border-color);
            border-right: none;
        }
    }

    .nav-bar {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-end;
        padding-top: 2rem;
        width: max-content;
        min-height: 21vh;

        @media screen and (max-width: 768px) {
            flex-direction: row;
            justify-content: center;
            align-items: center;
            width: 100%;
            padding-top: 1rem;
            gap: 1rem;
            min-height: unset;
        }
    }

    .nav-link {
        text-align: right;
        margin: 0.4rem 0;
        padding: 0.6rem 1rem;
        text-decoration: none;
        color: var(--text-color);
        transition: color 0.2s ease;

        &:hover {
            text-decoration: underline;
            color: #666;
        }

        @media screen and (max-width: 768px) {
            margin: 0;
        }
    }

    .theme-toggle {
        position: fixed;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 50%;
        transition: all 0.2s ease;
        color: var(--text-color);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .theme-toggle:hover {
        background-color: var(--hover-bg);
        transform: rotate(12deg);
    }

    :global(.dark) {
        --text-color: #fff;
        --bg-color: #1a1a1a;
        --hover-bg: rgba(255, 255, 255, 0.1);
        --border-color: #444;
    }

    :global(body) {
        background-color: var(--bg-color);
        color: var(--text-color);
    }
</style>
