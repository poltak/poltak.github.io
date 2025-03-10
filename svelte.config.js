import adapter from '@sveltejs/adapter-static'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { mdsvex } from 'mdsvex'

/** @type {import('mdsvex').MdsvexOptions} */
let mdsvexOptions = {
    extensions: ['.md'],
}

/** @type {import('@sveltejs/kit').Config} */
let config = {
    // Consult https://kit.svelte.dev/docs/integrations#preprocessors
    // for more information about preprocessors
    preprocess: [vitePreprocess(), mdsvex(mdsvexOptions)],
    extensions: ['.svelte', ...mdsvexOptions.extensions],
    kit: {
        adapter: adapter({
            // default options are shown. On some platforms
            // these options are set automatically — see below
            pages: 'build',
            assets: 'build',
            fallback: undefined,
            precompress: false,
            strict: true,
        }),
        paths: {
            base: process.argv.includes('dev') ? '' : process.env.BASE_PATH,
        },
    },
}

export default config
