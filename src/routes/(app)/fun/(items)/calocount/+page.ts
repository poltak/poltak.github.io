import type { PageLoad } from './$types'

export const load: PageLoad = () => {
    return {
        fun: {
            title: 'Calocount',
            description:
                'A calorie and nutrition tracker with a public dashboard of everything I eat. Made to run for free on Cloudflare.',
        },
    }
}
