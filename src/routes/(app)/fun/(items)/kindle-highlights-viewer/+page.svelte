<script lang="ts">
    import { createClippingsSearch, createTextHighlighter } from '$lib/clippings-search'
    import { parseClippings, type NormalizedClipping } from 'kindle-highlights-parser'
    import { onDestroy, onMount, tick } from 'svelte'
    import { base } from '$app/paths'

    type TypeFilter = 'all' | 'Highlight' | 'Note'

    // A clippings file has thousands of entries. They are replaced as a whole, so no deep proxy.
    let normalized = $state.raw<NormalizedClipping[]>([])
    let errorMessage = $state('')
    let statusMessage = $state('')
    let sourceFileName = $state('')
    let fileInput = $state<HTMLInputElement | null>(null)
    let listTop = $state<HTMLElement | null>(null)
    let isSaving = $state(false)
    let isLoadingStatic = $state(false)
    let pageIndex = $state(0)
    let pageSize = $state(25)
    let searchQuery = $state('')
    let typeFilter = $state<TypeFilter>('all')
    let titleFilter = $state('all')
    let authorFilter = $state('all')
    let loadId = 0
    let siteRequest: AbortController | null = null

    const titleOf = (item: NormalizedClipping) => item.title?.trim() || 'Untitled'
    const authorOf = (item: NormalizedClipping) => item.author?.trim() || 'Unknown Author'

    const uniqueTitles = $derived(
        [...new Set(normalized.map(titleOf))].sort((a, b) => a.localeCompare(b)),
    )
    const uniqueAuthors = $derived(
        [...new Set(normalized.map(authorOf))].sort((a, b) => a.localeCompare(b)),
    )
    const searchClippings = $derived(createClippingsSearch(normalized))
    const highlightText = $derived(createTextHighlighter(searchQuery))
    const filteredItems = $derived(
        searchClippings({
            query: searchQuery,
            type: typeFilter,
            title: titleFilter,
            author: authorFilter,
        }),
    )
    const totalPages = $derived(Math.max(1, Math.ceil(filteredItems.length / pageSize)))
    const currentPage = $derived(Math.min(pageIndex, totalPages - 1))
    const pageItems = $derived(
        filteredItems.slice(currentPage * pageSize, (currentPage + 1) * pageSize),
    )

    /** Replace the clippings. Filters that the new data cannot satisfy go back to "all". */
    function setClippings(items: NormalizedClipping[]) {
        normalized = items
        pageIndex = 0
        if (titleFilter !== 'all' && !items.some((item) => titleOf(item) === titleFilter)) {
            titleFilter = 'all'
        }
        if (authorFilter !== 'all' && !items.some((item) => authorOf(item) === authorFilter)) {
            authorFilter = 'all'
        }
    }

    // Each filter change goes back to the first page. The title and author filters exclude each other.
    function setSearchQuery(value: string) {
        searchQuery = value
        pageIndex = 0
    }

    function setTypeFilter(value: TypeFilter) {
        typeFilter = value
        pageIndex = 0
    }

    function setTitleFilter(value: string) {
        titleFilter = value
        if (value !== 'all') authorFilter = 'all'
        pageIndex = 0
    }

    function setAuthorFilter(value: string) {
        authorFilter = value
        if (value !== 'all') titleFilter = 'all'
        pageIndex = 0
    }

    function setPageSize(value: number) {
        pageSize = value
        pageIndex = 0
    }

    async function goToPage(index: number, scrollToList = false) {
        pageIndex = Math.max(0, Math.min(totalPages - 1, index))
        if (!scrollToList) return
        await tick()
        listTop?.scrollIntoView?.({ block: 'start' })
    }

    function beginLoad() {
        siteRequest?.abort()
        siteRequest = null
        isLoadingStatic = false
        return ++loadId
    }

    onDestroy(() => {
        beginLoad()
    })

    async function handleFileUpload(event: Event) {
        const requestId = beginLoad()
        const input = event.currentTarget as HTMLInputElement
        const file = input.files?.[0]

        statusMessage = ''
        errorMessage = ''

        if (!file) {
            setClippings([])
            sourceFileName = ''
            return
        }

        sourceFileName = file.name

        try {
            const text = await file.text()
            if (requestId !== loadId) return
            const result = parseClippings(text)
            setClippings(result.normalized.filter((item) => item.type !== 'Bookmark'))
            if (normalized.length === 0) {
                errorMessage =
                    'No clippings found. Check that this is a Kindle "My Clippings.txt" file.'
            }
        } catch (error) {
            if (requestId !== loadId) return
            setClippings([])
            errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Something went wrong while parsing the file.'
        }
    }

    async function loadSiteClippings() {
        const requestId = beginLoad()
        const controller = new AbortController()
        siteRequest = controller
        isLoadingStatic = true
        statusMessage = ''
        errorMessage = ''
        try {
            const response = await fetch(`${base}/My%20Clippings.txt`, {
                signal: controller.signal,
            })
            if (!response.ok) {
                throw new Error('Unable to load the site clippings file.')
            }
            const text = await response.text()
            if (requestId !== loadId) return
            const result = parseClippings(text)
            setClippings(result.normalized.filter((item) => item.type !== 'Bookmark'))
            sourceFileName = 'Jon\'s "My Clippings.txt"'
            if (normalized.length === 0) {
                errorMessage = 'No clippings found in the site file. Check the uploaded content.'
            }
        } catch (error) {
            if (requestId !== loadId) return
            setClippings([])
            errorMessage =
                error instanceof Error ? error.message : 'Unable to load the site clippings file.'
        } finally {
            if (requestId === loadId) {
                isLoadingStatic = false
                siteRequest = null
            }
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
        const requestId = beginLoad()
        let db: IDBDatabase | undefined
        try {
            db = await openDatabase()
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
            if (requestId !== loadId) return
            if (saved?.normalized?.length) {
                setClippings(saved.normalized)
                sourceFileName = saved.sourceFileName ?? ''
                statusMessage = 'Loaded saved clippings from this browser.'
            }
        } catch (error) {
            if (requestId !== loadId) return
            statusMessage =
                error instanceof Error ? error.message : 'Unable to load saved clippings.'
        } finally {
            db?.close()
        }
    }

    async function saveToIndexedDb() {
        if (!normalized.length) return
        isSaving = true
        statusMessage = ''
        let db: IDBDatabase | undefined
        try {
            db = await openDatabase()
            const tx = db.transaction('files', 'readwrite')
            const store = tx.objectStore('files')
            store.put({ normalized, sourceFileName, savedAt: new Date().toISOString() }, 'default')
            await new Promise<void>((resolve, reject) => {
                tx.oncomplete = () => resolve()
                tx.onerror = () => reject(tx.error ?? new Error('Unable to save clippings.'))
                tx.onabort = () => reject(tx.error ?? new Error('Unable to save clippings.'))
            })
            statusMessage = 'Saved clippings to this browser.'
        } catch (error) {
            statusMessage = error instanceof Error ? error.message : 'Unable to save clippings.'
        } finally {
            db?.close()
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
        beginLoad()
        setClippings([])
        sourceFileName = ''
        statusMessage = ''
        errorMessage = ''
        if (fileInput) fileInput.value = ''
        let db: IDBDatabase | undefined
        try {
            db = await openDatabase()
            const tx = db.transaction('files', 'readwrite')
            const store = tx.objectStore('files')
            store.delete('default')
            await new Promise<void>((resolve, reject) => {
                tx.oncomplete = () => resolve()
                tx.onerror = () => reject(tx.error ?? new Error('Unable to clear saved clippings.'))
                tx.onabort = () => reject(tx.error ?? new Error('Unable to clear saved clippings.'))
            })
            statusMessage = 'Cleared saved clippings from this browser.'
        } catch (error) {
            statusMessage =
                error instanceof Error ? error.message : 'Unable to clear saved clippings.'
        } finally {
            db?.close()
        }
    }

    onMount(() => {
        const params = new URLSearchParams(window.location.search)
        if (params.get('source') === 'site') void loadSiteClippings()
        else void loadSavedClippings()
    })
</script>

<svelte:head>
    <title>Kindle Clippings Viewer</title>
</svelte:head>

{#snippet pager(scrollToList: boolean)}
    <div class="pager">
        <button
            type="button"
            onclick={() => goToPage(currentPage - 1, scrollToList)}
            disabled={!normalized.length || currentPage === 0}
        >
            Previous
        </button>
        <span>Page {currentPage + 1} of {totalPages}</span>
        <button
            type="button"
            onclick={() => goToPage(currentPage + 1, scrollToList)}
            disabled={!normalized.length || currentPage >= totalPages - 1}
        >
            Next
        </button>
    </div>
{/snippet}

<section class="card viewer-card">
    <h2>Upload &amp; browse</h2>
    <div class="upload-panel">
        <div class="upload-row">
            <label class="file-input" for="clippings">
                <input
                    id="clippings"
                    class="visually-hidden"
                    type="file"
                    accept=".txt"
                    onchange={handleFileUpload}
                    bind:this={fileInput}
                />
                <span>Choose &quot;My Clippings.txt&quot;</span>
            </label>
            <span class="upload-or">OR</span>
            <button
                type="button"
                class="ghost upload-alt"
                onclick={loadSiteClippings}
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
        <div class="alert" role="alert">{errorMessage}</div>
    {/if}

    <div class="viewer-actions">
        <button
            type="button"
            class="ghost"
            onclick={saveToIndexedDb}
            disabled={!normalized.length || isSaving}
        >
            {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button type="button" class="ghost" onclick={clearSavedClippings}>
            Clear saved data
        </button>
        <p class="action-help">
            Save keeps your parsed clippings in this browser, so they load automatically next time.
            Clear removes that saved copy only. It does not change your file.
        </p>
    </div>
    {#if statusMessage}
        <p class="status" role="status">{statusMessage}</p>
    {/if}

    <div class="viewer-controls">
        <label class="field field-wide">
            <span>Search</span>
            <input
                type="search"
                placeholder="Search titles, authors, or highlight text"
                bind:value={() => searchQuery, setSearchQuery}
                disabled={!normalized.length}
            />
        </label>
        <div class="field">
            <label for="title-filter">Book title</label>
            <div class="select-wrap">
                <select
                    id="title-filter"
                    bind:value={() => titleFilter, setTitleFilter}
                    disabled={!normalized.length}
                >
                    <option value="all">All titles</option>
                    {#each uniqueTitles as title}
                        <option value={title}>{title}</option>
                    {/each}
                </select>
                {#if titleFilter !== 'all'}
                    <button
                        type="button"
                        class="clear-filter"
                        onclick={() => setTitleFilter('all')}
                        aria-label="Clear book title filter"
                    >
                        ×
                    </button>
                {/if}
            </div>
        </div>
        <div class="field">
            <label for="author-filter">Author</label>
            <div class="select-wrap">
                <select
                    id="author-filter"
                    bind:value={() => authorFilter, setAuthorFilter}
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
                        onclick={() => setAuthorFilter('all')}
                        aria-label="Clear author filter"
                    >
                        ×
                    </button>
                {/if}
            </div>
        </div>
        <label class="field">
            <span>Type</span>
            <select bind:value={() => typeFilter, setTypeFilter} disabled={!normalized.length}>
                <option value="all">All types</option>
                <option value="Highlight">Highlight</option>
                <option value="Note">Note</option>
            </select>
        </label>
        <label class="field">
            <span>Per page</span>
            <select bind:value={() => pageSize, setPageSize} disabled={!normalized.length}>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
            </select>
        </label>
    </div>

    <div class="list-bar" bind:this={listTop}>
        <p class="viewer-count">{filteredItems.length.toLocaleString()} items</p>
        {@render pager(false)}
    </div>

    <div class="viewer-list">
        {#each pageItems as item}
            <article class="viewer-item">
                <p class="viewer-content">
                    {#each highlightText(item.content) as part}
                        {#if part.matched}<mark>{part.text}</mark>{:else}{part.text}{/if}
                    {/each}
                </p>
                <div class="viewer-meta">
                    <button
                        type="button"
                        class="meta-link"
                        onclick={() => setTitleFilter(titleOf(item))}
                    >
                        {item.title}
                    </button>
                    {#if item.author}
                        <span>·</span>
                        <button
                            type="button"
                            class="meta-link"
                            onclick={() => setAuthorFilter(authorOf(item))}
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
        {:else}
            <p class="empty">
                {normalized.length
                    ? 'No clippings match these filters.'
                    : 'Choose a clippings file to see your highlights here.'}
            </p>
        {/each}
    </div>

    {#if totalPages > 1}
        <div class="list-bar list-bar-bottom">
            {@render pager(true)}
        </div>
    {/if}
</section>

<style>
    .card {
        background: transparent;
        border: 1px solid var(--c-border);
        padding: 1.75rem;
        margin-bottom: 1.5rem;
        box-sizing: border-box;
    }

    .upload-panel {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .upload-row {
        display: grid;
        align-items: stretch;
        gap: 0.75rem;
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    }

    .upload-or {
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        color: var(--c-text-muted);
        align-self: center;
    }

    .file-input,
    .ghost {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 3.25rem;
        padding: 0.6rem 1rem;
        box-sizing: border-box;
        cursor: pointer;
        font-size: 0.95rem;
        font-weight: 600;
        line-height: 1.3;
        text-align: center;
    }

    .file-input {
        border: 1px dashed var(--c-border-dashed);
        color: var(--c-primary-dark);
        background: var(--c-primary-light);
        transition: border-color 0.2s ease;
    }

    :global(:root.dark) .file-input {
        color: var(--c-primary);
    }

    .file-input:hover {
        border-color: var(--c-primary);
    }

    .file-input:focus-within {
        outline: 2px solid var(--c-primary);
        outline-offset: 3px;
    }

    .ghost {
        border: 1px solid var(--c-border);
        background: transparent;
        color: var(--c-text-light);
    }

    .ghost:hover:not(:disabled) {
        border-color: var(--c-primary);
        color: var(--c-primary);
    }

    .ghost:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }

    .file-name,
    .hint,
    .action-help,
    .status {
        margin: 0;
        max-width: none;
    }

    .file-name {
        color: var(--c-text-light);
        font-size: 0.95rem;
    }

    .hint,
    .action-help {
        color: var(--c-text-muted);
        font-size: 0.85rem;
        line-height: 1.5;
    }

    .alert {
        margin-top: 1rem;
        padding: 0.75rem 1rem;
        background: var(--c-danger-bg);
        border: 1px solid var(--c-danger-border);
        color: var(--c-danger);
    }

    .status {
        margin-top: 0.75rem;
        color: var(--c-success);
        font-weight: 600;
    }

    /* Two small buttons with one line of help. They are secondary to the list. */
    .viewer-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.75rem;
        margin-top: 1.25rem;
        padding-top: 1.25rem;
        border-top: 1px dashed var(--c-border-dashed);
    }

    .viewer-actions .ghost {
        min-height: 2.4rem;
        padding: 0.4rem 1rem;
        font-size: 0.85rem;
    }

    .action-help {
        flex: 1 1 18rem;
    }

    .viewer-controls {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        margin: 1.5rem 0;
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

    .field > span,
    .field > label {
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
        padding-right: 3.5rem;
    }

    .clear-filter {
        position: absolute;
        right: 1.6rem;
        border: 1px solid var(--c-border-light);
        background: var(--c-bg-subtle);
        color: var(--c-text-light);
        font-size: 1rem;
        font-weight: 700;
        width: 1.6rem;
        height: 1.6rem;
        padding: 0;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .clear-filter:hover {
        background: var(--c-primary-light);
        color: var(--c-primary);
    }

    select,
    input[type='search'] {
        border: 1px solid var(--c-border);
        padding: 0.5rem 0.75rem;
        font-size: 0.95rem;
        background: var(--c-bg-input);
        color: var(--c-text);
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
    }

    /* The item count and the pager share a row above the list. */
    .list-bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem 1rem;
        margin-bottom: 1rem;
        scroll-margin-top: 1rem;
    }

    .list-bar-bottom {
        justify-content: flex-end;
        margin: 1rem 0 0;
    }

    .viewer-count {
        margin: 0;
        color: var(--c-text-light);
        font-weight: 600;
    }

    .pager {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        color: var(--c-text-light);
        font-size: 0.9rem;
        white-space: nowrap;
    }

    .pager button {
        border: 1px solid var(--c-border);
        background: transparent;
        padding: 0.45rem 0.9rem;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.9rem;
        line-height: 1;
        color: var(--c-text-light);
    }

    .pager button:hover:not(:disabled) {
        border-color: var(--c-primary);
        color: var(--c-primary);
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
        padding: 1rem 1.1rem;
        border: 1px solid var(--c-border-light);
        border-left: 2px solid var(--c-border);
        background: transparent;
        width: 100%;
        box-sizing: border-box;
        overflow: hidden;
    }

    .viewer-content {
        margin: 0 0 0.75rem 0;
        max-width: var(--measure);
        color: var(--c-text);
        font-size: 1rem;
        line-height: 1.65;
        overflow-wrap: anywhere;
    }

    .viewer-content mark {
        background: rgba(245, 158, 11, 0.3);
        color: inherit;
        padding: 0 0.15rem;
    }

    .viewer-meta {
        color: var(--c-text-muted);
        font-size: 0.85rem;
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        overflow-wrap: anywhere;
        max-width: 100%;
    }

    .meta-link {
        border: none;
        background: none;
        padding: 0;
        color: inherit;
        font: inherit;
        cursor: pointer;
        text-align: left;
        text-decoration: underline;
        text-underline-offset: 2px;
    }

    .meta-link:hover {
        color: var(--c-primary);
    }

    .empty {
        margin: 0;
        padding: 2rem 1rem;
        max-width: none;
        border: 1px dashed var(--c-border-dashed);
        color: var(--c-text-muted);
        text-align: center;
    }

    @media (max-width: 768px) {
        .card {
            padding: 1.1rem;
        }

        .viewer-controls {
            grid-template-columns: 1fr;
        }

        .field-wide {
            grid-column: span 1;
        }

        .upload-row {
            grid-template-columns: 1fr;
        }

        .upload-or {
            justify-self: center;
        }
    }
</style>
