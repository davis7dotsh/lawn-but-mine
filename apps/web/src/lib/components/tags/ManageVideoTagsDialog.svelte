<script lang="ts">
  import { api } from "@lawn/convex/api";
  import type { Id } from "@lawn/convex/dataModel";
  import { useConvexClient, useQuery } from "convex-svelte";
  import { Check, Minus, Plus } from "lucide-svelte";

  import Button from "@/lib/components/ui/Button.svelte";
  import Dialog from "@/lib/components/ui/Dialog.svelte";
  import TagEditorDialog from "@/lib/components/tags/TagEditorDialog.svelte";
  import TagPill from "@/lib/components/tags/TagPill.svelte";

  type VideoTag = {
    _id: Id<"tags">;
    name: string;
    color: string;
  };

  type SelectedVideo = {
    _id: Id<"videos">;
    title: string;
    tags: VideoTag[];
  };

  type TeamTag = VideoTag & {
    videoCount: number;
  };

  let {
    open,
    projectId,
    teamId,
    selectedVideos,
    onOpenChange,
  }: {
    open: boolean;
    projectId: Id<"projects"> | null;
    teamId: Id<"teams"> | null;
    selectedVideos: SelectedVideo[];
    onOpenChange: (open: boolean) => void;
  } = $props();

  const convex = useConvexClient();
  const tagsQuery = useQuery(api.tags.listForProject, () =>
    open && projectId ? { projectId } : "skip",
  );

  let isApplying = $state(false);
  let editorOpen = $state(false);
  let editingTag = $state<TeamTag | null>(null);

  const selectedVideoIds = $derived(selectedVideos.map((video) => video._id));
  const selectedCount = $derived(selectedVideos.length);

  const tagCoverage = $derived.by(() => {
    const counts = new Map<Id<"tags">, number>();

    for (const video of selectedVideos) {
      for (const tag of video.tags) {
        counts.set(tag._id, (counts.get(tag._id) ?? 0) + 1);
      }
    }

    return counts;
  });

  const close = () => onOpenChange(false);

  const openCreateDialog = () => {
    editingTag = null;
    editorOpen = true;
  };

  const openEditDialog = (tag: TeamTag) => {
    editingTag = tag;
    editorOpen = true;
  };

  const toggleTag = async (tagId: Id<"tags">, assignedToAll: boolean) => {
    if (selectedVideoIds.length === 0 || isApplying) {
      return;
    }

    isApplying = true;

    try {
      await convex.mutation(api.tags.applyToVideos, {
        videoIds: selectedVideoIds,
        addTagIds: assignedToAll ? [] : [tagId],
        removeTagIds: assignedToAll ? [tagId] : [],
      });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not update tags");
    } finally {
      isApplying = false;
    }
  };
</script>

<Dialog
  {open}
  title="Manage Tags"
  description={`${selectedCount} video${selectedCount === 1 ? "" : "s"} selected`}
  onClose={close}
>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3 text-xs text-[#888]">
      <p class="truncate">
        {selectedVideos.slice(0, 3).map((video) => video.title).join(", ")}
        {#if selectedVideos.length > 3}
          <span> +{selectedVideos.length - 3} more</span>
        {/if}
      </p>

      <button
        type="button"
        class="shrink-0 text-[11px] text-[#888] hover:text-[#1a1a1a]"
        onclick={openCreateDialog}
        disabled={!teamId}
      >+ new tag</button>
    </div>

    {#if tagsQuery.data === undefined}
      <p class="py-4 text-sm text-[#888]">Loading tags...</p>
    {:else if tagsQuery.data.length === 0}
      <div class="border border-dashed border-[#ccc] px-4 py-6 text-center">
        <p class="text-sm text-[#888]">No tags yet</p>
      </div>
    {:else}
      <div class="divide-y divide-[#ccc]">
        {#each tagsQuery.data as tag (tag._id)}
          {@const assignedCount = tagCoverage.get(tag._id) ?? 0}
          {@const assignedToAll = selectedCount > 0 && assignedCount === selectedCount}
          {@const assignedToSome = assignedCount > 0 && assignedCount < selectedCount}

          <div class="flex items-center gap-3 py-2.5">
            <TagPill tag={tag} />

            <span class="flex-1 text-[11px] text-[#888]">
              {assignedCount}/{selectedCount}
            </span>

            <button
              type="button"
              class="text-[11px] text-[#888] hover:text-[#1a1a1a]"
              onclick={() => openEditDialog(tag)}
            >edit</button>

            <Button
              size="sm"
              variant={assignedToAll ? "outline" : "default"}
              disabled={isApplying || selectedCount === 0}
              onclick={() => toggleTag(tag._id, assignedToAll)}
            >
              {#if assignedToAll}
                <Minus class="h-3 w-3" />
                Remove
              {:else if assignedToSome}
                <Check class="h-3 w-3" />
                Apply All
              {:else}
                <Plus class="h-3 w-3" />
                Add
              {/if}
            </Button>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</Dialog>

<TagEditorDialog
  open={editorOpen}
  {teamId}
  tag={editingTag}
  onOpenChange={(nextOpen) => {
    editorOpen = nextOpen;
    if (!nextOpen) {
      editingTag = null;
    }
  }}
/>
