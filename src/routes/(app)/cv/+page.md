<script>
    const handlePrint = () => {
        if (typeof window !== 'undefined') {
            window.print()
        }
    }
</script>

<section class="cv-hero">
    <p class="cv-prompt">&gt;_</p>
    <h1>Resume</h1>
    <p class="cv-section-index">02 / RESUME</p>
</section>

<div class="cv-actions">
    <button class="cv-download" on:click={handlePrint}>Download PDF</button>
</div>

<details open>
<summary>

## Work experience

</summary>

<details open>
<summary>

### [Suppstacks](https://suppstacks.store/)

<br />
</summary>

A curated knowledge base of >200 supplements and >1000 supplement brands using many
different data sources ingested from all over the Internet. Monetized by affiliate links
to products on Amazon.

Full-Stack Web Developer: _2025 - now_

_**Platforms:** Web app (TypeScript, React, Cloudflare)_

#### Highlights

- Came up with novel ways of managing the knowledge base data without using a database and avoiding Airtable API fees.
- Learning to automate the process of data ingestion using AI tools.

<br />
</details>

<details open>
<summary>

### [Space/Time](https://findspacetime.com)

<br />
</summary>

A service to notify you when your travel plans overlap with friends and associates in your communities.

Full-Stack Web+Mobile Developer: _2024 - 2025_

_**Platforms:** iOS + Android (React Native), web app_

#### Highlights

- Going from nothing to a working app in 2 weeks.
- Learning how to use Supabase after years of using Firebase.

<br />
</details>

<details open>
<summary>

### WalkyTalky

<br />
</summary>

iOS app for automating the processes of summarizing and retrieving information from your audio recordings.

iOS Developer: _2024_

_**Platforms:** iOS_

#### Highlights

- Learning how to build a native iOS app in a new language (Swift).
- Going from nothing to a working app in 4 weeks.
- Designing the app to store everything locally, to avoid needing a server.

<br />
</details>

<details open>
<summary>

### [Memex](https://memex.garden/)

</summary>

Software for organizing, recalling, sharing, and collaboration with your online knowledge.

Full-Stack Web+Mobile Developer: _2017 - now_

_**Platforms:** Web extension, iOS + Android (React Native), web app_

#### Highlights

- Working and coordinating in a fully remote team, with members located over 4 different continents.
- Managing a large codebase with a large amount of TypeScript code shared, running over 5 different platforms: iOS, Android, browser, Node, Firebase, Cloudflare.
- Learning the importance of automated testing.

<br />
</details>

<details open>
<summary>

### [Rocket Launcher](https://timotiousprime.itch.io/rocket-launcher)

</summary>

Browser-based "edutainment" game to teach kids fraction addition in a fun setting. Developed as an entry into the 2021 Odin Project Game Jam.

Frontend Web Developer / Game Designer: _2021_

#### Highlights

- Building it in 100% browser-native tech. No transpilation or build tools.
- First time building a game. Had to learn how to do level design and ways to make the gameplay fun and compelling while still having an educational focus.
- Achieving 3rd place out of 37 entries in the competition.

<br />
</details>

<details open>
<summary>

### Prezly

</summary>

CRM software for PR teams.

Frontend Web Developer: _2016_

#### Highlights

- First time working on a big, established project where I had to figure out how things already worked to add my own contributions.
- First time working with a fully remote team.
- Learning how to use Draft.js to build a highly customizable text editor.

<br />
</details>

<details open>
<summary>

### Sportistics WhichTeam

</summary>

Mobile app for sharing and discussing football tips.

Full-stack Web+Mobile Developer: _2015-2017_

_**Platforms:** iOS + Android app (Cordova + MeteorJS)_

#### Highlights

- First real project where we built up an active user base from nothing.
- Being able to put a lot of tech (JS ES6, CSS, MongoDB, Docker) that I had tinkered with and spent a lot of time reading about into real use.
- Having to constantly learn new tech to be able to solve different problems that came up.

<br />
</details>
</details>

<details open>
<summary>

## Education

</summary>

<details open>
<summary>

### Monash University

</summary>

Bachelor of Computer Science (First Class Honours): _2010 - 2015_

#### Highlights

- Failing first year discrete math with an 8% grade to confidently passing it in second year with 98% grade.
- Achieving a scholarship to do a research semester at UC San Diego.
- Achieving a scholarship to study Mandarin for a semester at National Taiwan Normal University in Taipei.
- Working as a TA, teaching undergrad programming and operating systems classes in my final year.
- Getting a paper published based on the work I did as part of my final Honours year research thesis.

<br />
</details>
</details>

<details open>
<summary>

## Skills

</summary>

<details open>
<summary>

### Tools and Technologies

</summary>

<div class="skill-lists">

- Web:
    - Web Extension APIs
    - Chrome Manifest v3
    - IndexedDB
    - React
    - React Native
    - Javascript / Typescript
    - Node
    - SvelteKit
    - Jest
    - TDD
