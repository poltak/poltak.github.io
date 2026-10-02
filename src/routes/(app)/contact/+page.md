---
---

<svelte:head>
<title>Contact · Jon Samosir</title>
</svelte:head>

<section class="terminal-page contact-page">
    <header class="terminal-hero">
        <p class="terminal-prompt">&gt;_</p>
        <h1>Contact me</h1>
        <p class="terminal-index">03 / Contact</p>
    </header>

    <div class="contact-copy">
        <p>My preferred contact method is via email.</p>
        <p><a class="email-link" href="mailto:jonathan.samosir@gmail.com">jonathan.samosir@gmail.com</a></p>

        <p>You can also find me at:</p>
        <ul>
            <li>GitHub: <a href="https://github.com/poltak">poltak</a></li>
            <li>LinkedIn: <a href="https://www.linkedin.com/in/jsamosir/">jsamosir</a></li>
            <li>Twitter/X: <a href="https://x.com/poltak_">poltak_</a></li>
            <li>Goodreads: <a href="https://goodreads.com/poltak">poltak</a></li>
        </ul>
    </div>

    <aside class="terminal-callout">
        <span class="callout-icon">△</span>
        <div>
            <h2>Let’s make something cool.</h2>
            <p>
                I’m always open to interesting conversations, collaborations, or just talking about ideas.
            </p>
        </div>
    </aside>

</section>

<style>
    .contact-copy {
        display: grid;
        gap: 1.35rem;
        max-width: var(--measure);
    }

    .contact-copy p,
    .contact-copy li {
        color: var(--c-text-light);
        font-size: 1.05rem;
        line-height: 1.75;
        margin: 0;
        max-width: none;
    }

    .contact-copy ul {
        display: grid;
        gap: 0.6rem;
        margin: 0;
        padding-left: 1.4rem;
    }

    .contact-copy li::marker {
        color: var(--c-primary);
    }

    .email-link {
        font-size: 1.18rem;
        overflow-wrap: anywhere;
    }

    .terminal-callout h2 {
        color: var(--c-text);
        font-size: 1.15rem;
        font-weight: 800;
        margin: 0 0 0.45rem;
    }
</style>
