import type { PageLoad } from './$types'

export const load: PageLoad = () => {
    return {
        fun: {
            title: 'Maze Generator',
            description: 'A visual maze generator using multiple algorithms and seeds.',
        },
    }
}
