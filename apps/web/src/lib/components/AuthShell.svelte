<script lang="ts">
  import type { Snippet } from "svelte";

  let { children }: { children?: Snippet } = $props();
</script>

<div class="relative flex min-h-screen items-center justify-center bg-[#f0f0e8]">
  <div
    class="pointer-events-none absolute inset-0 opacity-[0.03]"
    style={"background-image:\n            linear-gradient(#1a1a1a 1px, transparent 1px),\n            linear-gradient(90deg, #1a1a1a 1px, transparent 1px);\n          background-size: 60px 60px;"}
  ></div>

  <div class="relative z-10 w-full max-w-md px-4">
    <div class="mb-8 text-center">
      <a href="/" class="inline-block" data-sveltekit-preload-data="hover">
        <span class="text-4xl font-black text-[#1a1a1a]">lawn</span>
      </a>
      <p class="mt-3 text-sm text-[#888]">Video collaboration, simplified</p>
    </div>

    {#if children}
      {@render children()}
    {/if}
  </div>
</div>
