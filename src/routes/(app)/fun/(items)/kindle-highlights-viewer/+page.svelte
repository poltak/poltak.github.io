<script lang="ts">
    import MiniSearch from 'minisearch'
    import { parseClippings, type NormalizedClipping } from 'kindle-highlights-parser'
    import { onMount } from 'svelte'

    let normalized: NormalizedClipping[] = []
    let errorMessage = ''
    let statusMessage = ''
    let sourceFileName = ''
    let fileInput: HTMLInputElement | null = null
    let isSaving = false
    let isLoadingStatic = false
    let pageIndex = 0
    let pageSize = 25
    let filteredItems: NormalizedClipping[] = []
    let totalPages = 1
    let searchQuery = ''
    let typeFilter: 'all' | 'Highlight' | 'Note' = 'all'
    let titleFilter = 'all'
    let authorFilter = 'all'
    let uniqueTitles: string[] = []
    let uniqueAuthors: string[] = []
    let miniSearch: MiniSearch | null = null
    let idToItem = new Map<string, NormalizedClipping>()
    let highlightTokens: string[] = []

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
            normalized = result.normalized.filter((item) => item.type !== 'Bookmark')
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

    async function loadSiteClippings() {
        isLoadingStatic = true
        statusMessage = ''
        errorMessage = ''
        try {
            const response = await fetch('/My%20Clippings.txt')
            if (!response.ok) {
                throw new Error('Unable to load the site clippings file.')
            }
            const text = await response.text()
            const result = parseClippings(text)
            normalized = result.normalized.filter((item) => item.type !== 'Bookmark')
            sourceFileName = 'Jon\'s "My Clippings.txt"'
            if (normalized.length === 0) {
                errorMessage = 'No clippings found in the site file. Check the uploaded content.'
            }
        } catch (error) {
            normalized = []
            errorMessage =
                error instanceof Error ? error.message : 'Unable to load the site clippings file.'
        } finally {
            isLoadingStatic = false
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
        const titleSet = new Set<string>()
        const authorSet = new Set<string>()
        for (const item of normalized) {
            titleSet.add(item.title?.trim() || 'Untitled')
            authorSet.add(item.author?.trim() || 'Unknown Author')
        }
        uniqueTitles = Array.from(titleSet).sort((a, b) => a.localeCompare(b))
        uniqueAuthors = Array.from(authorSet).sort((a, b) => a.localeCompare(b))
        if (titleFilter !== 'all' && !titleSet.has(titleFilter)) {
            titleFilter = 'all'
        }
        if (authorFilter !== 'all' && !authorSet.has(authorFilter)) {
            authorFilter = 'all'
        }
        if (titleFilter !== 'all' && authorFilter !== 'all') {
            authorFilter = 'all'
        }
        pageIndex = 0
    }

    $: {
        normalized
        idToItem = new Map()
        if (normalized.length === 0) {
            miniSearch = null
        } else {
            const documents = normalized.map((item, index) => {
                const id = String(item.sourceIndex ?? index)
                idToItem.set(id, item)
                return {
                    id,
                    title: item.title ?? '',
                    author: item.author ?? '',
                    content: item.content ?? '',
                    type: item.type ?? '',
                    groupTitle: item.title?.trim() || 'Untitled',
                    groupAuthor: item.author?.trim() || 'Unknown Author',
                }
            })

            miniSearch = new MiniSearch({
                fields: ['title', 'author', 'content'],
                storeFields: ['id', 'title', 'author', 'type', 'groupTitle', 'groupAuthor'],
                searchOptions: {
                    boost: { title: 2, author: 1.5 },
                    prefix: true,
                    fuzzy: 0.2,
                },
            })
            miniSearch.addAll(documents)
        }
    }

    $: {
        searchQuery
        typeFilter
        titleFilter
        authorFilter
        miniSearch

        const query = searchQuery.trim()
        highlightTokens = query
            ? query
                  .split(/\s+/)
                  .map((token) => token.trim())
                  .filter((token) => token.length > 1)
            : []
        if (query && miniSearch) {
            const results = miniSearch.search(query, {
                filter: (result) => {
                    if (typeFilter !== 'all' && result.type !== typeFilter) return false
                    if (titleFilter !== 'all' && result.groupTitle !== titleFilter) return false
                    if (authorFilter !== 'all' && result.groupAuthor !== authorFilter) return false
                    return true
                },
            })
            filteredItems = results
                .map((result) => idToItem.get(String(result.id)))
                .filter((item): item is NormalizedClipping => Boolean(item))
        } else {
            filteredItems = normalized.filter((item) => {
                if (typeFilter !== 'all' && item.type !== typeFilter) return false
                if (titleFilter !== 'all' && (item.title?.trim() || 'Untitled') !== titleFilter)
                    return false
                if (
                    authorFilter !== 'all' &&
                    (item.author?.trim() || 'Unknown Author') !== authorFilter
                )
                    return false
                return true
            })
        }

        totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize))
        pageIndex = Math.min(pageIndex, totalPages - 1)
    }

    function escapeHtml(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
    }

    function escapeRegExp(value: string): string {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }

    function highlightText(value?: string): string {
        if (!value) return '—'
        const safe = escapeHtml(value)
        if (!highlightTokens.length) return safe
        const pattern = new RegExp(`(${highlightTokens.map(escapeRegExp).join('|')})`, 'gi')
        return safe.replace(pattern, '<mark>$1</mark>')
    }

    function resetFilters() {
        titleFilter = 'all'
        authorFilter = 'all'
        typeFilter = 'all'
        searchQuery = ''
        pageIndex = 0
    }

    onMount(() => {
        loadSavedClippings()
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search)
            if (params.get('source') === 'site') {
                loadSiteClippings()
            }
        }
    })
