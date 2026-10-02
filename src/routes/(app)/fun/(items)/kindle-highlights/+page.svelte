<script lang="ts">
    import { parseClippings, type NormalizedClipping } from 'kindle-highlights-parser'
    import { toCsv } from 'kindle-highlights-parser/outputs/csv'
    import { toJson } from 'kindle-highlights-parser/outputs/json'
    import { onDestroy } from 'svelte'
    import { base } from '$app/paths'

    type OutputFormat = 'csv' | 'json'

    // A textarea takes more than 100 ms to lay out 1 MB of text. Copy and Download use the full output.
    const PREVIEW_CHARACTER_LIMIT = 50_000

    let outputFormat = $state<OutputFormat>('csv')
    let prettyJson = $state(true)
    // The parsed clippings are replaced as a whole, so they do not need a deep proxy.
    let normalized = $state.raw<NormalizedClipping[]>([])
    let errorMessage = $state('')
    let statusMessage = $state('')
    let sourceFileName = $state('')
    let fileInput = $state<HTMLInputElement | null>(null)
    let uploadId = 0

    const output = $derived(
        normalized.length === 0
            ? ''
            : outputFormat === 'csv'
              ? toCsv(normalized)
              : toJson(normalized, { pretty: prettyJson }),
    )
    const outputFilename = $derived.by(() => {
        if (!output) return ''
        const baseName = sourceFileName
            ? sourceFileName
                  .replace(/\.txt$/i, '')
                  .replace(/\s+/g, '-')
                  .toLowerCase()
            : 'kindle-clippings'
        return `${baseName}.${outputFormat}`
    })
    const isPreviewShortened = $derived(output.length > PREVIEW_CHARACTER_LIMIT)
    const preview = $derived(isPreviewShortened ? output.slice(0, PREVIEW_CHARACTER_LIMIT) : output)

    // One object URL for the current output. The cleanup releases it on a change and on route exit.
    let downloadUrl = $state<string | null>(null)
    $effect(() => {
        if (!output) return
        const url = URL.createObjectURL(
            new Blob([output], {
                type:
                    outputFormat === 'csv'
                        ? 'text/csv;charset=utf-8'
                        : 'application/json;charset=utf-8',
            }),
        )
        downloadUrl = url
        return () => {
            URL.revokeObjectURL(url)
            downloadUrl = null
        }
    })

    onDestroy(() => {
        uploadId += 1
    })

    async function handleFileUpload(event: Event) {
        const requestId = ++uploadId
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
            if (requestId !== uploadId) return
            const result = parseClippings(text)
            normalized = result.normalized
            if (normalized.length === 0) {
                errorMessage =
                    'No clippings found. Check that this is a Kindle \"My Clippings.txt\" file.'
            }
        } catch (error) {
            if (requestId !== uploadId) return
            normalized = []
            errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Something went wrong while parsing the file.'
        }
    }

    async function copyToClipboard() {
        if (!output) return

        try {
            await navigator.clipboard.writeText(output)
            statusMessage = 'Copied to clipboard.'
        } catch (error) {
            statusMessage =
                error instanceof Error ? error.message : 'Unable to copy output to clipboard.'
        }
    }

    function clearAll() {
        uploadId += 1
        normalized = []
        errorMessage = ''
        statusMessage = ''
        sourceFileName = ''
        if (fileInput) {
            fileInput.value = ''
        }
    }
</script>

<svelte:head>
    <title>Kindle Clippings Converter</title>
</svelte:head>

<p class="note">
    Check out my
    <a href="{base}/fun/kindle-highlights-viewer">Kindle Clippings Viewer</a>
    page if you want to browse through your clippings in a simple interface.
</p>

<p class="note">
    Built on my
    <a
        href="https://www.npmjs.com/package/kindle-highlights-parser"
        target="_blank"
        rel="noopener noreferrer"
    >
        kindle-highlights-parser
    </a>
    package.
</p>

<section class="card">
    <h2>1. Upload your file</h2>
    <div class="upload-panel">
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
    <h2>2. Choose output</h2>
    <p class="note">
        Feel free to <a href="{base}/contact">contact me</a> if you need a different output format.
    </p>
    <div class="controls">
        <div class="toggle-group" role="group" aria-label="Output format">
            <button
                type="button"
                class:active={outputFormat === 'csv'}
                onclick={() => (outputFormat = 'csv')}
            >
                CSV
            </button>
            <button
                type="button"
                class:active={outputFormat === 'json'}
                onclick={() => (outputFormat = 'json')}
            >
                JSON
            </button>
        </div>
        <label class="checkbox" class:disabled={outputFormat !== 'json'}>
            <input type="checkbox" bind:checked={prettyJson} disabled={outputFormat !== 'json'} />
            Pretty JSON
        </label>
        <button type="button" class="ghost" onclick={clearAll}> Reset </button>
    </div>

    <div class="summary">
        <div>
            <span class="label">Clippings parsed</span>
            <span class="value">{normalized.length}</span>
        </div>
        <div>
            <span class="label">Output format</span>
            <span class="value">{outputFormat.toUpperCase()}</span>
        </div>
    </div>
