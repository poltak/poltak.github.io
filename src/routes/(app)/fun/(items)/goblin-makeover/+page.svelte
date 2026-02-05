<svelte:head>
    <title>Goblin Makeover</title>
</svelte:head>

<section class="terminal">
    <header class="header">
        <div class="title-block">
            <p class="eyebrow">FUN / EXPERIMENT / GOBLIN-MAKEOVER</p>
            <h1>
                <span class="glow">Comrade Jon’s Scrapheap</span>
            </h1>
            <p class="lede">
                A temporary landing page for questionable aesthetics and perfectly legal scavenging.
                Sister-style to Vort’s cave: dark, neon, monospace, and lightly haunted by CRT ghosts.
            </p>
        </div>

        <div class="stamp" aria-label="Build stamp">
            <div class="stamp__top">LOCAL CACHE: WARM</div>
            <div class="stamp__mid">SIGNAL: <span class="ok">GREEN</span></div>
            <div class="stamp__bot">MODE: SCRAPHEAP</div>
        </div>
    </header>

    <div class="grid">
        <section class="panel">
            <h2>Operator Bio</h2>
            <p>
                <strong>Name:</strong> Comrade Jon<br />
                <strong>Known for:</strong> picking up shiny bugs, polishing them, and calling them features.<br />
                <strong>Habitat:</strong> edge nodes, coffee shops, and the space between “ship it” and “why.”
            </p>

            <blockquote class="manifesto">
                “I do not collect hobbies. I collect little systems that hum quietly in the dark.”
            </blockquote>

            <div class="pill-row" aria-label="Scrapheap tags">
                <span class="pill">monospace devotion</span>
                <span class="pill">neon discipline</span>
                <span class="pill">anti-fluff protocol</span>
                <span class="pill">locally haunted</span>
            </div>
        </section>

        <section class="panel">
            <h2>Digital Scavengings</h2>
            <ul class="list">
                <li>
                    <span class="item-title">The Rusty Link Collector</span>
                    <span class="item-desc">— indexes weird corners of the web and labels them like jarred specimens.</span>
                </li>
                <li>
                    <span class="item-title">CRT Weather Oracle</span>
                    <span class="item-desc">— predicts rain using vibes, timestamps, and an unreasonable glow effect.</span>
                </li>
                <li>
                    <span class="item-title">Cache Gremlin Dashboard</span>
                    <span class="item-desc">— a tiny UI that lies politely about performance.</span>
                </li>
                <li>
                    <span class="item-title">The 3AM Refactor Shrine</span>
                    <span class="item-desc">— accepts offerings of TODOs; returns new TODOs, fresher.</span>
                </li>
            </ul>

            <div class="treasure-box">
                <strong>Scrapheap Note:</strong>
                <span>
                    This route is intentionally over-styled. If it breaks your sense of taste, the makeover worked.
                </span>
            </div>
        </section>

        <section class="panel panel--wide">
            <h2>Toolbelt (Fake)</h2>
            <div class="toolbelt">
                <div class="tool">
                    <div class="tool__k">PRIMARY</div>
                    <div class="tool__v"><code>neon-green.css</code></div>
                </div>
                <div class="tool">
                    <div class="tool__k">SECONDARY</div>
                    <div class="tool__v"><code>grunge-noise.png</code> (imaginary)</div>
                </div>
                <div class="tool">
                    <div class="tool__k">RITUAL</div>
                    <div class="tool__v">refresh page, pretend it’s a terminal</div>
                </div>
                <div class="tool">
                    <div class="tool__k">WARNING</div>
                    <div class="tool__v">scanlines are purely cosmetic</div>
                </div>
            </div>
        </section>
    </div>

    <footer class="footer">
        <p>
            <span class="muted">STATUS:</span> stable-ish · <span class="muted">POWER:</span> caffeine ·
            <span class="muted">OUTPUT:</span> green text
        </p>
        <p class="build">
            Scrapheap build stamp: <span class="mono">2026-02-04</span> ·
            <span class="mono">/fun/(items)/goblin-makeover</span>
        </p>
    </footer>
</section>

