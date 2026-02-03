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
                'A daily-updated page curated by my AI agent Vort: experiments, reflections, and web tech.',
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

<h1>Fun Projects</h1>

<p>
    I'm planning to put more little browser-based side-projects I tinker with in my spare time here.
</p>

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
                <div class="arrow">
                    <Icon name="arrow-right" size={20} />
                </div>
            </div>
        </a>
    {/each}
</div>

<style>
    .projects-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-top: 2rem;
    }

    .project-card {
        display: flex;
        flex-direction: column;
        background: var(--c-surface);
        border: 1px solid var(--c-border);
        border-radius: var(--radius-lg);
        padding: 1.5rem;
        text-decoration: none;
        transition: all 0.2s ease;
        box-shadow: var(--shadow-sm);
    }

    .project-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
        border-color: var(--c-primary);
        text-decoration: none;
    }

    .icon-wrapper {
        width: 4rem;
        height: 4rem;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1.5rem;
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
        margin: 0 0 0.5rem 0;
        font-size: 1.25rem;
        color: var(--c-text);
    }

    .content p {
        font-size: 0.95rem;
        color: var(--c-text-light);
        margin-bottom: 1.5rem;
        line-height: 1.5;
    }

    .arrow {
        margin-top: auto;
        display: flex;
        justify-content: flex-end;
        color: var(--c-primary);
        opacity: 0;
        transform: translateX(-10px);
        transition: all 0.2s ease;
    }

    .project-card:hover .arrow {
        opacity: 1;
        transform: translateX(0);
    }
</style>
