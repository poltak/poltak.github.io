import { ZipReader, BlobReader, TextWriter } from '@zip.js/zip.js'
import type { EBook } from '$lib/stores/ebook.svelte'

/**
 * TODO: Expand functionality to be able to:
 *  - extract TOC + word index
 *  - extract metadata
 *  - stream text content instead of loading everything into memory
 */
export async function parseEpub(book: EBook): Promise<string[]> {
    const zipReader = new ZipReader(new BlobReader(book.file))
    const entries = await zipReader.getEntries()

    // First get container.xml
    const containerEntry = entries.find((entry) => entry.filename === 'META-INF/container.xml')
    if (!containerEntry) {
        throw new Error('No container.xml found')
    }

    // Read and parse container.xml
    if (!containerEntry.getData) {
        throw new Error('Invalid container.xml entry')
    }
    const containerText = await containerEntry.getData(new TextWriter())
    const parser = new DOMParser()
    const containerDoc = parser.parseFromString(containerText, 'text/xml')

    // Find the OPF file path
    const rootfile = containerDoc.querySelector('rootfile')
    if (!rootfile) {
        throw new Error('No rootfile found in container.xml')
    }

    const opfPath = rootfile.getAttribute('full-path')
    if (!opfPath) {
        throw new Error('No OPF path found')
    }

    // Get and parse the OPF file
    const opfEntry = entries.find((entry) => entry.filename === opfPath)
    if (!opfEntry) {
        throw new Error('No OPF file found')
    }

    if (!opfEntry.getData) {
        throw new Error('Invalid OPF file entry')
    }
    const opfText = await opfEntry.getData(new TextWriter())
    const opfDoc = parser.parseFromString(opfText, 'text/xml')

    // Get reading order from spine
    const spine = opfDoc.querySelector('spine')
    if (!spine) {
        throw new Error('No spine found in OPF')
    }

    const manifest = opfDoc.querySelector('manifest')
    if (!manifest) {
        throw new Error('No manifest found in OPF')
    }

    // Build map of manifest items
    const items = Array.from(manifest.querySelectorAll('item'))
    const itemMap = new Map(
        items.map((item) => [item.getAttribute('id') || '', item.getAttribute('href') || '']),
    )

    // Get content files in reading order
    const itemrefs = Array.from(spine.querySelectorAll('itemref'))
    const contentPaths = itemrefs
        .map((itemref) => itemref.getAttribute('idref'))
        .filter((id): id is string => id !== null)
        .map((id) => itemMap.get(id))
        .filter((path): path is string => path !== undefined)
        .map((path) => {
            // Make path relative to OPF location
            const opfDir = opfPath.split('/').slice(0, -1).join('/')
            return opfDir ? `${opfDir}/${path}` : path
        })

    // Extract and concatenate all content
    let allText = ''
    for (const path of contentPaths) {
        const entry = entries.find((e) => e.filename === path)
        if (entry) {
            if (!entry.getData) {
                console.warn(`Skipping invalid content file: ${path}`)
                continue
            }
            const text = await entry.getData(new TextWriter())
            const doc = parser.parseFromString(text, 'text/html')
            allText += ' ' + (doc.body?.textContent || '').replace(/\s+/g, ' ').trim()
        }
    }

    await zipReader.close()

    // Split into words and filter out empty strings
    const parsedWords = allText.split(/\s+/).filter((word) => word.length > 0)
    if (parsedWords.length === 0) {
        throw new Error('No readable content found in EPUB')
    }
    return parsedWords
}