<style>
    /*
        Sister-style to repo-goblin-experience/index.html
        - dark panels, neon green accents
        - monospace
        - slight CRT/terminal grime

        Svelte scopes styles by default; no :global used.
    */

    .terminal {
        --bg: #0b0e11;
        --panel: #11151a;
        --panel2: #07090b;
        --fg: #c9e1e9;
        --muted: #8fc2ca;
        --goblin: #00d4ff;
        --shadow: #000;

        position: relative;
        padding: clamp(1.25rem, 2.6vw, 2rem);
        border: 2px solid var(--goblin);
        background:
            radial-gradient(1200px 420px at 20% 10%, rgba(0, 212, 255, 0.08), transparent 55%),
            radial-gradient(900px 360px at 75% 25%, rgba(0, 212, 255, 0.06), transparent 55%),
            linear-gradient(180deg, rgba(0, 212, 255, 0.03), transparent 35%),
            var(--panel);
        box-shadow: 10px 10px 0 var(--shadow);
        color: var(--fg);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
            'Courier New', monospace;
        overflow: hidden;
        border-radius: 6px;
        max-width: 980px;
        margin: 0 auto;
    }

    /* CRT scanlines + soft noise */
    .terminal::before {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        background:
            linear-gradient(
                to bottom,
                rgba(255, 255, 255, 0.05) 0px,
                rgba(0, 0, 0, 0.0) 2px,
                rgba(0, 0, 0, 0.0) 4px
            );
        background-size: 100% 6px;
        opacity: 0.08;
        mix-blend-mode: overlay;
    }

    .terminal::after {
        content: '';
        position: absolute;
        inset: -40px;
        pointer-events: none;
        background:
            radial-gradient(circle at 50% 40%, rgba(0, 212, 255, 0.10), transparent 55%),
            repeating-linear-gradient(
                90deg,
                rgba(255, 255, 255, 0.04) 0px,
                rgba(255, 255, 255, 0.04) 1px,
                rgba(0, 0, 0, 0) 2px,
                rgba(0, 0, 0, 0) 6px
            );
        opacity: 0.05;
        filter: blur(0.4px);
    }

    .header {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 1.25rem;
        align-items: start;
        margin-bottom: 1.5rem;
        position: relative;
        z-index: 1;
    }

    .eyebrow {
        margin: 0 0 0.35rem 0;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.18em;
        font-size: 0.75rem;
    }

    h1 {
        margin: 0 0 0.5rem 0;
        color: var(--goblin);
        text-transform: uppercase;
        letter-spacing: 0.18em;
        border-bottom: 2px solid rgba(0, 212, 255, 0.75);
        padding-bottom: 0.65rem;
        text-shadow: 2px 2px 5px var(--shadow);
        animation: flicker 2.2s infinite;
    }

    .lede {
        margin: 0;
        color: var(--fg);
        opacity: 0.9;
        line-height: 1.6;
        max-width: 70ch;
    }

    .glow {
        filter: drop-shadow(0 0 10px rgba(0, 212, 255, 0.35));
    }

    @keyframes flicker {
        0% {
            opacity: 1;
        }
        46% {
            opacity: 0.86;
        }
        53% {
            opacity: 0.98;
        }
        60% {
            opacity: 0.78;
        }
        100% {
            opacity: 1;
        }
    }

    .stamp {
        border: 1px solid rgba(0, 212, 255, 0.8);
        background: linear-gradient(180deg, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.25));
        padding: 0.75rem 0.9rem;
        min-width: 220px;
        box-shadow: 0 0 0 1px rgba(0, 212, 255, 0.15) inset;
    }

    .stamp__top,
    .stamp__mid,
    .stamp__bot {
        font-size: 0.85rem;
        color: var(--muted);
        letter-spacing: 0.08em;
    }

    .ok {
        color: var(--goblin);
        font-weight: 700;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        gap: 1rem;
        position: relative;
        z-index: 1;
    }

    .panel {
        grid-column: span 12;
        background: linear-gradient(180deg, rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.1));
        border: 1px solid rgba(0, 212, 255, 0.35);
        padding: 1rem 1.1rem;
        box-shadow: 0 0 0 1px rgba(0, 212, 255, 0.10) inset;
    }

    .panel h2 {
        margin: 0 0 0.75rem 0;
        color: var(--goblin);
        text-transform: uppercase;
        letter-spacing: 0.14em;
        border-bottom: 1px solid rgba(0, 212, 255, 0.55);
        padding-bottom: 0.4rem;
        text-shadow: 2px 2px 5px var(--shadow);
        animation: flicker 2.6s infinite;
    }

    .manifesto {
        margin: 1rem 0;
        padding: 0.9rem 1rem;
        background: var(--panel2);
        border-left: 5px solid var(--goblin);
        color: var(--goblin);
        font-style: italic;
        position: relative;
    }

    .manifesto::after {
        content: ' 👹';
        opacity: 0.35;
    }

    .pill-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 0.75rem;
    }

    .pill {
        display: inline-block;
        border: 1px dashed rgba(0, 212, 255, 0.55);
        padding: 4px 10px;
        background: #000919;
        color: var(--goblin);
        font-size: 0.85rem;
    }

    .list {
        margin: 0;
        padding-left: 1.1rem;
        color: var(--fg);
    }

    .list li {
        margin-bottom: 0.6rem;
    }

    .item-title {
        color: var(--goblin);
        font-weight: 700;
    }

    .item-desc {
        color: var(--fg);
        opacity: 0.85;
    }

    .treasure-box {
        margin-top: 1rem;
        background: #001122;
        padding: 0.85rem;
        border: 1px solid var(--goblin);
        box-shadow: 0 0 0 1px rgba(0, 212, 255, 0.12) inset;
    }

    .treasure-box strong {
        color: var(--goblin);
    }

    code {
        background: #000;
        color: var(--goblin);
        padding: 2px 6px;
        border: 1px solid rgba(0, 212, 255, 0.25);
    }

    .toolbelt {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
    }

    .tool {
        background: rgba(0, 0, 0, 0.35);
        border: 1px dashed rgba(0, 212, 255, 0.4);
        padding: 0.75rem;
    }

    .tool__k {
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.14em;
        font-size: 0.75rem;
        margin-bottom: 0.35rem;
    }

    .tool__v {
        color: var(--fg);
    }

    .footer {
        margin-top: 1.25rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(0, 255, 65, 0.25);
        color: var(--muted);
        position: relative;
        z-index: 1;
    }

    .build {
        margin: 0.25rem 0 0;
        opacity: 0.8;
    }

    .mono {
        color: var(--goblin);
    }

    .muted {
        color: var(--muted);
    }

    @media (min-width: 860px) {
        .panel {
            grid-column: span 6;
        }
        .panel--wide {
            grid-column: span 12;
        }
    }

    @media (max-width: 520px) {
        .header {
            grid-template-columns: 1fr;
        }
        .stamp {
            min-width: auto;
        }
        h1 {
            letter-spacing: 0.12em;
        }
        .toolbelt {
            grid-template-columns: 1fr;
        }
    }
</style>
