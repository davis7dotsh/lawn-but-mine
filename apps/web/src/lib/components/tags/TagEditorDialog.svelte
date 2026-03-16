<script lang="ts">
  import { api } from "@lawn/convex/api";
  import type { Id } from "@lawn/convex/dataModel";
  import { useConvexClient } from "convex-svelte";
  import { Pencil, Trash2 } from "lucide-svelte";

  import Button from "@/lib/components/ui/Button.svelte";
  import Dialog from "@/lib/components/ui/Dialog.svelte";
  import Input from "@/lib/components/ui/Input.svelte";

  type TeamTag = {
    _id: Id<"tags">;
    name: string;
    color: string;
  };

  let {
    open,
    teamId,
    tag = null,
    onOpenChange,
  }: {
    open: boolean;
    teamId: Id<"teams"> | null;
    tag?: TeamTag | null;
    onOpenChange: (open: boolean) => void;
  } = $props();

  const convex = useConvexClient();

  let name = $state("");
  let color = $state("#7CB87C");
  let isSaving = $state(false);
  let isDeleting = $state(false);

  const isEditing = $derived(Boolean(tag));

  $effect(() => {
    if (!open) {
      return;
    }

    name = tag?.name ?? "";
    color = tag?.color ?? "#7CB87C";
  });

  const close = () => onOpenChange(false);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!teamId || !trimmedName || isSaving) {
      return;
    }

    isSaving = true;

    try {
      if (tag) {
        await convex.mutation(api.tags.update, {
          tagId: tag._id,
          name: trimmedName,
          color,
        });
      } else {
        await convex.mutation(api.tags.create, {
          teamId,
          name: trimmedName,
          color,
        });
      }

      close();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not save tag");
    } finally {
      isSaving = false;
    }
  };

  const handleDelete = async () => {
    if (!tag || isDeleting) {
      return;
    }

    if (!window.confirm(`Delete the "${tag.name}" tag? It will be removed from every video.`)) {
      return;
    }

    isDeleting = true;

    try {
      await convex.mutation(api.tags.remove, { tagId: tag._id });
      close();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not delete tag");
    } finally {
      isDeleting = false;
    }
  };
</script>

<Dialog
  {open}
  title={tag ? "Edit Tag" : "Create Tag"}
  description={tag ? "Update the tag name and color for your team." : "Create a reusable tag for this team."}
  onClose={close}
>
  <div class="space-y-4">
    <div class="space-y-2">
      <label class="text-xs font-bold uppercase tracking-[0.18em] text-[#666]" for="tag-name">
        Tag name
      </label>
      <Input
        id="tag-name"
        bind:value={name}
        maxlength="40"
        placeholder="Needs notes"
        onkeydown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void handleSubmit();
          }
        }}
      />
    </div>

    <div class="space-y-2">
      <label class="text-xs font-bold uppercase tracking-[0.18em] text-[#666]" for="tag-color">
        Tag color
      </label>

      <div class="flex items-center gap-3">
        <input
          id="tag-color"
          bind:value={color}
          type="color"
          class="h-12 w-16 cursor-pointer border-2 border-[#1a1a1a] bg-[#f0f0e8] p-1"
        />
        <Input bind:value={color} class="font-mono uppercase" maxlength="7" />
      </div>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
      {#if isEditing}
        <Button variant="destructive" onclick={handleDelete} disabled={isDeleting || isSaving}>
          <Trash2 class="h-4 w-4" />
          {isDeleting ? "Deleting..." : "Delete Tag"}
        </Button>
      {:else}
        <div></div>
      {/if}

      <div class="flex flex-wrap gap-2">
        <Button variant="secondary" onclick={close} disabled={isSaving || isDeleting}>
          Cancel
        </Button>
        <Button onclick={handleSubmit} disabled={!name.trim() || !teamId || isSaving || isDeleting}>
          <Pencil class="h-4 w-4" />
          {isSaving ? (tag ? "Saving..." : "Creating...") : tag ? "Save Tag" : "Create Tag"}
        </Button>
      </div>
    </div>
  </div>
</Dialog>
