<script lang="ts">
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";
  let { children, class: className }: { children: Snippet; class?: string } = $props();
</script>
<h3 class={cn("text-lg font-black text-[#1a1a1a]", className)}>{@render children()}</h3>