</section>

<section class="card output-card">
    <div class="output-header">
        <h2>3. Export</h2>
        <div class="actions">
            <button type="button" onclick={copyToClipboard} disabled={!output}> Copy </button>
            <a
                class:disabled={!downloadUrl}
                href={downloadUrl ?? '#'}
                download={outputFilename}
                rel="noopener noreferrer"
            >
                Download
            </a>
        </div>
    </div>

    {#if statusMessage}
        <p class="status">{statusMessage}</p>
    {/if}

    <textarea
        class="output"
        readonly
        placeholder="Upload a file to see the output here."
        value={preview}></textarea>
    {#if isPreviewShortened}
        <p class="hint preview-note">
            This preview shows the first {PREVIEW_CHARACTER_LIMIT.toLocaleString()} of {output.length.toLocaleString()}
            characters. Copy and Download give you the full output.
        </p>
    {/if}
</section>

<style>
    .note {
        margin: 0 0 0.6rem 0;
        max-width: var(--measure);
        color: var(--c-text-muted);
        font-size: 0.95rem;
    }

    .note + .card {
        margin-top: 1.5rem;
    }

    .card .note {
        margin-bottom: 1.25rem;
    }

    .note a {
        color: var(--c-primary-dark);
        font-weight: 600;
        text-decoration: none;
    }

    .note a:hover {
        text-decoration: underline;
    }

    .card {
        background: transparent;
        border: 1px solid var(--c-border);
        padding: 1.75rem;
        margin-bottom: 1.5rem;
    }

    .upload-panel {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .file-input {
        border: 1px dashed var(--c-border-dashed);
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

    .file-input:focus-within {
        outline: 2px solid var(--c-primary);
        outline-offset: 3px;
    }

    .file-name,
    .hint {
        margin: 0;
        max-width: none;
    }

    .file-name {
        color: var(--c-text-light);
        font-size: 0.95rem;
    }

    .hint {
        font-size: 0.85rem;
        color: var(--c-text-muted);
    }

    .alert {
        margin-top: 1rem;
        padding: 0.75rem 1rem;
        background: var(--c-danger-bg);
        border: 1px solid var(--c-danger-border);
        color: var(--c-danger);
    }

    .controls {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: center;
        justify-content: space-between;
    }

    .toggle-group {
        display: inline-flex;
        gap: 0.5rem;
        background: var(--c-bg-subtle);
        border: 1px solid var(--c-border-light);
        padding: 0.25rem;
    }

    .toggle-group button {
        border: none;
        background: transparent;
        padding: 0.4rem 1rem;
        font-weight: 600;
        font-size: 0.95rem;
        line-height: 1;
        color: var(--c-text-light);
        cursor: pointer;
        transition:
            background 0.2s ease,
            color 0.2s ease;
    }

    .toggle-group button.active {
        background: var(--c-primary);
        color: var(--c-on-primary);
    }

    .checkbox {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        color: var(--c-text-light);
    }

    .checkbox.disabled {
        opacity: 0.5;
    }

    .ghost {
        border: 1px solid var(--c-border);
        background: transparent;
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

    .summary {
        margin-top: 1.5rem;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 1rem;
    }

    .summary .label {
        display: block;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--c-text-muted);
        margin-bottom: 0.35rem;
    }

    .summary .value {
        font-size: 1.25rem;
        font-weight: 700;
    }

    .output-card {
        padding-bottom: 2rem;
    }

    .output-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .actions {
        display: inline-flex;
        gap: 0.75rem;
    }

    .actions button,
    .actions a {
        border: 1px solid var(--c-border);
        padding: 0.5rem 1.25rem;
        font-weight: 600;
        font-size: 0.95rem;
        line-height: 1;
        cursor: pointer;
        text-decoration: none;
        background: var(--c-primary-light);
        color: var(--c-primary);
        transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .actions button:hover,
    .actions a:hover {
        transform: translateY(-1px);
        border-color: var(--c-primary);
    }

    .actions a.disabled {
        pointer-events: none;
        opacity: 0.5;
    }

    .actions button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .status {
        margin-top: 1rem;
        color: var(--c-success);
        font-weight: 600;
    }

    .output {
        display: block;
        width: 100%;
        box-sizing: border-box;
        min-height: 260px;
        margin-top: 1rem;
        resize: vertical;
        border: 1px solid var(--c-border);
        padding: 1rem;
        font-family: var(--font-mono);
        font-size: 0.85rem;
        line-height: 1.5;
        background: var(--c-bg-input);
        color: var(--c-text);
    }

    .preview-note {
        margin: 0.75rem 0 0;
    }

    @media (max-width: 768px) {
        .controls {
            flex-direction: column;
            align-items: flex-start;
        }

        .actions {
            width: 100%;
            justify-content: flex-start;
            flex-wrap: wrap;
        }
    }
</style>
