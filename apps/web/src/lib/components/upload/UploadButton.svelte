<script lang="ts">
  import type { Snippet } from "svelte"; 
  import { Plus } from "lucide-svelte"; 

  let { 
    onFilesSelected, 
    disabled = false, 
    children, 
  }: { 
    onFilesSelected: (files: File[]) => void; 
    disabled?: boolean; 
    children?: Snippet; 
  } = $props(); 

  let input: HTMLInputElement | null = null; 

  const handleChange = (event: Event) => { 
    const files = Array.from((event.currentTarget as HTMLInputElement).files ?? []); 
    if (files.length > 0) { 
      onFilesSelected(files); 
    } 
    (event.currentTarget as HTMLInputElement).value = ""; 
  }; 
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
