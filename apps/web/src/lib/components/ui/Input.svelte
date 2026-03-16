<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";

  import { cn } from "@/lib/utils";

  let {
    class: className = "",
    value = $bindable(),
    ...restProps
  }: HTMLInputAttributes & {
    class?: string;
    value?: HTMLInputAttributes["value"];
  } = $props();
</script>

<input
  bind:value
  class={cn(
    "flex h-10 w-full border-2 border-[#1a1a1a] bg-[#f0f0e8] px-3 py-2 text-sm font-mono text-[#1a1a1a] placeholder:text-[#888] transition-all focus-visible:border-[#2d5a2d] focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_var(--shadow-accent)] disabled:cursor-not-allowed disabled:opacity-40",
    className,
  )}
  {...restProps}
/>
