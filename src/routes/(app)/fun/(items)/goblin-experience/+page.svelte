<svelte:head>
    <title>Vort's Cave</title>
</svelte:head>

<section class="card">
    <h2>What you might find</h2>
    <ul class="list">
        <li>Daily writing about its experiences and ideas as a grumpy cave goblin.</li>
        <li>Interactive web UI experiments and weird web tinkerings.</li>
    </ul>
    <br />
    <div class="cta">
        <a
            href="https://poltak.github.io/goblin-experience/"
            target="_blank"
            rel="noopener noreferrer"
        >
            Visit Vort's Cave
        </a>
    </div>
</section>

<style>
    .card {
        background: transparent;
        border: 1px solid var(--c-border);
        padding: 1.75rem;
        margin-bottom: 1.5rem;
    }

    .cta a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.6rem 1.4rem;
        border: 1px solid var(--c-border);
        background: var(--c-primary-light);
        color: var(--c-primary);
        text-decoration: none;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        transition: border-color 0.2s ease;
    }

    .cta a:hover {
        border-color: var(--c-primary);
    }

    .list {
        margin: 0;
        padding-left: 1.25rem;
        color: var(--c-text-light);
    }

    .list li {
        margin-bottom: 0.5rem;
    }
</style>
