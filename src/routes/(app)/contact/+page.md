---
---

<section class="terminal-page contact-page">
    <header class="terminal-hero">
        <p class="terminal-prompt">&gt;_</p>
        <h1>Contact me</h1>
        <p class="terminal-index">04 / Contact</p>
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
            <h2>Let’s build something cool.</h2>
            <p>
                I’m always open to interesting conversations, collaborations, or just talking about
                tech and ideas.
            </p>
        </div>
    </aside>

    <p class="response-note"><span></span>Usually replying within 1-2 business days.</p>
</section>

<style>
    .terminal-page,
    .terminal-page * {
        font-family: var(--font-mono);
    }

    .terminal-hero {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: baseline;
        gap: 1.5rem;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px dashed var(--c-border-dashed);
    }

    .terminal-prompt,
    .terminal-index {
        color: var(--c-primary);
        font-weight: 800;
        letter-spacing: 0.08em;
        margin: 0;
        text-transform: uppercase;
    }

    .terminal-hero h1 {
        color: var(--c-text);
        font-family: var(--font-sans);
        font-size: clamp(2.75rem, 7vw, 4.25rem);
        font-weight: 400;
        letter-spacing: 0.04em;
        margin: 0;
    }

    .contact-copy {
        display: grid;
        gap: 1.35rem;
        max-width: 70ch;
    }

    .contact-copy p,
    .contact-copy li {
        color: var(--c-text);
        font-size: 1.08rem;
        line-height: 1.75;
        margin: 0;
    }

    .contact-copy ul {
        display: grid;
        gap: 0.6rem;
        margin: 0;
    }

    .contact-copy a,
    .email-link {
        color: var(--c-primary);
    }

    .terminal-callout {
        display: grid;
        grid-template-columns: 4.5rem 1fr;
        gap: 1.35rem;
        align-items: center;
        max-width: 86ch;
        margin-top: 2rem;
        padding: 1.2rem 1.5rem;
        border: 1px dashed var(--c-border-dashed);
    }

    .callout-icon {
        display: grid;
        place-items: center;
        width: 3.6rem;
        height: 3.6rem;
        border: 1px solid var(--c-border);
        color: var(--c-primary);
        font-size: 2rem;
    }

    .terminal-callout h2 {
        color: var(--c-text);
        font-family: var(--font-mono);
        font-size: 1.15rem;
        margin: 0 0 0.45rem;
    }

    .terminal-callout p {
        color: var(--c-text);
        line-height: 1.65;
        margin: 0;
    }

    .response-note {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        max-width: 86ch;
        margin: 1.5rem 0 0;
        padding: 1rem 1.25rem;
        border: 1px solid var(--c-border-light);
        color: var(--c-text);
    }

    .response-note span {
        width: 0.45rem;
        height: 0.45rem;
        border-radius: 50%;
        background: var(--c-primary);
        flex: 0 0 auto;
    }

    @media (max-width: 768px) {
        .terminal-hero {
            grid-template-columns: 1fr;
            gap: 0.5rem;
        }

        .terminal-callout {
            grid-template-columns: 1fr;
        }
    }
</style>
