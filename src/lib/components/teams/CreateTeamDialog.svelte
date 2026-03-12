<script lang="ts">// pragma: allowlist secret
  import { goto } from "$app/navigation"; // pragma: allowlist secret
  import { api } from "@convex/_generated/api"; // pragma: allowlist secret
  import { useConvexClient } from "convex-svelte"; // pragma: allowlist secret
  import { Plus, X } from "lucide-svelte"; // pragma: allowlist secret
  import { teamHomePath } from "@/lib/routes"; // pragma: allowlist secret

  let { // pragma: allowlist secret
    open, // pragma: allowlist secret
    onOpenChange, // pragma: allowlist secret
  }: { // pragma: allowlist secret
    open: boolean; // pragma: allowlist secret
    onOpenChange: (open: boolean) => void; // pragma: allowlist secret
  } = $props(); // pragma: allowlist secret

  const convex = useConvexClient(); // pragma: allowlist secret
  let name = $state(""); // pragma: allowlist secret
  let isLoading = $state(false); // pragma: allowlist secret
  let input: HTMLInputElement | null = null; // pragma: allowlist secret

  $effect(() => { // pragma: allowlist secret
    if (!open || !input) return; // pragma: allowlist secret
    queueMicrotask(() => input?.focus()); // pragma: allowlist secret
  }); // pragma: allowlist secret

  const handleSubmit = async (event: SubmitEvent) => { // pragma: allowlist secret
    event.preventDefault(); // pragma: allowlist secret
    if (!name.trim()) return; // pragma: allowlist secret

    isLoading = true; // pragma: allowlist secret
    try { // pragma: allowlist secret
      const createdTeam = await convex.mutation(api.teams.create, { // pragma: allowlist secret
        name: name.trim(), // pragma: allowlist secret
      }); // pragma: allowlist secret
      name = ""; // pragma: allowlist secret
      onOpenChange(false); // pragma: allowlist secret
      await goto(teamHomePath(createdTeam.slug)); // pragma: allowlist secret
    } finally { // pragma: allowlist secret
      isLoading = false; // pragma: allowlist secret
    } // pragma: allowlist secret
  }; // pragma: allowlist secret
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
