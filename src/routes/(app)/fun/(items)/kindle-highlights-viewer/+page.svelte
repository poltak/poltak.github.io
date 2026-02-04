<script lang="ts">
    import { parseClippings, type NormalizedClipping } from 'kindle-highlights-parser'

    type GroupBy = 'title' | 'author'

    let normalized: NormalizedClipping[] = []
    let errorMessage = ''
    let statusMessage = ''
    let sourceFileName = ''
    let fileInput: HTMLInputElement | null = null
    let groupBy: GroupBy = 'title'
    let selectedGroup = ''
    let pageIndex = 0
    let pageSize = 25
    let grouped: { key: string; items: NormalizedClipping[] }[] = []
    let selectedItems: NormalizedClipping[] = []
    let totalPages = 1

    async function handleFileUpload(event: Event) {
        const input = event.currentTarget as HTMLInputElement
        const file = input.files?.[0]

        statusMessage = ''
        errorMessage = ''

        if (!file) {
            normalized = []
            sourceFileName = ''
            return
        }

        sourceFileName = file.name

        try {
            const text = await file.text()
            const result = parseClippings(text)
            normalized = result.normalized
            if (normalized.length === 0) {
                errorMessage =
                    'No clippings found. Check that this is a Kindle "My Clippings.txt" file.'
            }
        } catch (error) {
            normalized = []
            errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Something went wrong while parsing the file.'
        }
    }

    function clearAll() {
        normalized = []
        errorMessage = ''
        statusMessage = ''
        sourceFileName = ''
        if (fileInput) {
            fileInput.value = ''
        }
    }

    $: {
        normalized
        groupBy
        const map = new Map<string, NormalizedClipping[]>()
        for (const item of normalized) {
            const key =
                groupBy === 'author'
                    ? item.author?.trim() || 'Unknown Author'
                    : item.title?.trim() || 'Untitled'
            const list = map.get(key)
            if (list) {
                list.push(item)
            } else {
                map.set(key, [item])
            }
        }
        grouped = Array.from(map.entries())
            .map(([key, items]) => ({ key, items }))
            .sort((a, b) => a.key.localeCompare(b.key))

        if (!grouped.find((group) => group.key === selectedGroup)) {
            selectedGroup = grouped[0]?.key ?? ''
        }
        pageIndex = 0
    }

    $: {
        grouped
        selectedGroup
        selectedItems = grouped.find((group) => group.key === selectedGroup)?.items ?? []
        totalPages = Math.max(1, Math.ceil(selectedItems.length / pageSize))
        pageIndex = Math.min(pageIndex, totalPages - 1)
    }
</script>

<svelte:head>
    <title>Kindle Clippings Viewer</title>
</svelte:head>

<p class="note">
    Upload your Kindle clippings and browse by book or author. Everything stays local in your
    browser.
</p>

