<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    open: boolean;
    onclose?: () => void;
    children: Snippet;
  }

  let { open, onclose, children }: Props = $props();

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) onclose?.();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") onclose?.();
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center"
    role="dialog"
    aria-modal="true"
    onkeydown={handleKeydown}
  >
    <div class="fixed inset-0 bg-[#1a1a1a]/50" onclick={handleBackdropClick} role="presentation"></div>
    <div class="relative z-10 w-full max-w-md mx-4 bg-[#f0f0e8] border-2 border-[#1a1a1a] shadow-[8px_8px_0px_0px_var(--shadow-color)] p-6">
      {@render children()}
    </div>
  </div>
{/if}
