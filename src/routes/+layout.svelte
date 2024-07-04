<script>
    import '../app.css'
    import { base } from '$app/paths'
</script>

<div class="nav-area nav-split">
    <nav class="nav-bar">
        <a class="nav-link" href="{base}/">About</a>
        <a class="nav-link" href="{base}/cv">Résumé</a>
        <a class="nav-link" href="{base}/contact">Contact</a>
    </nav>
    <!-- <div class="nav-split"></div> -->
</div>

<div class="content-area">
    <slot></slot>
</div>

<style>
    .nav-area {
        display: flex;
        justify-content: flex-end;
        grid-column: padding-left / split;
        grid-row: content-top / content-bottom;
        padding-right: 2.5rem;

        @media screen and (max-width: 768px) {
            padding-right: unset;
        }
    }

    .content-area {
        grid-column: split / padding-right;
        grid-row: content-top / content-bottom;
        padding: 2rem 5rem;

        @media screen and (max-width: 768px) {
            padding: 2rem 1rem;
        }
    }

    .nav-split {
        border-right: 1px solid #000;
        height: 500px;

        @media screen and (max-width: 768px) {
            border-bottom: 1px solid #000;
            border-right: unset;
            height: unset;
        }
    }

    .nav-bar {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-end;
        width: 50%;

        @media screen and (max-width: 768px) {
            flex-direction: row;
            align-items: center;
            width: 100%;
        }
    }

    .nav-link {
        text-align: right;
        margin: 0.4rem 0;
        padding: 0.6rem 1rem;
        text-decoration: none;
        color: #000;

        &:hover {
            text-decoration: underline;
        }
    }
</style>
