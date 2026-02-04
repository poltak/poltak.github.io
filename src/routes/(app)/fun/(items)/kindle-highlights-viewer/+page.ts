import type { PageLoad } from './$types'

export const load: PageLoad = () => {
    return {
        fun: {
            title: 'Kindle Clippings Viewer',
            description:
                'Upload a Kindle "My Clippings.txt" file and browse highlights by book or author.',
        },
    }
}
