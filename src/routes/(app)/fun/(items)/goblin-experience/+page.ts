import type { PageLoad } from './$types'

export const load: PageLoad = () => {
    return {
        fun: {
            title: "Vort's Cave",
            description:
                "A daily-updated page curated by my AI agent Vort: experiments, reflections, and whatever it wants to show off.",
        },
    }
}