</script>

<svelte:head>
    <title>Kindle Clippings Viewer</title>
</svelte:head>

<p class="note">
    Upload your Kindle clippings and browse by book or author. Everything stays local in your
    browser.
</p>

<section class="card viewer-card">
    <div class="viewer-header">
        <div>
            <h2>Upload &amp; browse</h2>
        </div>
    </div>
    <div class="upload-panel">
        <div class="upload-row">
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
            <span class="upload-or">OR</span>
            <button
                type="button"
                class="ghost upload-alt"
                on:click={loadSiteClippings}
                disabled={isLoadingStatic}
            >
                {isLoadingStatic ? 'Loading...' : 'Browse my own personal highlights'}
            </button>
        </div>
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
        <label class="field field-wide">
            <span>Search</span>
            <input
                type="search"
                placeholder="Search titles, authors, or highlight text"
                bind:value={searchQuery}
                disabled={!normalized.length}
            />
        </label>
        <div class="field">
            <span>Book title</span>
            <div class="select-wrap">
                <select bind:value={titleFilter} disabled={!normalized.length}>
                    <option value="all">All titles</option>
                    {#each uniqueTitles as title}
                        <option value={title}>{title}</option>
                    {/each}
                </select>
                {#if titleFilter !== 'all'}
                    <button
                        type="button"
                        class="clear-filter"
                        on:click={() => (titleFilter = 'all')}
                        aria-label="Clear book title filter"
                    >
                        ×
                    </button>
                {/if}
            </div>
        </div>
        <div class="field">
            <span>Author</span>
            <div class="select-wrap">
                <select
                    bind:value={authorFilter}
                    disabled={!normalized.length || titleFilter !== 'all'}
                >
                    <option value="all">All authors</option>
                    {#each uniqueAuthors as author}
                        <option value={author}>{author}</option>
                    {/each}
                </select>
                {#if authorFilter !== 'all'}
                    <button
                        type="button"
                        class="clear-filter"
                        on:click={() => (authorFilter = 'all')}
                        aria-label="Clear author filter"
                        disabled={titleFilter !== 'all'}
                    >
                        ×
                    </button>
                {/if}
            </div>
        </div>
        <label class="field">
            <span>Type</span>
            <select bind:value={typeFilter} disabled={!normalized.length}>
                <option value="all">All types</option>
                <option value="Highlight">Highlight</option>
                <option value="Note">Note</option>
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
    <p class="viewer-count">{filteredItems.length} items</p>

    <div class="viewer-list">
        {#each filteredItems.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize) as item (item.sourceIndex)}
            <article class="viewer-item">
                <p class="viewer-content">
                    {@html highlightText(item.content)}
                </p>
                <div class="viewer-meta">
                    <button
                        type="button"
                        class="meta-link"
                        on:click={() => {
                            titleFilter = item.title?.trim() || 'Untitled'
                            authorFilter = 'all'
                        }}
                    >
                        {item.title}
                    </button>
                    {#if item.author}
                        <span>·</span>
                        <button
                            type="button"
                            class="meta-link"
                            on:click={() => {
                                authorFilter = item.author?.trim() || 'Unknown Author'
                                titleFilter = 'all'
                            }}
                        >
                            {item.author}
                        </button>
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

    .upload-row {
        display: grid;
        align-items: center;
        gap: 0.75rem;
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    }

    .upload-or {
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        color: var(--c-text-muted);
        text-align: center;
        align-self: center;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .file-input {
        border: 1px dashed var(--c-border-dashed);
        border-radius: var(--radius-md);
        padding: 0.75rem 1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-weight: 600;
        color: var(--c-primary-dark);
        background: var(--c-primary-light);
        transition:
            border-color 0.2s ease,
            transform 0.2s ease;
        width: 100%;
        justify-content: center;
        text-align: center;
        height: 56px;
        box-sizing: border-box;
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
        width: 100%;
        height: 56px;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .upload-alt {
        border-radius: var(--radius-md);
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

    .viewer-count {
        margin: 0 0 1rem 0;
        color: var(--c-text-light);
        font-weight: 600;
    }

    .field-wide {
        grid-column: span 2;
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

    .select-wrap {
        position: relative;
        display: flex;
        align-items: center;
    }

    .select-wrap select {
        padding-right: 2.25rem;
    }

    .clear-filter {
        position: absolute;
        right: 0.5rem;
        border: none;
        background: var(--c-bg-subtle);
        color: var(--c-text-light);
        font-size: 1rem;
        font-weight: 700;
        width: 1.6rem;
        height: 1.6rem;
        border-radius: 999px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s ease, color 0.2s ease;
    }

    .clear-filter:hover {
        background: var(--c-primary-light);
        color: var(--c-primary-dark);
    }

    .clear-filter:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    select,
    input[type='search'] {
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

    .viewer-content mark {
        background: rgba(245, 158, 11, 0.3);
        color: inherit;
        padding: 0 0.15rem;
        border-radius: 0.2rem;
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

    .meta-link {
        border: none;
        background: none;
        padding: 0;
        color: inherit;
        font: inherit;
        cursor: pointer;
        text-decoration: underline;
        text-underline-offset: 2px;
    }

    .meta-link:hover {
        color: var(--c-primary);
    }

    @media (max-width: 720px) {
        .viewer-controls {
            grid-template-columns: 1fr;
        }

        .field-wide {
            grid-column: span 1;
        }

        .upload-card,
        .viewer-card {
            padding: 1.25rem;
        }

        .viewer-item {
            padding: 0.9rem;
        }

        .upload-row {
            grid-template-columns: 1fr;
        }
    }

    @media (max-width: 600px) {
        .viewer-actions {
            grid-template-columns: 1fr;
        }
    }
</style>
