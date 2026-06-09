<section class="terminal-page about-page">
    <header class="terminal-hero">
        <p class="terminal-prompt">&gt;_</p>
        <h1>About me</h1>
        <p class="terminal-index">01 / Intro</p>
    </header>

    <div class="terminal-copy">
        <p class="lead">Hi! I’m Jon.</p>

        <p>
            This website exists to put a part of myself out into the greater world.
            I'm usually very reclusive but am trying to balance that out a bit.
            I am an Australian who's been residing long-term in Viet Nam.
            I grew up on the English-speaking parts of the Internet and have made most of my
            living there as well.
        </p>

        <p>
            Video games brought me towards computers when I was young. I liked tinkering and
            figuring how to change software, like games, to suit my own tastes. I starting mainly messing
            around with configs for games like DOOM 3 and Morrowind. Once I discovered modding communities
            online, it became a full time obsession. When I grew up I learnt how to write my own software,
            which is one of the main things I still do now.
        </p>

        <p>
            One of the main pieces of software I have helped bring into the world is <a href="https://memex.garden">Memex</a>:
            A tool for people (and AI agents) who love learning on the Internet. It affords powerful ways to organize your
            own research and collaborate with others on their own research interests.
        </p>

        <p>
            I like nerding out about lower-level software and how things work closer to the hardware level. Unfortunately I
            don't get to do much of this in the web-software world, but I'd like to get back there as it was much more
            compelling. I discovered this passion through, old game system emulators, The C Programming Language (K&R book), and learning MIPS assembly in uni.
        </p>

        <p>
            Outside of computers I've been gotten a lot of enjoyment out of learning human languages. The main ones
            I've made progress in throughout the last few years have been Indonesian and Vietnamese. They're forever
            journeys that I struggle with everyday, though I've made enough progress with both that I can have conversations
            with most people and (mostly) express what I want to say. Vietnamese was crazy hard, though I've made more
            progress with that as I live there and have invested more time into it. Mandarin Chinese is another
            language that I made a nice amount of progress in, studying it in uni in Australia and Taiwan, however
            I've let stagnate over the years. I'd like to get back into it (much like lower level programming!).
        </p>

        <p>
            A bunch of my other interests:
        </p>

        <ul>
            <li>Ways to improve communication between people (and even other animals!)</li>
            <li>Ways to live more self-sufficiently, being able to decouple from greater global society.</li>
            <li>Ways to use our time more efficiently. I'm not crazy about the idea of being "busy" all the time, but it is cool when I learn a new trick to save time.</li>
            <li>How to deal with all the noise from internal inputs. e.g. thoughts, emotions, feelings, etc.</li>
            <li>How to "quantify" the value experiences bring and make better choices in regard to them.</li>
            <li>How to better participate in the greater economy, and balancing that participation with my own interests that are often not aligned.</li>
            <li>How to harness my attention in more ways to benefit myself and others.</li>
            <li>How the world works in general. I'm constantly figuring out new parts of it.</li>
        </ul>

        <p>
            On this site you'll find a mix of <a href="/fun">experiments and mini-projects</a> and my <a href="/cv">CV</a>. I also maintain my personal
            <a href="/fun/kindle-highlights-viewer?source=site">Kindle highlights</a>, a growing
            archive of passages I thought were interesting in books I read over the years.
        </p>
    </div>

    <aside class="terminal-callout">
        <span class="callout-icon">△</span>
        <p>
            I'm always down for making human connections, and discussing potential collaborations and ideas.
            Feel free to <a href="/contact">reach out</a>!
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
        text-align: justify;
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
