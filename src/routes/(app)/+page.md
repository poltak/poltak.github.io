<section class="terminal-page about-page">
    <header class="terminal-hero">
        <p class="terminal-prompt">&gt;_</p>
        <h1>About me</h1>
        <p class="terminal-index">01 / Intro</p>
    </header>

    <div class="terminal-copy">
        <p class="lead">Hi! I’m Jon.</p>

        <p>
            I’ve been hooked on computers and software since I was a kid, starting with a classic
            obsession: video games. I caught the bug at 12 when I realized I could tweak Doom 3
            configs to bend the game to my will. That spark turned into a lifelong habit of
            breaking, fixing, and over-optimizing everything I touched.
        </p>

        <p>
            I became the go-to tech support for anyone within earshot, mastering Windows XP admin
            tasks before eventually falling down the Linux rabbit hole. I’ve spent countless hours
            installing and tinkering with distros on every piece of hardware I could get my hands on.
        </p>

        <p>
            Fast forward to today, and I’ve spent over a decade as a professional remote software
            developer. Software isn’t just a career for me; it’s a craft I’m still obsessed with.
            I’m constantly evolving, tinkering, and remolding myself to work with different
            technologies and constraints.
        </p>

        <p>
            You’ll find a mix of <a href="/fun">experiments and mini-projects</a> here: small ideas,
            tools, and curiosities I build for fun and to learn. I also maintain my personal
            <a href="/fun/kindle-highlights-viewer?source=site">Kindle highlights</a>, a growing
            archive of thoughts and insights collected over the years.
        </p>
    </div>

    <aside class="terminal-callout">
        <span class="callout-icon">△</span>
        <p>
            I’m always up for interesting conversations, collaborations, or just geeking out about
            tech. Feel free to <a href="/contact">reach out</a>!
        </p>
    </aside>
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

    .terminal-copy {
        display: grid;
        gap: 1.35rem;
        max-width: 86ch;
    }

    .terminal-copy p {
        color: var(--c-text-light);
        font-size: 1.05rem;
        line-height: 1.75;
        margin: 0;
    }

    .terminal-copy .lead {
        color: var(--c-primary);
        font-size: 1.18rem;
        font-weight: 800;
    }

    .terminal-copy a,
    .terminal-callout a {
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

    .terminal-callout p {
        color: var(--c-text);
        line-height: 1.65;
        margin: 0;
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
