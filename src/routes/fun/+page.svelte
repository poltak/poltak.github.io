<script lang="ts">
    import { onMount } from 'svelte'
    import { EBookStore } from '$lib/stores/ebook.svelte'
    import SpeedReader from '$lib/components/SpeedReader.svelte'

    let ebookStore = new EBookStore()
    let fileInput: HTMLInputElement
    let books = $derived(ebookStore.getBooks())
    let currentBook = $derived(ebookStore.getCurrentBook())
    let uploadError = $state('')

    onMount(async () => {
        try {
            await ebookStore.loadBooks()
        } catch (error) {
            console.error('Failed to load books:', error)
        }
    })

    async function handleFileUpload(event: Event) {
        const input = event.target as HTMLInputElement
        const file = input.files?.[0]

        if (!file) return

        if (!file.name.endsWith('.epub')) {
            uploadError = 'Please upload an EPUB file'
            return
        }

        try {
            await ebookStore.addBook(file)
            uploadError = ''
            fileInput.value = '' // Reset input
        } catch (error) {
            console.error('Failed to add book:', error)
            uploadError = 'Failed to upload book'
        }
    }

    async function handleDeleteBook(id: string) {
        try {
            await ebookStore.deleteBook(id)
        } catch (error) {
            console.error('Failed to delete book:', error)
        }
    }
</script>

<div class="main-content">
    <h1>ePUB Speed Reader</h1>

    <div class="upload-section">
        <input type="file" accept=".epub" bind:this={fileInput} onchange={handleFileUpload} />
        {#if uploadError}
            <p class="error">{uploadError}</p>
        {/if}
    </div>

    <div class="books-section">
        <h2>Your Books</h2>
        {#if books.length === 0}
            <p>No books uploaded yet. Upload an ePUB file to get started!</p>
        {:else}
            <div class="book-list">
                {#each books as book}
                    <div
                        class="book-item"
                        class:selected={currentBook?.id === book.id}
                        onclick={() => ebookStore.setCurrentBook(book)}
                        role="button"
                        tabindex="0"
                        onkeydown={(e) => e.key === 'Enter' && ebookStore.setCurrentBook(book)}
                    >
                        <h3>{book.title}</h3>
                        <p>Author: {book.author}</p>
                        <p class="upload-date">
                            Uploaded: {new Date(book.uploadDate).toLocaleDateString()}
                        </p>
                        <button
                            class="delete-button"
                            onclick={async (e) => {
                                e.stopPropagation()
                                await handleDeleteBook(book.id)
                            }}
                        >
                            Delete
                        </button>
                    </div>
                {/each}
            </div>
        {/if}
    </div>

    {#if currentBook}
        <div class="reader-section">
            <h2>Currently Reading: {currentBook.title}</h2>
            <SpeedReader book={currentBook} />
        </div>
    {/if}
</div>

<style>
    .main-content {
        display: flex;
        flex-direction: column;
        height: 100vh;
        gap: 2rem;
    }

    .upload-section {
        margin-top: 1rem;
    }

    .error {
        color: red;
        margin-top: 0.5rem;
    }

    .books-section {
        margin-top: 1rem;
    }

    .book-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }

    .book-item {
        padding: 1rem;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
    }

    .book-item:hover {
        background-color: var(--hover-bg);
    }

    .book-item.selected {
        border-color: #4a9eff;
        background-color: var(--hover-bg);
    }

    .book-item h3 {
        margin: 0;
        margin-bottom: 0.5rem;
    }

    .book-item p {
        margin: 0;
        font-size: 0.9rem;
        color: #666;
    }

    .book-item .upload-date {
        margin-top: 0.5rem;
        font-size: 0.8rem;
    }

    .delete-button {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        padding: 0.25rem 0.5rem;
        background-color: #ff4444;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s ease;
    }

    .book-item:hover .delete-button {
        opacity: 1;
    }

    .delete-button:hover {
        background-color: #ff0000;
    }

    .reader-section {
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid var(--border-color);
    }
</style>
