<script lang="ts">
    import { base } from '$app/paths'
    import Icon from '$lib/components/icons/Icon.svelte'
    import type { IconName } from '$lib/components/icons/types'
    import goblinIcon from '$lib/assets/goblin-128.webp'

    type Project = {
        title: string
        description: string
        link: string
        color: string
        external?: boolean
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
                'A page updated daily 100% by my cave goblin AI agent, Vort: experiments and reflections from the cave.',
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
                'A visual maze generator using various algorithms. I want to use this as a starting point for some simple browser-based games.',
            icon: 'maximize',
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
        {
            title: 'Calocount',
            description:
                'A calorie and nutrition tracker that I log everything I eat in, with a public dashboard. Free to host on Cloudflare.',
            image: '🥗',
            link: `${base}/fun/calocount`,
            color: 'var(--c-accent)',
        },
        {
            title: 'Fex',
            description:
                'A small currency converter with rate history charts. It works offline and needs no account.',
            image: '💱',
            link: `${base}/fun/fex`,
            color: 'var(--c-primary)',
        },
        {
            title: 'Hoi An Embroidery+Craft Workshops',
            description:
                "A simple site I made for my wife's own embroidery and other craft workshops.",
            image: '🧵',
            link: 'https://hoian-embroidery.com',
            color: 'var(--c-primary)',
            external: true,
        },
    ]
</script>

<svelte:head>
    <title>Fun projects · Jon Samosir</title>
</svelte:head>

<section class="fun-intro">
    <header class="terminal-hero">
        <p class="terminal-prompt">&gt;_</p>
        <h1>Fun Projects</h1>
        <p class="terminal-index">04 / Experiments</p>
    </header>

    <p>
        These are misc. browser-based mini projects done in my spare time. These are experiments,
        utilities, and ideas I build for fun, for personal use, and to learn. I'd like to do more of
        these.
    </p>
</section>

<div class="projects-grid">
    {#each projects as project (project.title)}
        <a
            href={project.link}
            class="project-card"
            target={project.external ? '_blank' : undefined}
            rel={project.external ? 'noopener noreferrer' : undefined}
        >
            <div class="icon-wrapper" style:--project-color={project.color}>
                {#if 'image' in project}
                    {#if isImageUrl(project.image)}
                        <!-- The card heading names the project, so the icon is decorative. -->
                        <img
                            src={project.image}
                            alt=""
                            width="128"
                            height="128"
                            decoding="async"
                            class="project-icon-img"
                        />
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
                    {#if project.external}
                        <span>Visit site ↗</span>
                    {:else}
                        <span>View project</span>
                        <Icon name="arrow-right" size={18} />
                    {/if}
                </div>
            </div>
        </a>
    {/each}
</div>

<aside class="open-source-note">
    <span>&gt;_</span>
    <p>
        These projects are all open source. Check them out on <a href="https://github.com/poltak"
            >GitHub</a
        >.
    </p>
</aside>

<style>
    .projects-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
        gap: 1.5rem;
        margin-top: 2rem;
    }

    .fun-intro > p {
        color: var(--c-text-light);
        font-size: 1.05rem;
        line-height: 1.75;
        max-width: var(--measure);
        margin: 0;
    }

    .project-card {
        display: flex;
        flex-direction: column;
        border: 1px solid var(--c-border);
        padding: 1.3rem;
        /* The card is a link, but only its heading and action use the bold link weight. */
        font-weight: 400;
        text-decoration: none;
        transition:
            transform 0.2s ease,
            background 0.2s ease,
            border-color 0.2s ease;
    }

    .project-card:hover {
        background: var(--c-primary-light);
        border-color: var(--c-primary);
        transform: translateY(-2px);
        text-decoration: none;
    }

    /* The content fills the card, so the action row sits on the bottom edge of each card in a row. */
    .content {
        display: flex;
        flex: 1;
        flex-direction: column;
    }

    .icon-wrapper {
        color: var(--project-color);
        background: color-mix(in srgb, var(--project-color) 8%, transparent);
        border: 1px solid color-mix(in srgb, var(--project-color) 45%, transparent);
        width: 3.8rem;
        height: 3.8rem;
        border-radius: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1.25rem;
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
        font-size: 1.2rem;
        line-height: 1.25;
        color: var(--c-primary);
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
    }

    .project-action :global(svg) {
        transition: transform 0.2s ease;
    }

    .project-card:hover .project-action :global(svg) {
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
        .open-source-note {
            grid-template-columns: 1fr;
        }
    }
</style>
