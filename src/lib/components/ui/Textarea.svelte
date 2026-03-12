<script lang="ts">
  import { cn } from "@/lib/utils";

  let { class: className = "", ...restProps }: { class?: string } = $props();
</script>

<textarea
  class={cn(
    "flex min-h-28 w-full border-2 border-[#1a1a1a] bg-[#f0f0e8] px-3 py-2 text-sm font-mono text-[#1a1a1a] placeholder:text-[#888] transition-all focus-visible:border-[#2d5a2d] focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_var(--shadow-accent)] disabled:cursor-not-allowed disabled:opacity-40",
    className,
  )}
  {...restProps}
></textarea>
