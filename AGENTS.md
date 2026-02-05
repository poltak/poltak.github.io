# AGENTS.md

Quickstart for fresh sessions in personal webiste `poltak.github.io`.

## Project Summary

- SvelteKit site deployed as static GitHub Pages.
- Uses Svelte 5 syntax.
- Routes live under `src/routes` with `(app)` grouping for site pages.
- Shared layout with sidebar nav is `src/routes/+layout.svelte` and global styles in `src/app.css`.
- “Fun” subpages live under `src/routes/(app)/fun/(items)` and inherit a shared fun layout.

## Dev Commands

- `npm run dev` – local dev server
- `npm run check` – type + Svelte check
- `npm run build` – production build
- `npm run format` – prettier

## Important Routing Layout

- Fun landing: `src/routes/(app)/fun/+page.svelte`
- Shared fun header/layout: `src/routes/(app)/fun/(items)/+layout.svelte`
- Fun subpages (examples):
  - `kindle-highlights` – converter
  - `kindle-highlights-viewer` – viewer with search & filters
  - `goblin-experience` (Vort’s Cave - separate project's GH pages)
- Wrapper routes exist for non-fun pages to appear under `/fun/*`.

## Static Assets

- Public files go under `static/` and are served from root.

## Styling Notes

- Global styles in `src/app.css`.

## Icons

- Custom SVG icons defined in `src/lib/components/icons/Icon.svelte` and `types.ts`.
- Custom `highlight` icon added for Kindle Clippings Viewer card.

## Svelte Runes Mode

- This project uses Svelte 5 runes mode; avoid `$:` in components under runes unless valid. Prefer `$derived` or proper reactive blocks as currently used in components.

