<script lang="ts">
  import type { Snippet } from "svelte";

  import { cn } from "@/lib/utils";

  let { class: className = "", children }: { class?: string; children?: Snippet } = $props();
</script>

<span
  class={cn(
    "inline-flex items-center border-2 border-[#1a1a1a] bg-[#f0f0e8] px-2 py-1 text-xs font-black uppercase tracking-widest text-[#1a1a1a]",
    className,
  )}
>
  {#if children}
    {@render children()}
  {/if}
</span>
