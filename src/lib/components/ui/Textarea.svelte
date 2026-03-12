<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLTextareaAttributes } from "svelte/elements";

  interface Props extends HTMLTextareaAttributes {
    class?: string;
  }

  let { class: className, ...rest }: Props = $props();
</script>

<textarea
  class={cn(
    "w-full bg-transparent border-2 border-[#1a1a1a] px-3 py-2 text-sm font-mono text-[#1a1a1a] placeholder:text-[#888] focus:outline-none focus:border-[#2d5a2d] focus:shadow-[4px_4px_0px_0px_var(--shadow-accent)] transition-all resize-none",
    className
  )}
  {...rest}
></textarea>
