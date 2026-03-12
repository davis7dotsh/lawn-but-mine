<script lang="ts">
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
    class?: string;
    onclick?: (e: MouseEvent) => void;
  }

  let { children, class: className, onclick }: Props = $props();
</script>

<div
  class={cn("border-2 border-[#1a1a1a] bg-[#f0f0e8] shadow-[4px_4px_0px_0px_var(--shadow-color)]", className)}
  role={onclick ? "button" : undefined}
  tabindex={onclick ? 0 : undefined}
  onclick={onclick}
  onkeydown={onclick ? (e) => { if (e.key === "Enter" || e.key === " ") onclick?.(e as unknown as MouseEvent); } : undefined}
>
  {@render children()}
</div>
