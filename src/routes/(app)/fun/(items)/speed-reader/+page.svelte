<script lang="ts">
    import { base } from '$app/paths'
    import { onMount } from 'svelte'
    import Page from '../../../../speed-reader/+page.svelte'

    const speedReaderScope = `${base}/fun/speed-reader/`

    onMount(() => {
        if (import.meta.env.DEV || !('serviceWorker' in navigator)) return

        void navigator.serviceWorker
            .register(`${base}/service-worker.js`, { scope: speedReaderScope })
            .catch((error) => {
                console.warn('Failed to register the speed reader service worker:', error)
            })
    })
</script>

<svelte:head>
    <link rel="manifest" href={`${base}/fun/speed-reader/manifest.webmanifest`} />
    <link rel="apple-touch-icon" sizes="192x192" href={`${base}/icons/icon-192.png`} />
    <meta name="application-name" content="Jon's EPUB Speed Reader" />
    <meta name="theme-color" content="#070d0d" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="Speed Reader" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
</svelte:head>

<Page />
