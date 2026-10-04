import type { PageLoad } from './$types'

export const load: PageLoad = () => {
    return {
        fun: {
            title: 'Fex',
            description:
                'A small currency converter with rate history charts. It works offline and needs no account.',
        },
    }
}
