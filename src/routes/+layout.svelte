<script lang="ts">
    import '../app.css'
    import { base } from '$app/paths'

    let { children } = $props()
</script>

<div class="nav-area nav-split">
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
        max-width: 720px;

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

    :global(body) {
        background-color: var(--bg-color);
        color: var(--text-color);
    }
</style>
