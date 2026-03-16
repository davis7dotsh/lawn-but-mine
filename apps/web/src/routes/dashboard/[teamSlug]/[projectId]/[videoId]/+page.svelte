<script lang="ts">
  import { goto } from "$app/navigation"; 
  import { browser } from "$app/environment"; 
  import { page } from "$app/state"; 
  import { api } from "@lawn/convex/api"; 
  import type { Id } from "@lawn/convex/dataModel"; 
  import { useConvexClient, useQuery } from "convex-svelte"; 
  import { 
    Check, 
    Edit2, 
    Link as LinkIcon, 
    MessageSquare, 
    MoreVertical, 
    RefreshCcw, 
    Tag, 
    X, 
  } from "lucide-svelte"; 
  import DashboardHeader from "@/lib/components/DashboardHeader.svelte"; 
  import ManageVideoTagsDialog from "@/lib/components/tags/ManageVideoTagsDialog.svelte";
  import TagPill from "@/lib/components/tags/TagPill.svelte";
  import ShareDialog from "@/lib/components/ShareDialog.svelte"; 
  import VideoPlayer from "@/lib/components/video-player/VideoPlayer.svelte";
  import type { VideoPlayerHandle } from "@/lib/components/video-player/VideoPlayer.svelte";
  import VideoWorkflowStatusControl, { 
    type VideoWorkflowStatus, 
  } from "@/lib/components/videos/VideoWorkflowStatusControl.svelte"; 
  import { formatDuration, formatTimestamp } from "@/lib/utils"; 
  import { makeRouteQuerySpec, prewarmSpecs } from "@/lib/convex/prewarm"; 
  import { projectPath, teamHomePath } from "@/lib/routes"; 

  type Watcher = { 
    userId: string; 
    online: boolean; 
    kind: "member" | "guest"; 
    displayName: string; 
    avatarUrl?: string; 
  }; 

  type ThreadedComment = { 
    _id: Id<"comments">; 
    _creationTime: number; 
    text: string; 
    timestampSeconds: number; 
    resolved: boolean; 
    userName: string; 
    userAvatarUrl?: string; 
    replies?: ThreadedComment[]; 
  }; 

  type OriginalPlaybackSession = {
    url: string;
    contentType: string;
  };

  const STORAGE_KEY_CLIENT_ID = "lawn.presence.client_id"; 
  const DEFAULT_HEARTBEAT_INTERVAL_MS = 15_000; 
  const DISCONNECT_PATH = "videoPresence:disconnect"; 
  const convexUrl = import.meta.env.VITE_CONVEX_URL; 

  const convex = useConvexClient(); 

  let playerRef = $state<VideoPlayerHandle | null>(null); 
  let currentTime = $state(0); 
  let isEditingTitle = $state(false); 
  let editedTitle = $state(""); 
  let highlightedCommentId = $state<Id<"comments"> | undefined>(undefined); 
  let shareDialogOpen = $state(false); 
  let manageTagsOpen = $state(false);
  let mobileCommentsOpen = $state(false); 
  let playbackSession = $state<{ url: string; posterUrl: string } | null>(null); 
  let isLoadingPlayback = $state(false); 
  let originalPlayback = $state<OriginalPlaybackSession | null>(null); 
  let isLoadingOriginalPlayback = $state(false); 
  let isRetryingProcessing = $state(false);
  let roomToken = $state<string | null>(null); 
  let sessionToken = $state<string | null>(null); 
  let clientId = $state<string | null>(null); 
  let commentText = $state("");

  const teamSlug = $derived(page.params.teamSlug); 
  const projectId = $derived(page.params.projectId as Id<"projects">); 
  const videoId = $derived(page.params.videoId as Id<"videos">); 
  const pathname = $derived(page.url.pathname); 

  const contextQuery = useQuery(api.workspace.resolveContext, () => ({ 
    teamSlug, 
    projectId, 
    videoId, 
  })); 

  const resolvedTeamSlug = $derived(contextQuery.data?.team.slug ?? teamSlug); 
  const resolvedTeamId = $derived(
    contextQuery.data?.team?._id as Id<"teams"> | null,
  );
  const resolvedProjectId = $derived( 
    contextQuery.data?.project?._id as Id<"projects"> | undefined, 
  ); 
  const resolvedVideoId = $derived( 
    contextQuery.data?.video?._id as Id<"videos"> | undefined, 
  ); 

  const videoQuery = useQuery(api.videos.get, () => 
    resolvedVideoId ? { videoId: resolvedVideoId } : "skip", 
  ); 
  const commentsQuery = useQuery(api.comments.list, () => 
    resolvedVideoId ? { videoId: resolvedVideoId } : "skip", 
  ); 
  const commentsThreadedQuery = useQuery(api.comments.getThreaded, () => 
    resolvedVideoId ? { videoId: resolvedVideoId } : "skip", 
  ); 
  const presenceStateQuery = useQuery(api.videoPresence.list, () => 
    roomToken ? { roomToken } : "skip", 
  ); 

  const watchers = $derived( 
    (presenceStateQuery.data ?? []) 
      .filter((watcher) => watcher.online) 
      .map((watcher) => ({ 
        userId: watcher.userId, 
        online: watcher.online, 
        kind: watcher.data?.kind ?? "member", 
        displayName: watcher.data?.displayName ?? "Member", 
        avatarUrl: watcher.data?.avatarUrl, 
      })) as Watcher[], 
  ); 

  const isPlayable = $derived(videoQuery.data?.status === "ready" && Boolean(videoQuery.data?.muxPlaybackId)); 
  const playbackUrl = $derived(playbackSession?.url ?? null); 
  const originalPlaybackUrl = $derived(originalPlayback?.url ?? null);
  const activePlaybackUrl = $derived(playbackUrl ?? originalPlaybackUrl);
  const isUsingOriginalFallback = $derived(
    Boolean(activePlaybackUrl && !playbackUrl && originalPlaybackUrl),
  ); 
  const shouldCanonicalize = $derived( 
    Boolean(contextQuery.data && !contextQuery.data.isCanonical && pathname !== contextQuery.data.canonicalPath), 
  ); 

  const prewarmTeam = (nextTeamSlug: string) => 
    prewarmSpecs(convex, [makeRouteQuerySpec(api.workspace.resolveContext, { teamSlug: nextTeamSlug })]); 

  const prewarmProject = (nextTeamSlug: string, nextProjectId: Id<"projects">) => 
    prewarmSpecs(convex, [ 
      makeRouteQuerySpec(api.workspace.resolveContext, { 
        teamSlug: nextTeamSlug, 
        projectId: nextProjectId, 
      }), 
      makeRouteQuerySpec(api.projects.get, { 
        projectId: nextProjectId, 
      }), 
      makeRouteQuerySpec(api.videos.list, { 
        projectId: nextProjectId, 
      }), 
    ]); 

  $effect(() => { 
    if (!browser || !shouldCanonicalize || !contextQuery.data) return; 
    void goto(contextQuery.data.canonicalPath, { 
      replaceState: true, 
      noScroll: true, 
    }); 
  }); 

  $effect(() => { 
    if (!resolvedVideoId || !isPlayable) { 
      playbackSession = null; 
      isLoadingPlayback = false; 
      return; 
    } 

    let cancelled = false; 
    isLoadingPlayback = true; 

    void convex 
      .action(api.videoActions.getPlaybackSession, { videoId: resolvedVideoId }) 
      .then((session) => { 
        if (cancelled) return; 
        playbackSession = session; 
      }) 
      .catch(() => { 
        if (cancelled) return; 
        playbackSession = null; 
      }) 
      .finally(() => { 
        if (cancelled) return; 
        isLoadingPlayback = false; 
      }); 

    return () => { 
      cancelled = true; 
    }; 
  }); 

  $effect(() => { 
    if (!resolvedVideoId || !videoQuery.data || videoQuery.data.status === "uploading" || videoQuery.data.status === "ready") { 
      originalPlayback = null; 
      isLoadingOriginalPlayback = false; 
      return; 
    } 

    let cancelled = false; 
    isLoadingOriginalPlayback = true; 

    void convex 
      .action(api.videoActions.getOriginalPlaybackUrl, { videoId: resolvedVideoId }) 
      .then((result) => { 
        if (cancelled) return; 
        originalPlayback = result; 
      }) 
      .catch(() => { 
        if (cancelled) return; 
        originalPlayback = null; 
      }) 
      .finally(() => { 
        if (cancelled) return; 
        isLoadingOriginalPlayback = false; 
      }); 

    return () => { 
      cancelled = true; 
    }; 
  }); 

  $effect(() => { 
    if (!browser || !import.meta.env.DEV || !resolvedVideoId || videoQuery.data?.status !== "processing") { 
      return; 
    } 

    let cancelled = false; 
    let timeoutId: ReturnType<typeof setTimeout> | null = null; 

    const schedule = (delayMs: number) => { 
      timeoutId = setTimeout(() => { 
        void tick(); 
      }, delayMs); 
    }; 

    const tick = async () => { 
      if (cancelled) return; 

      if (document.visibilityState === "hidden") { 
        schedule(12_000); 
        return; 
      } 

      try { 
        const result = await convex.action(api.videoActions.pollMuxProcessingStatus, { 
          videoId: resolvedVideoId, 
        }); 
        if (cancelled || result.status !== "processing") return; 
        schedule(5_000); 
      } catch { 
        if (cancelled) return; 
        schedule(10_000); 
      } 
    }; 

    void tick(); 

    return () => { 
      cancelled = true; 
      if (timeoutId) { 
        clearTimeout(timeoutId); 
      } 
    }; 
  }); 

  $effect(() => { 
    if (!browser || !resolvedVideoId) return; 

    const existingClientId = window.localStorage.getItem(STORAGE_KEY_CLIENT_ID); 
    if (existingClientId) { 
      clientId = existingClientId; 
      return; 
    } 

    const nextClientId = crypto.randomUUID().replace(/-/g, ""); 
    window.localStorage.setItem(STORAGE_KEY_CLIENT_ID, nextClientId); 
    clientId = nextClientId; 
  }); 

  $effect(() => { 
    if (!browser || !resolvedVideoId || !clientId) { 
      roomToken = null; 
      return; 
    } 

    let active = true; 
    const currentSessionId = crypto.randomUUID(); 

    const runHeartbeat = async () => { 
      const result = await convex.mutation(api.videoPresence.heartbeat, { 
        videoId: resolvedVideoId, 
        sessionId: currentSessionId, 
        clientId, 
        interval: DEFAULT_HEARTBEAT_INTERVAL_MS, 
      }); 

      if (!active) return; 
      sessionToken = result.sessionToken; 
      roomToken = result.roomToken; 
    }; 

    const handleBeforeUnload = () => { 
      if (!sessionToken) return; 
      const payload = { 
        path: DISCONNECT_PATH, 
        args: { sessionToken }, 
      }; 
      const blob = new Blob([JSON.stringify(payload)], { 
        type: "application/json", 
      }); 
      if (convexUrl) { 
        navigator.sendBeacon(`${convexUrl}/api/mutation`, blob); 
      } 
    }; 

    void runHeartbeat(); 
    const intervalId = window.setInterval(() => { 
      void runHeartbeat(); 
    }, DEFAULT_HEARTBEAT_INTERVAL_MS); 

    window.addEventListener("beforeunload", handleBeforeUnload); 

    return () => { 
      active = false; 
      window.removeEventListener("beforeunload", handleBeforeUnload); 
      clearInterval(intervalId); 

      const currentSessionToken = sessionToken; 
      sessionToken = null; 
      roomToken = null; 
      if (currentSessionToken) { 
        void convex.mutation(api.videoPresence.disconnect, { 
          sessionToken: currentSessionToken, 
        }).catch(() => undefined); 
      } 
    }; 
  }); 

  const handleTimeUpdate = (time: number) => { 
    currentTime = time; 
  }; 

  const handleMarkerClick = (comment: { _id: string } | Id<"comments">) => { 
    const commentId = (typeof comment === "string" ? comment : comment._id) as Id<"comments">;
    highlightedCommentId = commentId; 
    setTimeout(() => { 
      if (highlightedCommentId === commentId) { 
        highlightedCommentId = undefined; 
      } 
    }, 3000); 
  }; 

  const requestDownload = async () => { 
    if (!videoQuery.data || videoQuery.data.status !== "ready" || !resolvedVideoId) return null; 
    return await convex.action(api.videoActions.getDownloadUrl, { 
      videoId: resolvedVideoId, 
    }); 
  }; 

  const handleTimestampClick = (time: number) => { 
    playerRef?.seekTo(time, { play: true });
    highlightedCommentId = undefined; 
  }; 

  const handleSaveTitle = async () => { 
    if (!editedTitle.trim() || !resolvedVideoId) return; 
    await convex.mutation(api.videos.update, { 
      videoId: resolvedVideoId, 
      title: editedTitle.trim(), 
    }); 
    isEditingTitle = false; 
  }; 

  const handleUpdateWorkflowStatus = async (workflowStatus: VideoWorkflowStatus) => { 
    if (!resolvedVideoId) return; 
    await convex.mutation(api.videos.updateWorkflowStatus, { 
      videoId: resolvedVideoId, 
      workflowStatus, 
    }); 
  }; 

  const handleRetryProcessing = async () => { 
    if (!resolvedVideoId) return; 
    isRetryingProcessing = true; 
    try { 
      await convex.action(api.videoActions.retryMuxProcessing, { 
        videoId: resolvedVideoId, 
      }); 
    } finally { 
      isRetryingProcessing = false; 
    } 
  }; 

  const startEditingTitle = () => { 
    if (!videoQuery.data) return; 
    editedTitle = videoQuery.data.title; 
    isEditingTitle = true; 
  }; 

  const handleCreateComment = async () => { 
    if (!resolvedVideoId || !commentText.trim()) return; 
    await convex.mutation(api.comments.create, { 
      videoId: resolvedVideoId, 
      text: commentText.trim(), 
      timestampSeconds: currentTime, 
    }); 
    commentText = ""; 
  }; 

  const handleDeleteComment = async (commentId: Id<"comments">) => { 
    await convex.mutation(api.comments.remove, { 
      commentId, 
    }); 
  }; 

  const handleToggleResolved = async (commentId: Id<"comments">) => { 
    await convex.mutation(api.comments.toggleResolved, { 
      commentId, 
    }); 
  }; 

  const canEdit = $derived(videoQuery.data?.role !== "viewer"); 
  const canComment = $derived(Boolean(resolvedVideoId));
  const videoTags = $derived(videoQuery.data?.tags ?? []);
  const selectedVideosForTags = $derived.by(() => {
    if (!videoQuery.data || !resolvedVideoId) return [];
    return [{
      _id: resolvedVideoId,
      title: videoQuery.data.title,
      tags: videoTags,
    }];
  }); 
  const canRetryProcessing = $derived(Boolean(canEdit && videoQuery.data?.s3Key)); 

  const commentsCount = $derived(commentsQuery.data?.length ?? 0); 
  const markerComments = $derived.by(() =>
    (commentsQuery.data ?? []).map((comment) => ({
      _id: comment._id,
      timestampSeconds: comment.timestampSeconds,
      resolved: comment.resolved,
    })),
  );

