<script lang="ts">
    let { children } = $props()
</script>

<div class="text-content-area">
    {@render children?.()}
</div>

<style>
    .text-content-area {
        max-width: 720px;
    }
</style>
