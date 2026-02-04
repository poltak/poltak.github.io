<script lang="ts">
    import { parseClippings, type NormalizedClipping } from 'kindle-highlights-parser'
    import { onMount } from 'svelte'

    type GroupBy = 'title' | 'author'

    let normalized: NormalizedClipping[] = []
    let errorMessage = ''
    let statusMessage = ''
    let sourceFileName = ''
    let fileInput: HTMLInputElement | null = null
    let isSaving = false
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

    function openDatabase(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            if (typeof indexedDB === 'undefined') {
                reject(new Error('IndexedDB is not available in this browser.'))
                return
            }

            const request = indexedDB.open('kindle-clippings-viewer', 1)
            request.onupgradeneeded = () => {
                const db = request.result
                if (!db.objectStoreNames.contains('files')) {
                    db.createObjectStore('files')
                }
            }
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(request.error ?? new Error('Unable to open IndexedDB.'))
        })
    }

    async function loadSavedClippings() {
        try {
            const db = await openDatabase()
            const tx = db.transaction('files', 'readonly')
            const store = tx.objectStore('files')
            const request = store.get('default')
            const saved = await new Promise<{
                normalized: NormalizedClipping[]
                sourceFileName: string
            } | null>((resolve, reject) => {
                request.onsuccess = () => resolve(request.result ?? null)
                request.onerror = () =>
                    reject(request.error ?? new Error('Unable to read saved data.'))
            })
            if (saved?.normalized?.length) {
                normalized = saved.normalized
                sourceFileName = saved.sourceFileName ?? ''
                statusMessage = 'Loaded saved clippings from this browser.'
            }
            db.close()
        } catch (error) {
            statusMessage =
                error instanceof Error ? error.message : 'Unable to load saved clippings.'
        }
    }

    async function saveToIndexedDb() {
        if (!normalized.length) return
        isSaving = true
        statusMessage = ''
        try {
            const db = await openDatabase()
            const tx = db.transaction('files', 'readwrite')
            const store = tx.objectStore('files')
            store.put({ normalized, sourceFileName, savedAt: new Date().toISOString() }, 'default')
            await new Promise<void>((resolve, reject) => {
                tx.oncomplete = () => resolve()
                tx.onerror = () => reject(tx.error ?? new Error('Unable to save clippings.'))
                tx.onabort = () => reject(tx.error ?? new Error('Unable to save clippings.'))
            })
            statusMessage = 'Saved clippings to this browser.'
            db.close()
        } catch (error) {
            statusMessage = error instanceof Error ? error.message : 'Unable to save clippings.'
        } finally {
            isSaving = false
        }
    }

    async function clearSavedClippings() {
        if (typeof window !== 'undefined') {
            const ok = window.confirm(
                'Clear saved clippings from this browser and reset the current view? This cannot be undone.',
            )
            if (!ok) return
        }
        normalized = []
        sourceFileName = ''
        selectedGroup = ''
        pageIndex = 0
        statusMessage = ''
        try {
            const db = await openDatabase()
            const tx = db.transaction('files', 'readwrite')
            const store = tx.objectStore('files')
            store.delete('default')
            await new Promise<void>((resolve, reject) => {
                tx.oncomplete = () => resolve()
                tx.onerror = () => reject(tx.error ?? new Error('Unable to clear saved clippings.'))
                tx.onabort = () => reject(tx.error ?? new Error('Unable to clear saved clippings.'))
            })
            statusMessage = 'Cleared saved clippings from this browser.'
            db.close()
        } catch (error) {
            statusMessage =
                error instanceof Error ? error.message : 'Unable to clear saved clippings.'
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

    onMount(() => {
        loadSavedClippings()
    })
</script>

<svelte:head>
    <title>Kindle Clippings Viewer</title>
</svelte:head>

<p class="note">
    Upload your Kindle clippings and browse by book or author. Everything stays local in your
    browser.
</p>

<section class="card upload-card">
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
    {#if statusMessage}
        <p class="status">{statusMessage}</p>
    {/if}
</section>

<section class="card viewer-card">
    <div class="viewer-actions">
        <div class="action-card">
            <button
                type="button"
                class="ghost"
                on:click={saveToIndexedDb}
                disabled={!normalized.length || isSaving}
            >
                {isSaving ? 'Saving...' : 'Save'}
            </button>
            <p class="action-help">
                Stores your parsed clippings in this browser so they load automatically next time.
            </p>
        </div>
        <div class="action-card">
            <button type="button" class="ghost" on:click={clearSavedClippings}>
                Clear saved data
            </button>
            <p class="action-help">
                Removes the saved copy from this browser only. It does not change your file.
            </p>
        </div>
    </div>

    <div class="viewer-controls">
        <label class="field">
            <span>Group by</span>
            <select bind:value={groupBy} disabled={!normalized.length}>
                <option value="title">Book title</option>
                <option value="author">Author</option>
            </select>
        </label>
        <label class="field">
            <span>{groupBy === 'author' ? 'Author' : 'Book'}</span>
            <select bind:value={selectedGroup} disabled={!normalized.length}>
                {#each grouped as group (group.key)}
                    <option value={group.key}>{group.key} ({group.items.length})</option>
                {/each}
            </select>
        </label>
        <label class="field">
            <span>Per page</span>
            <select
                on:change={(event) => (pageSize = Number(event.currentTarget.value))}
                disabled={!normalized.length}
            >
                <option value="25" selected={pageSize === 25}>25</option>
                <option value="50" selected={pageSize === 50}>50</option>
                <option value="100" selected={pageSize === 100}>100</option>
            </select>
        </label>
        <div class="pager">
            <button
                type="button"
                on:click={() => (pageIndex = Math.max(0, pageIndex - 1))}
                disabled={!normalized.length || pageIndex === 0}
            >
                Previous
            </button>
            <span>Page {pageIndex + 1} of {totalPages}</span>
            <button
                type="button"
                on:click={() => (pageIndex = Math.min(totalPages - 1, pageIndex + 1))}
                disabled={!normalized.length || pageIndex >= totalPages - 1}
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
        box-sizing: border-box;
    }

    .upload-card,
    .viewer-card {
        max-width: 1000px;
        width: 100%;
        margin-left: auto;
        margin-right: auto;
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

    .status {
        margin-top: 1rem;
        color: var(--c-success);
        font-weight: 600;
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

    .viewer-actions {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        margin-bottom: 1.5rem;
    }

    .action-card {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        border-radius: var(--radius-md);
        border: 1px solid var(--c-border);
        background: var(--c-bg-subtle);
    }

    .action-help {
        margin: 0;
        color: var(--c-text-muted);
        font-size: 0.9rem;
        line-height: 1.4;
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
        min-width: 0;
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
        width: 100%;
        max-width: 100%;
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
        grid-template-columns: 1fr;
    }

    .viewer-item {
        padding: 1rem;
        border-radius: var(--radius-md);
        border: 1px solid var(--c-border);
        background: var(--c-bg-subtle);
        width: 100%;
        box-sizing: border-box;
        overflow: hidden;
    }

    .viewer-content {
        margin: 0 0 0.75rem 0;
        font-size: 1rem;
        overflow-wrap: anywhere;
        word-break: break-word;
    }

    .viewer-meta {
        color: var(--c-text-muted);
        font-size: 0.85rem;
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        overflow-wrap: anywhere;
        word-break: break-word;
        max-width: 100%;
    }

    @media (max-width: 720px) {
        .viewer-controls {
            grid-template-columns: 1fr;
        }

        .upload-card,
        .viewer-card {
            padding: 1.25rem;
        }

        .viewer-item {
            padding: 0.9rem;
        }
    }

    @media (max-width: 600px) {
        .viewer-actions {
            grid-template-columns: 1fr;
        }
    }
</style>
