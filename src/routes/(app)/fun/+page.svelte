<script lang="ts">
    import { base } from '$app/paths'
    import Icon from '$lib/components/icons/Icon.svelte'
    import type { IconName } from '$lib/components/icons/types'
    import goblinIcon from '$lib/assets/goblin-128.png'

    type Project = {
        title: string
        description: string
        link: string
        color: string
    } & ({ icon: IconName } | { image: string })

    function isImageUrl(value: string): boolean {
        return (
            value.startsWith('data:') ||
            value.startsWith('http://') ||
            value.startsWith('https://') ||
            value.includes('/')
        )
    }

    const projects: Project[] = [
        {
            title: 'Speed Reader',
            description: 'A local-only, free EPUB speed reader.',
            icon: 'book',
            link: `${base}/fun/speed-reader`,
            color: 'var(--c-primary)',
        },
        {
            title: "Vort's Cave",
            description:
                'A page updated daily 100% by my OpenClaw AI agent, Vort: experiments and reflections from the cave.',
            image: '👹',
            link: `${base}/fun/goblin-experience`,
            color: 'var(--c-primary-gradient-to)',
        },
        {
            title: 'Kindle Clippings Converter',
            description:
                'Upload your Kindle \"My Clippings.txt\" and export highlights as CSV or JSON.',
            icon: 'file-text',
            link: `${base}/fun/kindle-highlights`,
            color: 'var(--c-primary-dark)',
        },
        {
            title: 'Kindle Clippings Viewer',
            description: 'Browse highlights by book or author with pagination.',
            image: '📓',
            link: `${base}/fun/kindle-highlights-viewer`,
            color: 'var(--c-primary)',
        },
        {
            title: 'Maze Generator',
            description:
                'A visual maze generator using various algorithms. I want to use this as a starting point for some simple browser-baesd games.',
            icon: 'maximize', // Using maximize as a placeholder for a grid-like icon
            link: `${base}/fun/maze-generator`,
            color: 'var(--c-accent)',
        },
        {
            title: 'Timestamp Goblin',
            description:
                'A simple Chrome extension that persists and auto-restores the progress of YouTube videos.',
            image: goblinIcon,
            link: `${base}/fun/timestamp-goblin`,
            color: 'var(--c-danger)',
        },
    ]
</script>

<section class="fun-intro">
    <header class="terminal-hero">
        <p class="terminal-prompt">&gt;_</p>
        <h1>Fun Projects</h1>
        <p class="terminal-index">04 / Experiments</p>
    </header>

    <h1>Fun Projects</h1>

    <p>
        I have tinkered with small, browser-based side projects in my spare time. These are
        <strong>experiments</strong>, utilities, and ideas I build for fun and to learn.
    </p>
</section>

<div class="projects-grid">
    {#each projects as project (project.title)}
        <a href={project.link} class="project-card">
            <div
                class="icon-wrapper"
                style="color: {project.color}; background: {project.color}15; border-color: {project.color}30"
            >
                {#if 'image' in project}
                    {#if isImageUrl(project.image)}
                        <img src={project.image} alt={project.title} class="project-icon-img" />
                    {:else}
                        <span class="project-icon-emoji" aria-hidden="true">
                            {project.image}
                        </span>
                    {/if}
                {:else}
                    <Icon name={project.icon} size={32} />
                {/if}
            </div>
            <div class="content">
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <div class="project-action">
                    <span>View project</span>
                    <Icon name="arrow-right" size={18} />
                </div>
            </div>
        </a>
    {/each}
</div>

<aside class="open-source-note">
    <span>&gt;_</span>
    <p>
        These projects are open source. Check them out on <a href="https://github.com/poltak"
            >GitHub</a
        >.
    </p>
</aside>

<style>
    :global(.content-wrapper:has(.fun-intro)),
    :global(.content-wrapper:has(.fun-intro) *) {
        font-family: var(--font-mono);
    }

    .projects-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
        gap: 1.5rem;
        margin-top: 2rem;
    }

    .fun-intro {
        max-width: 100%;
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

    .fun-intro > h1 {
        display: none;
    }

    .fun-intro > p {
        color: var(--c-text-light);
        font-size: 1.05rem;
        line-height: 1.75;
        max-width: 72ch;
        margin: 0;
    }

    .fun-intro strong {
        color: var(--c-primary);
    }

    .project-card {
        display: flex;
        flex-direction: column;
        min-height: 250px;
        border: 1px solid var(--c-border);
        padding: 1.3rem;
        text-decoration: none;
        transition:
            transform 0.2s ease,
            background 0.2s ease;
    }

    .project-card:hover {
        background: var(--c-primary-light);
        transform: translateY(-2px);
        text-decoration: none;
    }

    .icon-wrapper {
        width: 3.8rem;
        height: 3.8rem;
        border-radius: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1.25rem;
        border: 1px solid;
    }

    .project-icon-img {
        width: 75%;
        height: 75%;
        object-fit: contain;
    }

    .project-icon-emoji {
        font-size: 2rem;
        line-height: 1;
    }

    .content h3 {
        margin: 0 0 0.8rem 0;
        font-size: 1.25rem;
        color: var(--c-primary);
        font-family: var(--font-mono);
        letter-spacing: 0.02em;
    }

    .content p {
        font-size: 0.95rem;
        color: var(--c-text-light);
        margin-bottom: 1.5rem;
        line-height: 1.5;
    }

    .project-action {
        margin-top: auto;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        justify-content: flex-start;
        border-top: 1px dashed var(--c-border-dashed);
        padding-top: 0.8rem;
        color: var(--c-primary);
        font-size: 0.8rem;
        font-weight: 800;
        text-transform: uppercase;
        transition: all 0.2s ease;
    }

    .project-card:hover .project-action {
        transform: translateX(4px);
    }

    .open-source-note {
        display: grid;
        grid-template-columns: 3.6rem 1fr;
        gap: 1.2rem;
        align-items: center;
        margin-top: 1.5rem;
        padding: 1rem 1.25rem;
        border: 1px dashed var(--c-border-dashed);
    }

    .open-source-note span {
        display: grid;
        place-items: center;
        width: 3rem;
        height: 3rem;
        border: 1px solid var(--c-border);
        color: var(--c-primary);
        font-weight: 800;
    }

    .open-source-note p {
        color: var(--c-text-light);
        line-height: 1.6;
        margin: 0;
    }

    .open-source-note a {
        color: var(--c-primary);
    }

    @media (max-width: 768px) {
        .terminal-hero {
            grid-template-columns: 1fr;
            gap: 0.5rem;
        }

        .open-source-note {
            grid-template-columns: 1fr;
        }
    }
</style>
