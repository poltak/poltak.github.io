import type { PageLoad } from './$types'

export const load: PageLoad = () => {
    return {
        fun: {
            title: 'Speed Reader',
            description: 'A local-only, free EPUB speed reader with adjustable pacing controls.',
        },
    }
}
