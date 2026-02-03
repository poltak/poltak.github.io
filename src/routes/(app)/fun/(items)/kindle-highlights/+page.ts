import type { PageLoad } from './$types'

export const load: PageLoad = () => {
    return {
        fun: {
            title: 'Kindle Clippings Converter',
            description:
                'Upload your Kindle "My Clippings.txt" file and export your highlights as CSV or JSON, ready for spreadsheets, Notion, or further processing.',
        },
    }
}
