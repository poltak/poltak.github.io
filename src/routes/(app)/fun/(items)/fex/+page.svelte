<script lang="ts">
    const APP_URL = 'https://poltak.github.io/fex/'
    const REPO_URL = 'https://github.com/poltak/fex'
</script>

<section class="terminal-panel">
    <div class="actions">
        <a class="primary" href={APP_URL} target="_blank" rel="noopener noreferrer">Open Fex ↗</a>
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer">Source code on GitHub ↗</a>
    </div>

    <p>
        Fex shows a list of currencies. Edit the amount on any currency and all the others update.
        You can add currencies, change their order, and open a history chart for a pair.
    </p>
</section>

<section class="terminal-panel">
    <h2>Why?</h2>

    <p>
        I often deal with lots of different currencies from living in/travelling to different countries.
        I often have (subconsciously) built frames of reference in certain currencies after spending significant time dealing with them.
        So when it comes time to pay for something I like to see what the value of that thing is in other currencies.
        I also like to look at historical rates when it comes time to convert from one currency to another, to get an idea of how good the current rate is relatively.
    </p>

    <p>
        For years I used the XE app for this. However it has turned to shit in recent years.
        From taking 5+ seconds to load (and not properly remaining in memory so initial load happens every single time you go back to the app), to only working when online, to significant touch lag leading to constant mistouches, to a new rebuilt version with a horrible UI.
    </p>
</section>

<section class="terminal-panel">
    <h2>How it works</h2>

    <ul>
        <li>Plain HTML, CSS, and JavaScript on GitHub Pages. No account and no app server.</li>
        <li>
            Rates come from <a
                href="https://frankfurter.dev/"
                target="_blank"
                rel="noopener noreferrer">Frankfurter</a
            >. A request has a currency pair and dates, never the amount you typed.
        </li>
        <li>You can install it as an app (it's a PWA). After one online visit, saved rates work offline.</li>
        <li>Your currency list and the saved rates stay in your browser.</li>
    </ul>
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

    .terminal-panel p:last-child,
    .terminal-panel ul:last-child {
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