- Cloud Infrastructure:
    - Docker + Docker compose
    - Firebase (Firestore, Functions, Hosting, Auth, Cloud Messaging, Realtime DB)
    - Supabase (PostgreSQL, Edge Functions)
    - Pocketbase
    - Cloudflare (Workers, KV, Domains, R2, D1)
- Software Design and Architecture:
    - Algorithm design and analysis
    - Database design
    - API design
    - Scalable code architecture

</div>

<br />
</details>

<details open>
<summary>

### Languages

</summary>

<div class="skill-lists">

- English: native
- Vietnamese: conversational
- Indonesian: conversational
- Mandarin: elementary

</div>

</details>
</details>

<style>
    :global(.content-wrapper:has(.cv-hero)) {
        max-width: 1120px;
    }

    :global(.content-wrapper:has(.cv-hero)),
    :global(.content-wrapper:has(.cv-hero) *) {
        font-family: var(--font-mono);
    }

    .cv-actions {
        display: flex;
        grid-column: 2 / -1;
        justify-content: flex-end;
        margin: -0.35rem 0 0;
    }

    .cv-download {
        border: 1px solid var(--c-border);
        background: transparent;
        color: var(--c-primary);
        padding: 0.75rem 1.35rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        cursor: pointer;
        box-shadow: none;
    }

    .cv-download:hover {
        background: var(--c-primary-light);
    }

    .cv-hero {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: baseline;
        column-gap: 1.5rem;
        row-gap: 0.85rem;
        margin: 0 0 2rem;
        padding: 0 0 0.9rem;
        border-bottom: 1px dashed var(--c-border-dashed);
    }

    .cv-prompt,
    .cv-section-index {
        color: var(--c-primary);
        font-weight: 800;
        letter-spacing: 0.08em;
        margin: 0;
        text-transform: uppercase;
    }

    .cv-hero h1 {
        color: var(--c-text);
        font-family: var(--font-sans);
        font-size: clamp(2.75rem, 7vw, 4.25rem);
        font-weight: 400;
        margin: 0;
        letter-spacing: 0.04em;
    }

    h2 {
        color: var(--c-primary);
        font-family: var(--font-mono);
        font-size: 1.35rem;
        font-weight: 800;
        letter-spacing: 0.02em;
    }

    h2, h3, h4 {
        display: inline-block;
    }

    details > summary ~ * {
        @media screen and (max-width: 768px) {
            margin-left: 1rem;
        }
    }

    .skill-lists > ul {
        margin-top: 0.5rem;
        margin-left: 0;
    }

    h4 {
        color: var(--c-text-muted);
        font-family: var(--font-mono);
        font-size: 0.88rem;
        letter-spacing: 0.08em;
        margin-top: 0.5rem;
        margin-bottom: 0;
        text-transform: uppercase;
    }

    details {
        background: transparent;
        border: none;
        border-radius: 0;
        box-shadow: none;
    }

    details > summary {
        border: none;
        padding: 0;
    }

    details > summary::after {
        display: none;
    }

    details details {
        border: 1px solid var(--c-border);
        margin: 1rem 0;
        padding: 0;
    }

    details details summary {
        display: grid;
        grid-template-columns: 5.5rem 1fr auto;
        gap: 1.5rem;
        align-items: center;
        min-height: 5.4rem;
        padding: 1rem 1.5rem;
        border-bottom: 1px dashed var(--c-border-dashed);
    }

    details details summary::before {
        content: '▰';
        display: grid;
        place-items: center;
        width: 4.5rem;
        height: 4.5rem;
        color: var(--c-primary);
        border: 1px solid var(--c-border);
        font-size: 2rem;
        line-height: 1;
    }

    details details summary br {
        display: none;
    }

    details details summary::after {
        display: block;
        color: var(--c-text-light);
        grid-column: 3;
        grid-row: 1;
    }

    details details h3 {
        color: var(--c-primary);
        font-family: var(--font-mono);
        font-size: 1.35rem;
        font-weight: 800;
        margin: 0;
    }

    details details h3 a {
        color: inherit;
    }

    details details > *:not(summary) {
        margin: 1.35rem 2rem 1.8rem 7rem;
        max-width: 86ch;
    }

    details details p {
        color: var(--c-text-light);
        line-height: 1.65;
    }

    details details p strong,
    details details p em {
        color: var(--c-primary);
    }

    details details ul {
        color: var(--c-text-light);
        padding-left: 1.1rem;
    }

    details details li::marker {
        color: var(--c-primary);
    }

    @media screen and (max-width: 768px) {
        .cv-hero {
            grid-template-columns: 1fr;
            gap: 0.5rem;
        }

        .cv-actions {
            grid-column: 1;
            margin-top: 0.25rem;
        }

        details details summary {
            grid-template-columns: 1fr auto;
        }

        details details summary::before {
            display: none;
        }

        details details > *:not(summary) {
            margin: 1.25rem;
        }
    }
</style>
