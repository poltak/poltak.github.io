<script lang="ts">
    const APP_URL = 'https://calocount-app.hoian-embroidery.workers.dev/'
    const REPO_URL = 'https://github.com/poltak/calocount'
</script>

<section class="terminal-panel">
    <div class="actions">
        <a class="primary" href={APP_URL} target="_blank" rel="noopener noreferrer">
            Open the public dashboard ↗
        </a>
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer">Source code on GitHub ↗</a>
    </div>

    <p>
        I track everything I eat in Calocount, and the dashboard is public. Anyone can see my meals
        for today and the last 30 days, with macros and other nutrient breakdowns.
    </p>

    <p>
        I calculate meals using ChatGPT and it logs the meal for me through an MCP server for the app.
    </p>
</section>

<section class="terminal-panel">
    <h2>Free to host</h2>

    <p>It is made to run at no cost on Cloudflare's free tier:</p>

    <ul>
        <li>One Worker serves the dashboard and the API.</li>
        <li>D1 stores the meals, and R2 stores the meal photos.</li>
        <li>A Cron Trigger removes old shared photos every hour.</li>
        <li>Cloudflare Access protects the owner dashboard.</li>
    </ul>

    <p>
        The <a href={REPO_URL} target="_blank" rel="noopener noreferrer">source code</a> is on GitHub
        if you want to run your own copy.
    </p>
</section>

<style>
    .terminal-panel {
        border: 1px solid var(--c-border);
        padding: 1.25rem;
        margin-bottom: 1.25rem;
    }

    .terminal-panel p,
    .terminal-panel li {
        max-width: var(--measure);
    }

    .terminal-panel p:last-child {
        margin-bottom: 0;
    }

    .terminal-panel ul {
        padding-left: 1.25rem;
    }

    .terminal-panel li::marker {
        color: var(--c-primary);
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-bottom: 1.25rem;
    }

    .actions a {
        border: 1px solid var(--c-border);
        color: var(--c-primary);
        font-weight: 800;
        letter-spacing: 0.08em;
        padding: 0.65rem 0.95rem;
        text-decoration: none;
        text-transform: uppercase;
    }

    .actions a.primary {
        background: var(--c-primary-light);
    }

    .actions a:hover {
        border-color: var(--c-primary);
        text-decoration: none;
    }
</style>
