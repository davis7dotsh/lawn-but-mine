<script lang="ts">
  import { onMount } from "svelte";
  import { useQuery, useConvexClient } from "convex-svelte";
  import { api } from "@convex/_generated/api";
  import { page } from "$app/stores";
  import { formatDuration, formatTimestamp, formatRelativeTime } from "$lib/utils";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import Textarea from "$lib/components/ui/Textarea.svelte";
  import Badge from "$lib/components/ui/Badge.svelte";
  import DashboardHeader from "$lib/components/DashboardHeader.svelte";
  import VideoPlayer from "$lib/components/VideoPlayer.svelte";

  let teamSlug = $derived($page.params.teamSlug ?? "");
  let projectId = $derived($page.params.projectId ?? "");
  let videoId = $derived($page.params.videoId ?? "");
  const client = useConvexClient();

  const context = useQuery(api.workspace.resolveContext, () => ({ teamSlug, projectId: projectId as any, videoId: videoId as any }));
  const resolvedTeamSlug = $derived(context.data?.team?.slug ?? teamSlug ?? "");
  const resolvedProjectId = $derived(context.data?.project?._id);
  const resolvedVideoId = $derived(context.data?.video?._id);
  const video = useQuery(api.videos.get, () => resolvedVideoId ? { videoId: resolvedVideoId } : "skip");
  const comments = useQuery(api.comments.list, () => resolvedVideoId ? { videoId: resolvedVideoId } : "skip");
  const commentsThreaded = useQuery(api.comments.getThreaded, () => resolvedVideoId ? { videoId: resolvedVideoId } : "skip");

  let currentTime = $state(0);
  let isEditingTitle = $state(false);
  let editedTitle = $state("");
  let shareDialogOpen = $state(false);
  let mobileCommentsOpen = $state(false);
  let playbackSession = $state<{ url: string; posterUrl: string } | null>(null);
  let isLoadingPlayback = $state(false);
  let originalPlaybackUrl = $state<string | null>(null);
  let commentText = $state("");
  let isSubmittingComment = $state(false);
  let playerRef = $state<{ seekTo: (time: number, opts?: { play?: boolean }) => void } | null>(null);

  const isPlayable = $derived(video.data?.status === "ready" && Boolean(video.data?.muxPlaybackId));
  const activePlaybackUrl = $derived(playbackSession?.url ?? originalPlaybackUrl);
  const canEdit = $derived(video.data?.role !== "viewer");

  $effect(() => {
    if (!resolvedVideoId || !isPlayable) {
      playbackSession = null;
      return;
    }
    isLoadingPlayback = true;
    client.action(api.videoActions.getPlaybackSession, { videoId: resolvedVideoId })
      .then((session) => { playbackSession = session; })
      .catch(() => { playbackSession = null; })
      .finally(() => { isLoadingPlayback = false; });
  });

  $effect(() => {
    if (!resolvedVideoId || !video.data || video.data.status === "uploading") {
      originalPlaybackUrl = null;
      return;
    }
    client.action(api.videoActions.getOriginalPlaybackUrl, { videoId: resolvedVideoId })
      .then((result) => { originalPlaybackUrl = result.url; })
      .catch(() => { originalPlaybackUrl = null; });
  });

  async function handleSaveTitle() {
    if (!editedTitle.trim() || !resolvedVideoId) return;
    try {
      await client.mutation(api.videos.update, { videoId: resolvedVideoId as any, title: editedTitle.trim() });
      isEditingTitle = false;
    } catch (error) {
      console.error("Failed to update title:", error);
    }
  }

  async function handleUpdateWorkflowStatus(workflowStatus: string) {
    if (!resolvedVideoId) return;
    try {
      await client.mutation(api.videos.updateWorkflowStatus, { videoId: resolvedVideoId as any, workflowStatus: workflowStatus as any });
    } catch (error) {
      console.error("Failed to update workflow status:", error);
    }
  }

  async function handleSubmitComment(e: SubmitEvent) {
    e.preventDefault();
    if (!commentText.trim() || !resolvedVideoId || isSubmittingComment) return;
    isSubmittingComment = true;
    try {
      await client.mutation(api.comments.create, { videoId: resolvedVideoId as any, text: commentText.trim(), timestampSeconds: currentTime });
      commentText = "";
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      isSubmittingComment = false;
    }
  }
</script>

<svelte:head><title>{video.data?.title ?? "Video"} — lawn</title></svelte:head>

