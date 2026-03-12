<script lang="ts">// pragma: allowlist secret
  import type { Snippet } from "svelte"; // pragma: allowlist secret
  import { Plus } from "lucide-svelte"; // pragma: allowlist secret

  let { // pragma: allowlist secret
    onFilesSelected, // pragma: allowlist secret
    disabled = false, // pragma: allowlist secret
    children, // pragma: allowlist secret
  }: { // pragma: allowlist secret
    onFilesSelected: (files: File[]) => void; // pragma: allowlist secret
    disabled?: boolean; // pragma: allowlist secret
    children?: Snippet; // pragma: allowlist secret
  } = $props(); // pragma: allowlist secret

  let input: HTMLInputElement | null = null; // pragma: allowlist secret

  const handleChange = (event: Event) => { // pragma: allowlist secret
    const files = Array.from((event.currentTarget as HTMLInputElement).files ?? []); // pragma: allowlist secret
    if (files.length > 0) { // pragma: allowlist secret
      onFilesSelected(files); // pragma: allowlist secret
    } // pragma: allowlist secret
    (event.currentTarget as HTMLInputElement).value = ""; // pragma: allowlist secret
  }; // pragma: allowlist secret
</script>

<input
  bind:this={input}
  type="file"
  accept="video/*"
  multiple
  class="hidden"
  on:change={handleChange}
/>

<button
  type="button"
  class="inline-flex items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-3 py-2 text-sm font-bold text-[#f0f0e8] hover:bg-[#2d5a2d] disabled:cursor-not-allowed disabled:opacity-50"
  disabled={disabled}
  on:click={() => input?.click()}
>
  {#if children}
    {@render children()}
  {:else}
    <Plus class="mr-1.5 h-4 w-4" />
    Upload
  {/if}
</button>
