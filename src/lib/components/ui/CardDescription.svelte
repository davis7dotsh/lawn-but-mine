<script lang="ts">
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";
  let { children, class: className }: { children: Snippet; class?: string } = $props();
</script>
<p class={cn("text-sm text-[#888] mt-1", className)}>{@render children()}</p>
