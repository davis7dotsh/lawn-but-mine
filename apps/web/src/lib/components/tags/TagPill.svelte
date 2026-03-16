<script lang="ts">
  import { cn } from "@/lib/utils";

  type Tag = {
    _id: string;
    name: string;
    color: string;
  };

  let {
    tag,
    active = false,
    compact = false,
    count,
    class: className = "",
    onclick,
  }: {
    tag: Tag;
    active?: boolean;
    compact?: boolean;
    count?: number;
    class?: string;
    onclick?: (event: MouseEvent) => void;
  } = $props();

  const classes = $derived(
    cn(
      "inline-flex items-center gap-1.5 text-[#1a1a1a] transition-colors",
      compact ? "text-[10px]" : "text-[11px]",
      onclick ? "cursor-pointer hover:text-[#2d5a2d]" : "",
      active ? "font-bold" : "font-medium",
      className,
    ),
  );
</script>

{#if onclick}
  <button type="button" class={classes} onclick={onclick}>
    <span
      class={cn("h-2 w-2 shrink-0 rounded-full", active && "ring-1 ring-[#1a1a1a] ring-offset-1 ring-offset-[#f0f0e8]")}
      style:background-color={tag.color}
    ></span>
    <span class="truncate">{tag.name}</span>
    {#if count !== undefined}
      <span class="text-[#888]">{count}</span>
    {/if}
  </button>
{:else}
  <span class={classes}>
    <span
      class={cn("h-2 w-2 shrink-0 rounded-full", active && "ring-1 ring-[#1a1a1a] ring-offset-1 ring-offset-[#f0f0e8]")}
      style:background-color={tag.color}
    ></span>
    <span class="truncate">{tag.name}</span>
    {#if count !== undefined}
      <span class="text-[#888]">{count}</span>
    {/if}
  </span>
{/if}
