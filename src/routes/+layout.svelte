<script>
    export const prerender = true
    import '../app.css'
</script>

<div class="nav-area nav-split">
    <nav class="nav-bar">
        <a class="nav-link" href="/cv">CV</a>
        <a class="nav-link" href="/">About</a>
        <a class="nav-link" href="/contact">Contact</a>
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
    }

    .content-area {
        grid-column: split / padding-right;
        grid-row: content-top / content-bottom;
        padding: 2rem 5rem;
    }

    .nav-split {
        border-right: 1px solid #000;
        height: 500px;
    }

    .nav-bar {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-end;
        width: 50%;
    }

    .nav-link {
        text-align: right;
        margin: 0.4rem 0;
        padding: 0.6rem 1rem;

        &:hover {
            text-decoration: underline;
        }
    }
</style>
