<script lang="ts">
    import { base } from '$app/paths'
</script>

<div class="main-content">
    <h1>Playground</h1>

    <p class="playground-container">
        This is my playground for experimenting and showcasing new ideas.
    </p>

    <ul class="playground-list">
        <li>
            <a class="playground-link" href="{base}/speed-reader">Speed Reader</a>
            <p class="playground-description">
                A simple speed reader that allows you to read ePUBs at different speeds.
            </p>
        </li>
    </ul>
</div>

<style>
    .playground-container {
        margin-bottom: 2rem;
    }

    .playground-link {
        color: var(--link-color);
    }

    .playground-description {
        color: var(--text-color);
    }
</style>