</script>

{#if contextQuery.data === undefined || videoQuery.data === undefined || shouldCanonicalize}
  <div class="flex h-full items-center justify-center">
    <div class="text-[#888]">Loading...</div>
  </div>
{:else if contextQuery.data === null || videoQuery.data === null || !resolvedProjectId || !resolvedVideoId}
  <div class="flex h-full items-center justify-center">
    <div class="text-[#888]">Video not found</div>
  </div>
{:else}
  <div class="h-full flex flex-col">
    <DashboardHeader
      paths={[
        {
          label: resolvedTeamSlug,
          href: teamHomePath(resolvedTeamSlug),
          prewarm: () => prewarmTeam(resolvedTeamSlug),
        },
        {
          label: contextQuery.data?.project?.name ?? "project",
          href: projectPath(resolvedTeamSlug, resolvedProjectId),
          prewarm: () => prewarmProject(resolvedTeamSlug, resolvedProjectId),
        },
        { label: videoQuery.data.title },
      ]}
    >
      <div class="hidden sm:flex items-center gap-3 text-xs text-[#888]">
        <span class="truncate max-w-[120px]">{videoQuery.data.uploaderName}</span>
        {#if videoQuery.data.duration}
          <span class="text-[#ccc]">·</span>
          <span class="font-mono">{formatDuration(videoQuery.data.duration)}</span>
        {/if}
        {#if watchers.length > 0}
          <span class="truncate max-w-[180px]">
            {watchers.length} watching
            · {watchers.map((watcher) => watcher.displayName).join(", ")}
          </span>
        {/if}
      </div>

      <div class="hidden sm:flex items-center gap-3 flex-shrink-0 border-l-2 border-[#1a1a1a]/20 pl-3 ml-1">
        <VideoWorkflowStatusControl
          status={videoQuery.data.workflowStatus}
          size="lg"
          disabled={!canEdit}
          onChange={handleUpdateWorkflowStatus}
        />
        <button
          type="button"
          class="inline-flex items-center justify-center border-2 border-[#1a1a1a] px-3 py-2 text-sm font-bold text-[#1a1a1a] hover:bg-[#e8e8e0]"
          onclick={() => (shareDialogOpen = true)}
        >
          <LinkIcon class="mr-1.5 h-4 w-4" />
          Share
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center border-2 border-[#1a1a1a] px-3 py-2 text-sm font-bold text-[#1a1a1a] hover:bg-[#e8e8e0] lg:hidden"
          onclick={() => (mobileCommentsOpen = true)}
        >
          <MessageSquare class="h-4 w-4" />
          {#if commentsCount > 0}
            <span class="ml-1 text-xs">{commentsCount}</span>
          {/if}
        </button>
      </div>

      <div class="flex sm:hidden items-center gap-2">
        <VideoWorkflowStatusControl
          status={videoQuery.data.workflowStatus}
          size="lg"
          disabled={!canEdit}
          onChange={handleUpdateWorkflowStatus}
        />
        <button
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center border-2 border-[#1a1a1a]"
          onclick={() => (mobileCommentsOpen = !mobileCommentsOpen)}
        >
          <MoreVertical class="h-4 w-4" />
        </button>
      </div>
    </DashboardHeader>

    <div class="border-b-2 border-[#1a1a1a] bg-[#f0f0e8] px-4 py-3">
      {#if isEditingTitle}
        <div class="flex flex-wrap items-center gap-2">
          <input
            bind:value={editedTitle}
            class="w-full max-w-md border-2 border-[#1a1a1a] bg-[#f0f0e8] px-3 py-2 text-base font-black tracking-tight outline-none"
            onkeydown={(event) => {
              if (event.key === "Enter") {
                void handleSaveTitle();
              }
              if (event.key === "Escape") {
                isEditingTitle = false;
              }
            }}
          />
          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] text-[#f0f0e8]"
            onclick={handleSaveTitle}
          >
            <Check class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center border-2 border-[#1a1a1a]"
            onclick={() => (isEditingTitle = false)}
          >
            <X class="h-4 w-4" />
          </button>
        </div>
      {:else}
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h1 class="text-lg font-black text-[#1a1a1a]">{videoQuery.data.title}</h1>
          {#if canEdit}
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center border-2 border-[#1a1a1a] hover:bg-[#e8e8e0]"
              onclick={startEditingTitle}
            >
              <Edit2 class="h-3.5 w-3.5" />
            </button>
          {/if}
          {#if videoQuery.data.status !== "ready"}
            <span class="border-2 border-[#1a1a1a] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#888]">
              {videoQuery.data.status === "uploading" ? "Uploading" : videoQuery.data.status === "processing" ? "Processing" : "Failed"}
            </span>
          {/if}

          {#if videoTags.length > 0 || canEdit}
            <div class="flex items-center gap-2 border-l border-[#ccc] pl-3">
              {#each videoTags as tag (tag._id)}
                <TagPill {tag} />
              {/each}
              {#if canEdit}
                <button
                  type="button"
                  class="inline-flex items-center gap-1 text-[11px] text-[#888] hover:text-[#1a1a1a]"
                  onclick={() => (manageTagsOpen = true)}
                >
                  <Tag class="h-3 w-3" />
                  {videoTags.length === 0 ? "+ tag" : "+"}
                </button>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <div class="flex-1 flex overflow-hidden">
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden bg-black">
        {#if videoQuery.data.status === "processing" && isUsingOriginalFallback && activePlaybackUrl}
          <div class="shrink-0 flex items-center gap-2 bg-[#1a1a1a] px-4 py-2 text-sm text-[#f0f0e8]">
            <span class="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-[#7cb87c]"></span>
            <span class="font-semibold">Playing original while stream encodes.</span>
          </div>
        {/if}

        {#if videoQuery.data.status === "failed"}
          <div class="flex flex-wrap items-center gap-3 border-b border-[#5f1d1d] bg-[#2a0f12] px-4 py-3 text-sm text-[#f8d7da]">
            <span class="font-semibold">Mux processing failed.</span>
            <span class="text-[#d7a6ad]">
              {videoQuery.data.uploadError ?? "The stream could not be prepared."}
            </span>
            {#if canRetryProcessing}
              <button
                type="button"
                class="inline-flex items-center justify-center border border-[#a33a46] px-3 py-1.5 text-sm font-bold text-[#f8d7da] hover:bg-[#3a161b]"
                disabled={isRetryingProcessing}
                onclick={handleRetryProcessing}
              >
                <RefreshCcw class="mr-2 h-4 w-4" />
                {isRetryingProcessing ? "Retrying..." : "Retry processing"}
              </button>
            {/if}
          </div>
        {/if}

        {#if activePlaybackUrl}
          <div class="flex flex-1 min-h-0 flex-col">
            <VideoPlayer
              bind:this={playerRef}
              src={activePlaybackUrl}
              poster={playbackSession?.posterUrl}
              comments={markerComments}
              onTimeUpdate={handleTimeUpdate}
              onMarkerClick={handleMarkerClick}
              allowDownload={videoQuery.data.status === "ready"}
              downloadFilename={`${videoQuery.data.title}.mp4`}
              onRequestDownload={requestDownload}
              controlsBelow
            />
          </div>
        {:else}
          <div class="flex-1 flex items-center justify-center">
            {#if videoQuery.data.status === "ready" && !playbackUrl}
              <div class="flex flex-col items-center gap-3 text-white">
                <div class="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80"></div>
                <p class="text-sm font-medium text-white/85">
                  {isLoadingPlayback ? "Loading stream..." : "Preparing stream..."}
                </p>
              </div>
            {:else}
              <div class="text-center">
                {#if videoQuery.data.status === "uploading"}
                  <p class="text-white/60">Uploading...</p>
                {/if}
                {#if videoQuery.data.status === "processing"}
                  <p class="text-white/60">
                    {isLoadingOriginalPlayback ? "Preparing original playback..." : "Processing video..."}
                  </p>
                {/if}
                {#if videoQuery.data.status === "failed"}
                  <div class="flex flex-col items-center gap-3">
                    <p class="text-[#dc2626]">{videoQuery.data.uploadError ?? "Processing failed"}</p>
                    {#if canRetryProcessing}
                      <button
                        type="button"
                        class="inline-flex items-center justify-center border-2 border-[#1a1a1a] bg-[#f0f0e8] px-3 py-2 text-sm font-bold text-[#1a1a1a]"
                        disabled={isRetryingProcessing}
                        onclick={handleRetryProcessing}
                      >
                        {isRetryingProcessing ? "Retrying..." : "Retry processing"}
                      </button>
                    {/if}
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <aside class="hidden lg:flex w-80 xl:w-96 border-l-2 border-[#1a1a1a] flex-col bg-[#f0f0e8]">
        <div class="flex items-center justify-between border-b border-[#1a1a1a]/10 px-5 py-4">
          <h2 class="text-sm font-semibold tracking-tight text-[#1a1a1a]">Discussion</h2>
          {#if commentsCount > 0}
            <span class="bg-[#1a1a1a]/5 px-2 py-0.5 text-[11px] font-medium text-[#888]">
              {commentsCount} {commentsCount === 1 ? "comment" : "comments"}
            </span>
          {/if}
        </div>

        <div class="flex-1 overflow-auto p-4 space-y-3">
          {#if commentsThreadedQuery.data}
            {#each commentsThreadedQuery.data as comment}
              <div
                class={`border-2 p-3 ${highlightedCommentId === comment._id ? "border-[#2d5a2d] bg-[#e8e8e0]" : "border-[#1a1a1a] bg-[#f0f0e8]"} ${comment.resolved ? "opacity-70" : ""}`}
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <button
                      type="button"
                      class="text-left text-sm font-bold text-[#1a1a1a]"
                      onclick={() => {
                        handleTimestampClick(comment.timestampSeconds);
                        handleMarkerClick(comment._id);
                      }}
                    >
                      {comment.userName}
                    </button>
                    <button
                      type="button"
                      class="mt-1 block text-xs font-mono text-[#888] underline"
                      onclick={() => {
                        handleTimestampClick(comment.timestampSeconds);
                        handleMarkerClick(comment._id);
                      }}
                    >
                      {formatTimestamp(comment.timestampSeconds)}
                    </button>
                  </div>

                  {#if canEdit}
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        class="text-[10px] font-bold uppercase tracking-wider text-[#888] hover:text-[#1a1a1a]"
                        onclick={() => handleToggleResolved(comment._id)}
                      >
                        {comment.resolved ? "Reopen" : "Resolve"}
                      </button>
                      <button
                        type="button"
                        class="text-[10px] font-bold uppercase tracking-wider text-[#dc2626]"
                        onclick={() => handleDeleteComment(comment._id)}
                      >
                        Delete
                      </button>
                    </div>
                  {/if}
                </div>

                <p class="mt-2 text-sm text-[#1a1a1a]">{comment.text}</p>

                {#if comment.replies && comment.replies.length > 0}
                  <div class="mt-3 space-y-2 border-t border-[#1a1a1a]/10 pt-3">
                    {#each comment.replies as reply}
                      <div class="border-l-2 border-[#1a1a1a] pl-3">
                        <div class="flex items-center justify-between gap-3">
                          <div>
                            <p class="text-xs font-bold text-[#1a1a1a]">{reply.userName}</p>
                            <button
                              type="button"
                              class="text-[10px] font-mono text-[#888] underline"
                              onclick={() => {
                                handleTimestampClick(reply.timestampSeconds);
                                handleMarkerClick(reply._id);
                              }}
                            >
                              {formatTimestamp(reply.timestampSeconds)}
                            </button>
                          </div>
                          {#if canEdit}
                            <button
                              type="button"
                              class="text-[10px] font-bold uppercase tracking-wider text-[#dc2626]"
                              onclick={() => handleDeleteComment(reply._id)}
                            >
                              Delete
                            </button>
                          {/if}
                        </div>
                        <p class="mt-1 text-sm text-[#1a1a1a]">{reply.text}</p>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          {/if}
        </div>

        {#if canComment}
          <div class="flex-shrink-0 border-t-2 border-[#1a1a1a] bg-[#f0f0e8] p-4">
            <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-[#888]">
              Comment at {formatTimestamp(currentTime)}
            </label>
            <textarea
              bind:value={commentText}
              class="min-h-24 w-full border-2 border-[#1a1a1a] bg-[#f0f0e8] px-3 py-2 text-sm outline-none"
              placeholder="Leave a frame-accurate comment..."
            ></textarea>
            <button
              type="button"
              class="mt-3 inline-flex items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-3 py-2 text-sm font-bold text-[#f0f0e8] hover:bg-[#2d5a2d] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!commentText.trim()}
              onclick={handleCreateComment}
            >
              Add comment
            </button>
          </div>
        {/if}
      </aside>
    </div>

    {#if mobileCommentsOpen}
      <div class="fixed inset-0 z-50 lg:hidden flex flex-col bg-[#f0f0e8]">
        <div class="flex items-center justify-between border-b-2 border-[#1a1a1a] px-5 py-4">
          <h2 class="flex items-center gap-2 text-sm font-semibold tracking-tight text-[#1a1a1a]">
            Discussion
            {#if commentsCount > 0}
              <span class="bg-[#1a1a1a]/5 px-2 py-0.5 text-[11px] font-medium text-[#888]">{commentsCount}</span>
            {/if}
          </h2>
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center border-2 border-[#1a1a1a]"
            onclick={() => (mobileCommentsOpen = false)}
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <div class="flex-1 overflow-auto p-4 space-y-3">
          {#if commentsThreadedQuery.data}
            {#each commentsThreadedQuery.data as comment}
              <div class="border-2 border-[#1a1a1a] bg-[#f0f0e8] p-3">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-sm font-bold text-[#1a1a1a]">{comment.userName}</p>
                    <button
                      type="button"
                      class="mt-1 block text-xs font-mono text-[#888] underline"
                      onclick={() => {
                        handleTimestampClick(comment.timestampSeconds);
                        mobileCommentsOpen = false;
                      }}
                    >
                      {formatTimestamp(comment.timestampSeconds)}
                    </button>
                  </div>
                  {#if canEdit}
                    <button
                      type="button"
                      class="text-[10px] font-bold uppercase tracking-wider text-[#888]"
                      onclick={() => handleToggleResolved(comment._id)}
                    >
                      {comment.resolved ? "Reopen" : "Resolve"}
                    </button>
                  {/if}
                </div>
                <p class="mt-2 text-sm text-[#1a1a1a]">{comment.text}</p>
              </div>
            {/each}
          {/if}
        </div>

        {#if canComment}
          <div class="flex-shrink-0 border-t-2 border-[#1a1a1a] bg-[#f0f0e8] p-4">
            <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-[#888]">
              Comment at {formatTimestamp(currentTime)}
            </label>
            <textarea
              bind:value={commentText}
              class="min-h-24 w-full border-2 border-[#1a1a1a] bg-[#f0f0e8] px-3 py-2 text-sm outline-none"
              placeholder="Leave a frame-accurate comment..."
            ></textarea>
            <button
              type="button"
              class="mt-3 inline-flex items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-3 py-2 text-sm font-bold text-[#f0f0e8] hover:bg-[#2d5a2d] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!commentText.trim()}
              onclick={handleCreateComment}
            >
              Add comment
            </button>
          </div>
        {/if}
      </div>
    {/if}

    <ShareDialog
      videoId={resolvedVideoId}
      open={shareDialogOpen}
      onOpenChange={(open) => (shareDialogOpen = open)}
    />

    <ManageVideoTagsDialog
      open={manageTagsOpen}
      projectId={resolvedProjectId ?? null}
      teamId={resolvedTeamId}
      selectedVideos={selectedVideosForTags}
      onOpenChange={(open) => (manageTagsOpen = open)}
    />
  </div>
{/if}
