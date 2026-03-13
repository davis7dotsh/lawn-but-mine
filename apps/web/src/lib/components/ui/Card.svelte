<script lang="ts">
  import type { Snippet } from "svelte";

  import { cn } from "@/lib/utils";

  let { class: className = "", children }: { class?: string; children?: Snippet } = $props();
</script>

<div
  class={cn(
    "border-2 border-[#1a1a1a] bg-[#f0f0e8] shadow-[8px_8px_0px_0px_var(--shadow-color)]",
    className,
  )}
>
  {#if children}
    {@render children()}
  {/if}
</div>