{#if context.data === undefined || video.data === undefined}
  <div class="flex items-center justify-center h-full"><div class="text-[#888]">Loading...</div></div>
{:else if context.data === null || video.data === null}
  <div class="flex items-center justify-center h-full"><div class="text-[#888]">Video not found</div></div>
{:else}
  <div class="h-full flex flex-col">
    <DashboardHeader paths={[
      { label: resolvedTeamSlug, href: `/dashboard/${resolvedTeamSlug}` },
      { label: context.data?.project?.name ?? "project", href: `/dashboard/${resolvedTeamSlug}/${resolvedProjectId}` },
      { label: isEditingTitle ? "..." : video.data.title }
    ]}>
      <div class="hidden sm:flex items-center gap-3 flex-shrink-0">
        {#each ["review", "rework", "done"] as status}
          <button
            onclick={() => handleUpdateWorkflowStatus(status)}
            class={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 border transition-colors ${
              video.data?.workflowStatus === status
                ? status === "done" ? "border-[#16a34a] bg-[#16a34a] text-white" : status === "rework" ? "border-[#ca8a04] bg-[#ca8a04] text-white" : "border-[#1a1a1a] bg-[#1a1a1a] text-[#f0f0e8]"
                : "border-[#ccc] text-[#888] hover:border-[#1a1a1a] hover:text-[#1a1a1a]"
            }`}
          >{status}</button>
        {/each}
        <Button variant="outline" onclick={() => shareDialogOpen = true}>Share</Button>
        <Button variant="outline" class="lg:hidden" onclick={() => mobileCommentsOpen = true}>
          Comments {comments.data && comments.data.length > 0 ? `(${comments.data.length})` : ""}
        </Button>
      </div>
    </DashboardHeader>

    <div class="flex-1 flex overflow-hidden">
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden bg-black">
        {#if activePlaybackUrl}
          <VideoPlayer
            src={activePlaybackUrl}
            poster={playbackSession?.posterUrl}
            comments={comments.data ?? []}
            onTimeUpdate={(time: number) => currentTime = time}
            controlsBelow
          />
        {:else}
          <div class="flex-1 flex items-center justify-center">
            <div class="flex flex-col items-center gap-3 text-white">
              <div class="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80"></div>
              <p class="text-sm font-medium text-white/85">
                {#if video.data.status === "uploading"}Uploading...{:else if video.data.status === "processing"}Processing...{:else if isLoadingPlayback}Loading stream...{:else}Preparing stream...{/if}
              </p>
            </div>
          </div>
        {/if}
      </div>

      <aside class="hidden lg:flex w-80 xl:w-96 border-l-2 border-[#1a1a1a] flex-col bg-[#f0f0e8]">
        <div class="flex-shrink-0 px-5 py-4 border-b border-[#1a1a1a]/10 flex items-center justify-between">
          <h2 class="font-semibold text-sm tracking-tight text-[#1a1a1a]">Discussion</h2>
          {#if comments.data && comments.data.length > 0}
            <span class="text-[11px] font-medium text-[#888] bg-[#1a1a1a]/5 px-2 py-0.5 rounded-full">{comments.data.length} comments</span>
          {/if}
        </div>
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
          {#if commentsThreaded.data === undefined}
            <p class="text-sm text-[#888]">Loading comments...</p>
          {:else if commentsThreaded.data.length === 0}
            <p class="text-sm text-[#888]">No comments yet.</p>
          {:else}
            {#each commentsThreaded.data as thread}
              <article class="border-2 border-[#1a1a1a] bg-[#f0f0e8] p-3">
                <div class="flex items-center justify-between gap-2">
                  <div class="text-sm font-bold text-[#1a1a1a]">{thread.userName}</div>
                  <button type="button" class="font-mono text-xs text-[#2d5a2d] hover:text-[#1a1a1a]" onclick={() => playerRef?.seekTo(thread.timestampSeconds, { play: true })}>{formatTimestamp(thread.timestampSeconds)}</button>
                </div>
                <p class="text-sm text-[#1a1a1a] mt-1 whitespace-pre-wrap">{thread.text}</p>
                <p class="text-[11px] text-[#888] mt-1">{formatRelativeTime(thread._creationTime)}</p>
                {#if thread.replies?.length > 0}
                  <div class="mt-3 ml-4 border-l-2 border-[#1a1a1a] pl-3 space-y-2">
                    {#each thread.replies as reply}
                      <div class="text-sm">
                        <div class="flex items-center justify-between gap-2">
                          <span class="font-bold text-[#1a1a1a]">{reply.userName}</span>
                          <button type="button" class="font-mono text-xs text-[#2d5a2d] hover:text-[#1a1a1a]" onclick={() => playerRef?.seekTo(reply.timestampSeconds, { play: true })}>{formatTimestamp(reply.timestampSeconds)}</button>
                        </div>
                        <p class="text-[#1a1a1a] whitespace-pre-wrap">{reply.text}</p>
                      </div>
                    {/each}
                  </div>
                {/if}
              </article>
            {/each}
          {/if}
        </div>
        {#if canEdit}
          <div class="flex-shrink-0 border-t-2 border-[#1a1a1a] bg-[#f0f0e8] p-4">
            <form onsubmit={handleSubmitComment} class="space-y-2">
              <div class="flex items-center gap-2 text-xs text-[#666]">Comment at {formatTimestamp(currentTime)}</div>
              <Textarea value={commentText} oninput={(e) => commentText = e.currentTarget.value} placeholder="Leave a comment..." class="min-h-[90px] text-sm" />
              <Button type="submit" size="sm" disabled={!commentText.trim() || isSubmittingComment} class="w-full">{isSubmittingComment ? "Posting..." : "Post comment"}</Button>
            </form>
          </div>
        {/if}
      </aside>
    </div>
  </div>
{/if}
