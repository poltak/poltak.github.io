# poltak.github.io

Personal site built with SvelteKit and deployed as a static GitHub Pages site.

## Requirements

- Node.js version from [.nvmrc](.nvmrc)
- pnpm 11.25.0

## Setup

Enable Corepack so the `packageManager` field selects the pinned pnpm version, then install dependencies:

```bash
corepack enable
pnpm install
```

## Development

Start the local development server:

```bash
pnpm dev
```

Open the server in a browser with:

```bash
pnpm dev --open
```

## Validation and build

Run the Svelte type checks, tests, and formatting check with:

```bash
pnpm check
pnpm test:single
pnpm lint
```

Create and preview a production build with:

```bash
pnpm build
pnpm preview
```

## Deployment

The `deploy` script builds the site and publishes the generated `build/` directory with `gh-pages`:

```bash
pnpm run deploy
```
