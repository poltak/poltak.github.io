import type { PageLoad } from './$types'

export const load: PageLoad = () => {
    return {
        fun: {
            title: 'Timestamp Goblin',
            description: 'A Chrome extension that remembers and restores YouTube playback progress.',
        },
    }
}
