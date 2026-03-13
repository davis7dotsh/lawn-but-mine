<script lang="ts">
  import type { Snippet } from "svelte";
  import { X } from "lucide-svelte";

  import { cn } from "@/lib/utils";

  let {
    open = false,
    title = "",
    description = "",
    class: className = "",
    onClose = () => {},
    children,
  }: {
    open?: boolean;
    title?: string;
    description?: string;
    class?: string;
    onClose?: () => void;
    children?: Snippet;
  } = $props();
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    role="presentation"
    onclick={(event) => {
      if (event.currentTarget === event.target) onClose();
    }}
  >
    <div class={cn("w-full max-w-lg border-2 border-[#1a1a1a] bg-[#f0f0e8] shadow-[12px_12px_0px_0px_var(--shadow-color)]", className)}>
      <div class="flex items-start justify-between border-b-2 border-[#1a1a1a] p-5">
        <div>
          {#if title}
            <h2 class="text-2xl font-black uppercase tracking-tight">{title}</h2>
          {/if}
          {#if description}
            <p class="mt-2 text-sm font-medium text-[#888]">{description}</p>
          {/if}
        </div>

        <button
          type="button"
          class="inline-flex h-10 w-10 items-center justify-center border-2 border-[#1a1a1a] transition-colors hover:bg-[#1a1a1a] hover:text-[#f0f0e8]"
          aria-label="Close dialog"
          onclick={onClose}
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <div class="p-5">
        {#if children}
          {@render children()}
        {/if}
      </div>
    </div>
  </div>
{/if}
