# Code audit — 12 September 2026

All confirmed findings from this audit are fixed. The work has 15 code and test commits, with this report in a separate commit. The audit started at `e775d27`. No dependencies were added. The commits are local; nothing was pushed or deployed.

The review covered the application routes, shared layout, reader engine and speech controls, EPUB storage, clippings tools, maze algorithms, classifier functions, service worker, tests, and build setup. The focus was incorrect results, slow repeated work, resource cleanup, stale asynchronous results, and unnecessary code. This was a code and runtime review, not an exhaustive security assessment.

The existing home-page edit in `src/routes/(app)/+page.md` was kept unchanged and excluded from all audit commits.

| Area                          | Finding and fix                                                                                                                                                                                                                                                                                                            | Commit    |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Classifier                    | Scores omitted the bias. Input checks accepted inconsistent row sizes and invalid labels. Apply the bias, validate dimensions and loss inputs, and sum loss without an extra array.                                                                                                                                        | `31b437b` |
| Maze generation               | Repeated array scans made larger mazes slow. Random sort also gave a biased shuffle. Use visited sets, constant-time removal of frontier walls, Fisher–Yates shuffling, and union-find with path compression. Reject invalid dimensions before allocation and keep the previous maze on invalid input.                     | `04d989f` |
| EPUB storage                  | Library lists loaded full book text. Progress writes read and rewrote the book payload. Add a metadata store with a version 1 to version 2 migration. Read summaries for the library, batch progress reads, and load full text only for the selected book. Keep large immutable reader data outside deep reactive proxies. | `fded292` |
| Reader progress               | Dialog changes could stop the engine, and completion or route exit could lose the latest position. Separate dialog state from engine cleanup, save the live engine position, stop the save timer when reading stops, and refresh library progress after returning.                                                         | `0a37e95` |
| Reader loads                  | An older book load could replace a newer selection. Use request identifiers and disposal checks to reject stale results. Clear failed import state and count words from parsed chapter metadata.                                                                                                                           | `831d349` |
| Clippings search              | Page changes repeated search work. Highlighting through HTML strings also damaged matches in escaped text. Build the index once per file, separate search from pagination, and render escaped text fragments with highlight elements. Remove duplicate search fields and unused filter code.                               | `eb5dd61` |
| Clippings loading and storage | Saved data, site data, and uploads could overwrite each other out of order. Database read failures could leave connections open. Give an explicit site source priority, cancel obsolete requests, reject stale file reads, and close database connections on every path.                                                   | `90bd597` |
| Converter resources           | Download object URLs survived route exit, and a slow file read could restore cleared content. Revoke object URLs on cleanup and reject cancelled file reads.                                                                                                                                                               | `c787fa8` |
| Theme controls                | Touch clicks conflicted with hover behavior. Blocked browser storage could also break initialization. Use pointer-aware controls, explicit panel state, safe preference storage, Escape handling, and focus control. Remove the hover rule that hid the toggle before a touch click completed.                             | `fb127d5` |
| Offline cache                 | The reader cached unrelated pages and public documents. Global cache lookup could return a file from another build. Cache the reader shell, reader static resources, icons, and immutable build assets; use the current build cache for lookup. EPUB files remain in IndexedDB.                                            | `f9c34f7` |
| Speech rate                   | A rate change restarted the chapter, and a paused rate change could resume the old utterance. Restart from the current text chunk and invalidate old callbacks before cancellation.                                                                                                                                        | `7cf546f` |
| Test integration              | The added worker test brought worker code into the browser TypeScript project. Declare its worker context and remove an unsupported role-query option.                                                                                                                                                                     | `b30e66a` |
| Formatting                    | Two existing files failed the repository format check. Apply the existing Prettier rules to the deployment workflow and search article. Both changes were checked against Prettier output from their original content.                                                                                                     | `640cc7d` |
| Project cards                 | CSS appended hex opacity digits to CSS variables, which produced invalid colors. Use `color-mix`, remove the hidden duplicate heading, and remove obsolete placeholder text.                                                                                                                                               | `aa8e9a3` |
| Keyboard uploads              | Hidden file inputs could not receive keyboard focus. Keep both clippings inputs focusable and add visible focus rings.                                                                                                                                                                                                     | `275bc83` |

Maze measurements used a 100 × 100 grid, the same fixed seed, one warm-up run, and the median of five measured runs for each implementation. These are local algorithm times; they exclude DOM rendering.

| Algorithm          |    Before |   After | Reduction |
| ------------------ | --------: | ------: | --------: |
| Depth-first search | 241.64 ms | 6.54 ms |     97.3% |
| Prim               | 184.28 ms | 5.41 ms |     97.1% |
| Kruskal            |  34.25 ms | 5.07 ms |     85.2% |

A native Chrome IndexedDB check migrated a version 1 book with 2,500,000 text characters. It preserved the text and reading position. The library returned a 168-byte summary instead of the book payload. Instrumented storage calls confirmed that listing books and saving progress did not access the full-book store. Save, full-book retrieval, and deletion also passed.

The final production browser check cached 50 resources with a combined response size of 550,282 bytes. It confirmed that clippings, resumes, the search article, and EPUB files were absent from that cache. Immutable build chunks are still cached together to support offline application loading.

Validation results:

- `pnpm check`: zero errors and zero warnings.
- `pnpm test:single`: 159 tests passed across 20 files, up from 93 tests across 14 files before the audit.
- `pnpm lint`: all files passed the existing format rules.
- `pnpm build`: the static production build passed.
- Production Chrome with touch input: open the theme picker, choose a theme, and dismiss the panel by tapping outside it.
- Production Chrome offline: migrate a saved book, reload without network access, open the book, finish reading, and confirm 100% progress in the library.
- Production Chrome with keyboard input: focus each clippings upload control, open its file chooser with Enter, upload a clipping, and confirm parsed output. Search highlighting also passed in the viewer.
- Production Chrome layout: all seven project icons had valid background and border colors, and the Fun page contained one heading at level 1.
- No page exceptions occurred in these production browser flows.

The browser checks used local Chrome and touch emulation. They do not establish performance on every device or prove a deployed release. The parser API, EPUB data shape, voice deduplication, reader-only PWA scope, and seeded maze controls were preserved.
