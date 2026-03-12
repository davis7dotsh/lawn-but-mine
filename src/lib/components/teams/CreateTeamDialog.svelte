<script lang="ts">
  import { goto } from "$app/navigation"; 
  import { api } from "@convex/_generated/api"; 
  import { useConvexClient } from "convex-svelte"; 
  import { Plus, X } from "lucide-svelte"; 
  import { teamHomePath } from "@/lib/routes"; 

  let { 
    open, 
    onOpenChange, 
  }: { 
    open: boolean; 
    onOpenChange: (open: boolean) => void; 
  } = $props(); 

  const convex = useConvexClient(); 
  let name = $state(""); 
  let isLoading = $state(false); 
  let input: HTMLInputElement | null = null; 

  $effect(() => { 
    if (!open || !input) return; 
    queueMicrotask(() => input?.focus()); 
  }); 

  const handleSubmit = async (event: SubmitEvent) => { 
    event.preventDefault(); 
    if (!name.trim()) return; 

    isLoading = true; 
    try { 
      const createdTeam = await convex.mutation(api.teams.create, { 
        name: name.trim(), 
      }); 
      name = ""; 
      onOpenChange(false); 
      await goto(teamHomePath(createdTeam.slug)); 
    } finally { 
      isLoading = false; 
    } 
  }; 
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <button
      type="button"
      class="absolute inset-0 bg-[#1a1a1a]/40"
      aria-label="Close create team dialog"
      on:click={() => onOpenChange(false)}
    ></button>

    <div class="relative w-full max-w-md border-2 border-[#1a1a1a] bg-[#f0f0e8] p-6 shadow-[8px_8px_0px_0px_var(--shadow-color)]">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-lg font-black text-[#1a1a1a]">Create a new team</h2>
          <p class="mt-1 text-sm text-[#888]">
            Teams let you collaborate on video projects with others.
          </p>
        </div>
        <button
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center border-2 border-[#1a1a1a] hover:bg-[#e8e8e0]"
          aria-label="Close"
          on:click={() => onOpenChange(false)}
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <form class="mt-6" on:submit={handleSubmit}>
        <input
          bind:this={input}
          bind:value={name}
          type="text"
          placeholder="Team name"
          class="w-full border-2 border-[#1a1a1a] bg-[#f0f0e8] px-3 py-2 text-sm text-[#1a1a1a] outline-none"
        />

        <div class="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            class="inline-flex items-center justify-center border-2 border-[#1a1a1a] px-3 py-2 text-sm font-bold text-[#1a1a1a] hover:bg-[#e8e8e0]"
            on:click={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            type="submit"
            class="inline-flex items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-3 py-2 text-sm font-bold text-[#f0f0e8] hover:bg-[#2d5a2d] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!name.trim() || isLoading}
          >
            <Plus class="mr-1.5 h-4 w-4" />
            {isLoading ? "Creating..." : "Create team"}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
