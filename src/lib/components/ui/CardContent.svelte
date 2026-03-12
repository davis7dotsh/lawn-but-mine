<script lang="ts">
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";
  let { children, class: className }: { children: Snippet; class?: string } = $props();
</script>
<div class={cn("px-6 pb-6", className)}>{@render children()}</div>