<section class="card">
    <h2>1. Upload your file</h2>
    <div class="upload-panel">
        <label class="file-input" for="clippings">
            <input
                id="clippings"
                type="file"
                accept=".txt"
                on:change={handleFileUpload}
                bind:this={fileInput}
            />
            <span>Choose &quot;My Clippings.txt&quot;</span>
        </label>
        {#if sourceFileName}
            <p class="file-name">Selected: {sourceFileName}</p>
        {/if}
        <p class="hint">Your file never leaves the browser. Everything stays local.</p>
    </div>
    {#if errorMessage}
        <div class="alert">{errorMessage}</div>
    {/if}
</section>

<section class="card">
    <div class="viewer-header">
        <div>
            <h2>2. Browse highlights</h2>
            <p class="viewer-subtitle">
                {selectedItems.length} items in {selectedGroup || '—'}
            </p>
        </div>
        <button type="button" class="ghost" on:click={clearAll} disabled={!normalized.length}>
            Reset
        </button>
    </div>

    <div class="viewer-controls">
        <label class="field">
            <span>Group by</span>
            <select bind:value={groupBy}>
                <option value="title">Book title</option>
                <option value="author">Author</option>
            </select>
        </label>
        <label class="field">
            <span>{groupBy === 'author' ? 'Author' : 'Book'}</span>
            <select bind:value={selectedGroup}>
                {#each grouped as group (group.key)}
                    <option value={group.key}>{group.key} ({group.items.length})</option>
                {/each}
            </select>
        </label>
        <label class="field">
            <span>Per page</span>
            <select on:change={(event) => (pageSize = Number(event.currentTarget.value))}>
                <option value="25" selected={pageSize === 25}>25</option>
                <option value="50" selected={pageSize === 50}>50</option>
                <option value="100" selected={pageSize === 100}>100</option>
            </select>
        </label>
        <div class="pager">
            <button
                type="button"
                on:click={() => (pageIndex = Math.max(0, pageIndex - 1))}
                disabled={pageIndex === 0}
            >
                Previous
            </button>
            <span>Page {pageIndex + 1} of {totalPages}</span>
            <button
                type="button"
                on:click={() => (pageIndex = Math.min(totalPages - 1, pageIndex + 1))}
                disabled={pageIndex >= totalPages - 1}
            >
                Next
            </button>
        </div>
    </div>

    <div class="viewer-list">
        {#each selectedItems.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize) as item (item.sourceIndex)}
            <article class="viewer-item">
                <p class="viewer-content">{item.content || '—'}</p>
                <div class="viewer-meta">
                    <span>{item.title}</span>
                    {#if item.author}
                        <span>· {item.author}</span>
                    {/if}
                    {#if item.type}
                        <span>· {item.type}</span>
                    {/if}
                    {#if item.addedOn}
                        <span>· {new Date(item.addedOn).toLocaleDateString()}</span>
                    {/if}
                    {#if item.locationStart}
                        <span>· Loc {item.locationStart}</span>
                    {/if}
                </div>
            </article>
        {/each}
    </div>
</section>

<style>
    :global(body) {
        background: radial-gradient(circle at top, rgba(59, 130, 246, 0.08), transparent 45%),
            var(--c-bg);
    }

    .note {
        margin: 0 0 1.5rem 0;
        color: var(--c-text-muted);
        font-size: 0.95rem;
    }

    .card {
        background: var(--c-surface);
        border-radius: var(--radius-lg);
        border: 1px solid var(--c-border);
        padding: 1.75rem;
        margin-bottom: 1.5rem;
        box-shadow: var(--shadow-sm);
    }

    .upload-panel {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .file-input {
        border: 1px dashed var(--c-border-dashed);
        border-radius: var(--radius-md);
        padding: 1rem;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        font-weight: 600;
        color: var(--c-primary-dark);
        background: var(--c-primary-light);
        transition:
            border-color 0.2s ease,
            transform 0.2s ease;
    }

    .file-input:hover {
        border-color: var(--c-primary);
        transform: translateY(-1px);
    }

    .file-input input {
        display: none;
    }

    .file-name {
        color: var(--c-text-light);
        font-size: 0.95rem;
    }

    .hint {
        font-size: 0.9rem;
        color: var(--c-text-muted);
    }

    .alert {
        margin-top: 1rem;
        padding: 0.75rem 1rem;
        background: var(--c-danger-bg);
        border: 1px solid var(--c-danger-border);
        color: var(--c-danger);
        border-radius: var(--radius-md);
    }

    .ghost {
        border: 1px solid var(--c-border);
        background: transparent;
        border-radius: var(--radius-full);
        padding: 0.45rem 1.1rem;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.95rem;
        line-height: 1;
        color: var(--c-text-light);
    }

    .ghost:hover {
        border-color: var(--c-primary);
        color: var(--c-primary-dark);
    }

    .viewer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
        margin-bottom: 1.25rem;
    }

    .viewer-subtitle {
        margin: 0.25rem 0 0;
        color: var(--c-text-light);
    }

    .viewer-controls {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        margin-bottom: 1.5rem;
    }

    .field {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        font-weight: 600;
        color: var(--c-text-light);
    }

    .field span {
        font-size: 0.8rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    select {
        border-radius: var(--radius-md);
        border: 1px solid var(--c-border);
        padding: 0.5rem 0.75rem;
        font-size: 0.95rem;
        background: var(--c-bg-input);
        color: var(--c-text);
    }

    .pager {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
    }

    .pager button {
        border: 1px solid var(--c-border);
        background: transparent;
        border-radius: var(--radius-full);
        padding: 0.4rem 1rem;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.95rem;
        line-height: 1;
        color: var(--c-text-light);
    }

    .pager button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .viewer-list {
        display: grid;
        gap: 1rem;
    }

    .viewer-item {
        padding: 1rem;
        border-radius: var(--radius-md);
        border: 1px solid var(--c-border);
        background: var(--c-bg-subtle);
    }

    .viewer-content {
        margin: 0 0 0.75rem 0;
        font-size: 1rem;
    }

    .viewer-meta {
        color: var(--c-text-muted);
        font-size: 0.85rem;
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
    }

    @media (max-width: 720px) {
        .viewer-controls {
            grid-template-columns: 1fr;
        }
    }
</style>
