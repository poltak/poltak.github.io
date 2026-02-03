<script lang="ts">
    import { parseClippings, type NormalizedClipping } from 'kindle-highlights-parser'
    import { toCsv } from 'kindle-highlights-parser/outputs/csv'
    import { toJson } from 'kindle-highlights-parser/outputs/json'

    type OutputFormat = 'csv' | 'json'

    let outputFormat: OutputFormat = 'csv'
    let prettyJson = true
    let normalized: NormalizedClipping[] = []
    let output = ''
    let outputFilename = ''
    let downloadUrl: string | null = null
    let errorMessage = ''
    let statusMessage = ''
    let sourceFileName = ''
    let fileInput: HTMLInputElement | null = null

    function buildOutputFilename(): string {
        const baseName = sourceFileName
            ? sourceFileName
                  .replace(/\.txt$/i, '')
                  .replace(/\s+/g, '-')
                  .toLowerCase()
            : 'kindle-clippings'
        return `${baseName}.${outputFormat}`
    }

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
                    'No clippings found. Check that this is a Kindle \"My Clippings.txt\" file.'
            }
        } catch (error) {
            normalized = []
            errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Something went wrong while parsing the file.'
        }
    }

    function updateOutput() {
        if (normalized.length === 0) {
            output = ''
            outputFilename = ''
            return
        }

        output =
            outputFormat === 'csv' ? toCsv(normalized) : toJson(normalized, { pretty: prettyJson })
        outputFilename = buildOutputFilename()
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
        normalized = []
        output = ''
        outputFilename = ''
        errorMessage = ''
        statusMessage = ''
        sourceFileName = ''
        if (fileInput) {
            fileInput.value = ''
        }
    }

    $: {
        normalized
        outputFormat
        prettyJson
        updateOutput()
    }

    $: if (typeof window !== 'undefined') {
        if (downloadUrl) {
            URL.revokeObjectURL(downloadUrl)
        }
        downloadUrl = output
            ? URL.createObjectURL(
                  new Blob([output], {
                      type:
                          outputFormat === 'csv'
                              ? 'text/csv;charset=utf-8'
                              : 'application/json;charset=utf-8',
                  }),
              )
            : null
    }
</script>

<svelte:head>
    <title>Kindle Clippings Converter</title>
</svelte:head>

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
    <h2>2. Choose output</h2>
    <div class="controls">
        <div class="toggle-group" role="group" aria-label="Output format">
            <button
                type="button"
                class:active={outputFormat === 'csv'}
                on:click={() => (outputFormat = 'csv')}
            >
                CSV
            </button>
            <button
                type="button"
                class:active={outputFormat === 'json'}
                on:click={() => (outputFormat = 'json')}
            >
                JSON
            </button>
        </div>
        <label class="checkbox" class:disabled={outputFormat !== 'json'}>
            <input type="checkbox" bind:checked={prettyJson} disabled={outputFormat !== 'json'} />
            Pretty JSON
        </label>
        <button type="button" class="ghost" on:click={clearAll}> Reset </button>
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
            <button type="button" on:click={copyToClipboard} disabled={!output}> Copy </button>
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
        bind:value={output}
    >
    </textarea>
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

    .note a {
        color: var(--c-primary-dark);
        font-weight: 600;
        text-decoration: none;
    }

    .note a:hover {
        text-decoration: underline;
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
        border-radius: var(--radius-full);
        padding: 0.25rem;
    }

    .toggle-group button {
        border: none;
        background: transparent;
        padding: 0.4rem 1rem;
        border-radius: var(--radius-full);
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
        color: white;
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
        border: none;
        border-radius: var(--radius-full);
        padding: 0.5rem 1.25rem;
        font-weight: 600;
        font-size: 0.95rem;
        line-height: 1;
        cursor: pointer;
        text-decoration: none;
        background: var(--c-primary);
        color: white;
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
        box-shadow: var(--shadow-md);
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
        width: 95%;
        min-height: 260px;
        margin-top: 1rem;
        border-radius: var(--radius-md);
        border: 1px solid var(--c-border);
        padding: 1rem;
        font-family: var(--font-mono);
        font-size: 0.85rem;
        line-height: 1.5;
        background: var(--c-bg-input);
        color: var(--c-text);
    }

    @media (max-width: 720px) {
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
