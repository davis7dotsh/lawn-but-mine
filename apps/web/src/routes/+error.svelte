<script lang="ts">
  import NotFound from "@/lib/components/NotFound.svelte";

  let { error, status } = $props();
</script>

{#if status === 404}
  <NotFound />
{:else}
  <main class="container mx-auto p-4 pt-16">
    <h1 class="text-3xl font-black uppercase tracking-tight">Error</h1>
    <p class="mt-4">{error instanceof Error ? error.message : "An unexpected error occurred."}</p>
    {#if import.meta.env.DEV && error instanceof Error && error.stack}
      <pre class="mt-6 w-full overflow-x-auto p-4"><code>{error.stack}</code></pre>
    {/if}
  </main>
{/if}
