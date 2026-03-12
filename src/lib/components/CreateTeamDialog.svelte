<script lang="ts">
  import { useConvexClient } from "convex-svelte";
  import { api } from "@convex/_generated/api";
  import { goto } from "$app/navigation";
  import Dialog from "$lib/components/ui/Dialog.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";

  let { open = $bindable(false) } = $props();
  let name = $state("");
  let isLoading = $state(false);
  const client = useConvexClient();

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    isLoading = true;
    try {
      const result = await client.mutation(api.teams.create, { name: name.trim() });
      open = false;
      name = "";
      goto(`/dashboard/${result.slug}`);
    } catch (err) {
      console.error("Failed to create team:", err);
    } finally {
      isLoading = false;
    }
  }
</script>

<Dialog open={open} onclose={() => (open = false)}>
  <form onsubmit={handleSubmit}>
    <div class="space-y-4">
      <h2 class="text-xl font-black text-[#1a1a1a]">Create a new team</h2>
      <p class="text-[#888]">Teams let you collaborate on video projects with others.</p>
      <Input
        placeholder="Team name"
        value={name}
        oninput={(e) => (name = e.currentTarget.value)}
        disabled={isLoading}
      />
    </div>
    <div class="flex gap-3 mt-6">
      <Button type="button" variant="outline" onclick={() => (open = false)}>Cancel</Button>
      <Button type="submit" disabled={!name.trim() || isLoading}>
        {isLoading ? "Creating..." : "Create team"}
      </Button>
    </div>
  </form>
</Dialog>
