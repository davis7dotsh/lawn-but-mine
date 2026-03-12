<script lang="ts">// pragma: allowlist secret
  import { goto } from "$app/navigation"; // pragma: allowlist secret
  import { browser } from "$app/environment"; // pragma: allowlist secret
  import { page } from "$app/state"; // pragma: allowlist secret
  import { api } from "@convex/_generated/api"; // pragma: allowlist secret
  import type { Id } from "@convex/_generated/dataModel"; // pragma: allowlist secret
  import { useConvexClient, useQuery } from "convex-svelte"; // pragma: allowlist secret
  import { // pragma: allowlist secret
    Check, // pragma: allowlist secret
    Edit2, // pragma: allowlist secret
    Link as LinkIcon, // pragma: allowlist secret
    MessageSquare, // pragma: allowlist secret
    MoreVertical, // pragma: allowlist secret
    RefreshCcw, // pragma: allowlist secret
    X, // pragma: allowlist secret
  } from "lucide-svelte"; // pragma: allowlist secret
  import DashboardHeader from "@/lib/components/DashboardHeader.svelte"; // pragma: allowlist secret
  import ShareDialog from "@/lib/components/ShareDialog.svelte"; // pragma: allowlist secret
  import VideoWorkflowStatusControl, { // pragma: allowlist secret
    type VideoWorkflowStatus, // pragma: allowlist secret
  } from "@/lib/components/videos/VideoWorkflowStatusControl.svelte"; // pragma: allowlist secret
  import { formatDuration, formatTimestamp } from "@/lib/utils"; // pragma: allowlist secret
  import { makeRouteQuerySpec, prewarmSpecs } from "@/lib/convex/prewarm"; // pragma: allowlist secret
  import { projectPath, teamHomePath } from "@/lib/routes"; // pragma: allowlist secret

  type Watcher = { // pragma: allowlist secret
    userId: string; // pragma: allowlist secret
    online: boolean; // pragma: allowlist secret
    kind: "member" | "guest"; // pragma: allowlist secret
    displayName: string; // pragma: allowlist secret
    avatarUrl?: string; // pragma: allowlist secret
  }; // pragma: allowlist secret

  type ThreadedComment = { // pragma: allowlist secret
    _id: Id<"comments">; // pragma: allowlist secret
    _creationTime: number; // pragma: allowlist secret
    text: string; // pragma: allowlist secret
    timestampSeconds: number; // pragma: allowlist secret
    resolved: boolean; // pragma: allowlist secret
    userName: string; // pragma: allowlist secret
    userAvatarUrl?: string; // pragma: allowlist secret
    replies?: ThreadedComment[]; // pragma: allowlist secret
  }; // pragma: allowlist secret

  const STORAGE_KEY_CLIENT_ID = "lawn.presence.client_id"; // pragma: allowlist secret
  const DEFAULT_HEARTBEAT_INTERVAL_MS = 15_000; // pragma: allowlist secret
  const DISCONNECT_PATH = "videoPresence:disconnect"; // pragma: allowlist secret
  const convexUrl = import.meta.env.VITE_CONVEX_URL; // pragma: allowlist secret

  const convex = useConvexClient(); // pragma: allowlist secret

  let videoElement = $state<HTMLVideoElement | null>(null); // pragma: allowlist secret
  let currentTime = $state(0); // pragma: allowlist secret
  let isEditingTitle = $state(false); // pragma: allowlist secret
  let editedTitle = $state(""); // pragma: allowlist secret
  let highlightedCommentId = $state<Id<"comments"> | undefined>(undefined); // pragma: allowlist secret
  let shareDialogOpen = $state(false); // pragma: allowlist secret
  let mobileCommentsOpen = $state(false); // pragma: allowlist secret
  let playbackSession = $state<{ url: string; posterUrl: string } | null>(null); // pragma: allowlist secret
  let isLoadingPlayback = $state(false); // pragma: allowlist secret
  let originalPlaybackUrl = $state<string | null>(null); // pragma: allowlist secret
  let isLoadingOriginalPlayback = $state(false); // pragma: allowlist secret
  let isRetryingProcessing = $state(false); // pragma: allowlist secret
  let preferredSource = $state<"mux720" | "original">("original"); // pragma: allowlist secret
  let hasManuallySelectedSource = $state(false); // pragma: allowlist secret
  let roomToken = $state<string | null>(null); // pragma: allowlist secret
  let sessionToken = $state<string | null>(null); // pragma: allowlist secret
  let clientId = $state<string | null>(null); // pragma: allowlist secret
  let commentText = $state(""); // pragma: allowlist secret

  const teamSlug = $derived(page.params.teamSlug); // pragma: allowlist secret
  const projectId = $derived(page.params.projectId as Id<"projects">); // pragma: allowlist secret
  const videoId = $derived(page.params.videoId as Id<"videos">); // pragma: allowlist secret
  const pathname = $derived(page.url.pathname); // pragma: allowlist secret

  const contextQuery = useQuery(api.workspace.resolveContext, () => ({ // pragma: allowlist secret
    teamSlug, // pragma: allowlist secret
    projectId, // pragma: allowlist secret
    videoId, // pragma: allowlist secret
  })); // pragma: allowlist secret

  const resolvedTeamSlug = $derived(contextQuery.data?.team.slug ?? teamSlug); // pragma: allowlist secret
  const resolvedProjectId = $derived( // pragma: allowlist secret
    contextQuery.data?.project?._id as Id<"projects"> | undefined, // pragma: allowlist secret
  ); // pragma: allowlist secret
  const resolvedVideoId = $derived( // pragma: allowlist secret
    contextQuery.data?.video?._id as Id<"videos"> | undefined, // pragma: allowlist secret
  ); // pragma: allowlist secret

  const videoQuery = useQuery(api.videos.get, () => // pragma: allowlist secret
    resolvedVideoId ? { videoId: resolvedVideoId } : "skip", // pragma: allowlist secret
  ); // pragma: allowlist secret
  const commentsQuery = useQuery(api.comments.list, () => // pragma: allowlist secret
    resolvedVideoId ? { videoId: resolvedVideoId } : "skip", // pragma: allowlist secret
  ); // pragma: allowlist secret
  const commentsThreadedQuery = useQuery(api.comments.getThreaded, () => // pragma: allowlist secret
    resolvedVideoId ? { videoId: resolvedVideoId } : "skip", // pragma: allowlist secret
  ); // pragma: allowlist secret
  const presenceStateQuery = useQuery(api.videoPresence.list, () => // pragma: allowlist secret
    roomToken ? { roomToken } : "skip", // pragma: allowlist secret
  ); // pragma: allowlist secret

  const watchers = $derived( // pragma: allowlist secret
    (presenceStateQuery.data ?? []) // pragma: allowlist secret
      .filter((watcher) => watcher.online) // pragma: allowlist secret
      .map((watcher) => ({ // pragma: allowlist secret
        userId: watcher.userId, // pragma: allowlist secret
        online: watcher.online, // pragma: allowlist secret
        kind: watcher.data?.kind ?? "member", // pragma: allowlist secret
        displayName: watcher.data?.displayName ?? "Member", // pragma: allowlist secret
        avatarUrl: watcher.data?.avatarUrl, // pragma: allowlist secret
      })) as Watcher[], // pragma: allowlist secret
  ); // pragma: allowlist secret

  const isPlayable = $derived(videoQuery.data?.status === "ready" && Boolean(videoQuery.data?.muxPlaybackId)); // pragma: allowlist secret
  const playbackUrl = $derived(playbackSession?.url ?? null); // pragma: allowlist secret
  const activePlaybackUrl = $derived( // pragma: allowlist secret
    preferredSource === "mux720" // pragma: allowlist secret
      ? playbackUrl ?? originalPlaybackUrl // pragma: allowlist secret
      : originalPlaybackUrl ?? playbackUrl, // pragma: allowlist secret
  ); // pragma: allowlist secret
  const activeQualityId = $derived( // pragma: allowlist secret
    activePlaybackUrl && playbackUrl && activePlaybackUrl === playbackUrl ? "mux720" : "original", // pragma: allowlist secret
  ); // pragma: allowlist secret
  const isUsingOriginalFallback = $derived( // pragma: allowlist secret
    Boolean(activePlaybackUrl && activePlaybackUrl === originalPlaybackUrl && !playbackUrl), // pragma: allowlist secret
  ); // pragma: allowlist secret
  const shouldCanonicalize = $derived( // pragma: allowlist secret
    Boolean(contextQuery.data && !contextQuery.data.isCanonical && pathname !== contextQuery.data.canonicalPath), // pragma: allowlist secret
  ); // pragma: allowlist secret

  const prewarmTeam = (nextTeamSlug: string) => // pragma: allowlist secret
    prewarmSpecs(convex, [makeRouteQuerySpec(api.workspace.resolveContext, { teamSlug: nextTeamSlug })]); // pragma: allowlist secret

  const prewarmProject = (nextTeamSlug: string, nextProjectId: Id<"projects">) => // pragma: allowlist secret
    prewarmSpecs(convex, [ // pragma: allowlist secret
      makeRouteQuerySpec(api.workspace.resolveContext, { // pragma: allowlist secret
        teamSlug: nextTeamSlug, // pragma: allowlist secret
        projectId: nextProjectId, // pragma: allowlist secret
      }), // pragma: allowlist secret
      makeRouteQuerySpec(api.projects.get, { // pragma: allowlist secret
        projectId: nextProjectId, // pragma: allowlist secret
      }), // pragma: allowlist secret
      makeRouteQuerySpec(api.videos.list, { // pragma: allowlist secret
        projectId: nextProjectId, // pragma: allowlist secret
      }), // pragma: allowlist secret
    ]); // pragma: allowlist secret

  $effect(() => { // pragma: allowlist secret
    if (!browser || !shouldCanonicalize || !contextQuery.data) return; // pragma: allowlist secret
    void goto(contextQuery.data.canonicalPath, { // pragma: allowlist secret
      replaceState: true, // pragma: allowlist secret
      noScroll: true, // pragma: allowlist secret
    }); // pragma: allowlist secret
  }); // pragma: allowlist secret

  $effect(() => { // pragma: allowlist secret
    if (!resolvedVideoId || !isPlayable) { // pragma: allowlist secret
      playbackSession = null; // pragma: allowlist secret
      isLoadingPlayback = false; // pragma: allowlist secret
      return; // pragma: allowlist secret
    } // pragma: allowlist secret

    let cancelled = false; // pragma: allowlist secret
    isLoadingPlayback = true; // pragma: allowlist secret

    void convex // pragma: allowlist secret
      .action(api.videoActions.getPlaybackSession, { videoId: resolvedVideoId }) // pragma: allowlist secret
      .then((session) => { // pragma: allowlist secret
        if (cancelled) return; // pragma: allowlist secret
        playbackSession = session; // pragma: allowlist secret
      }) // pragma: allowlist secret
      .catch(() => { // pragma: allowlist secret
        if (cancelled) return; // pragma: allowlist secret
        playbackSession = null; // pragma: allowlist secret
      }) // pragma: allowlist secret
      .finally(() => { // pragma: allowlist secret
        if (cancelled) return; // pragma: allowlist secret
        isLoadingPlayback = false; // pragma: allowlist secret
      }); // pragma: allowlist secret

    return () => { // pragma: allowlist secret
      cancelled = true; // pragma: allowlist secret
    }; // pragma: allowlist secret
  }); // pragma: allowlist secret

  $effect(() => { // pragma: allowlist secret
    if (!resolvedVideoId || !videoQuery.data || videoQuery.data.status === "uploading") { // pragma: allowlist secret
      originalPlaybackUrl = null; // pragma: allowlist secret
      isLoadingOriginalPlayback = false; // pragma: allowlist secret
      return; // pragma: allowlist secret
    } // pragma: allowlist secret

    let cancelled = false; // pragma: allowlist secret
    isLoadingOriginalPlayback = true; // pragma: allowlist secret

    void convex // pragma: allowlist secret
      .action(api.videoActions.getOriginalPlaybackUrl, { videoId: resolvedVideoId }) // pragma: allowlist secret
      .then((result) => { // pragma: allowlist secret
        if (cancelled) return; // pragma: allowlist secret
        originalPlaybackUrl = result.url; // pragma: allowlist secret
      }) // pragma: allowlist secret
      .catch(() => { // pragma: allowlist secret
        if (cancelled) return; // pragma: allowlist secret
        originalPlaybackUrl = null; // pragma: allowlist secret
      }) // pragma: allowlist secret
      .finally(() => { // pragma: allowlist secret
        if (cancelled) return; // pragma: allowlist secret
        isLoadingOriginalPlayback = false; // pragma: allowlist secret
      }); // pragma: allowlist secret

    return () => { // pragma: allowlist secret
      cancelled = true; // pragma: allowlist secret
    }; // pragma: allowlist secret
  }); // pragma: allowlist secret

  $effect(() => { // pragma: allowlist secret
    if (!resolvedVideoId) return; // pragma: allowlist secret
    hasManuallySelectedSource = false; // pragma: allowlist secret
    preferredSource = "original"; // pragma: allowlist secret
  }); // pragma: allowlist secret

  $effect(() => { // pragma: allowlist secret
    if (hasManuallySelectedSource) return; // pragma: allowlist secret
    if (playbackUrl) { // pragma: allowlist secret
      preferredSource = "mux720"; // pragma: allowlist secret
      return; // pragma: allowlist secret
    } // pragma: allowlist secret
    if (originalPlaybackUrl) { // pragma: allowlist secret
      preferredSource = "original"; // pragma: allowlist secret
    } // pragma: allowlist secret
  }); // pragma: allowlist secret

  $effect(() => { // pragma: allowlist secret
    if (!browser || !import.meta.env.DEV || !resolvedVideoId || videoQuery.data?.status !== "processing") { // pragma: allowlist secret
      return; // pragma: allowlist secret
    } // pragma: allowlist secret

    let cancelled = false; // pragma: allowlist secret
    let timeoutId: ReturnType<typeof setTimeout> | null = null; // pragma: allowlist secret

    const schedule = (delayMs: number) => { // pragma: allowlist secret
      timeoutId = setTimeout(() => { // pragma: allowlist secret
        void tick(); // pragma: allowlist secret
      }, delayMs); // pragma: allowlist secret
    }; // pragma: allowlist secret

    const tick = async () => { // pragma: allowlist secret
      if (cancelled) return; // pragma: allowlist secret

      if (document.visibilityState === "hidden") { // pragma: allowlist secret
        schedule(12_000); // pragma: allowlist secret
        return; // pragma: allowlist secret
      } // pragma: allowlist secret

      try { // pragma: allowlist secret
        const result = await convex.action(api.videoActions.pollMuxProcessingStatus, { // pragma: allowlist secret
          videoId: resolvedVideoId, // pragma: allowlist secret
        }); // pragma: allowlist secret
        if (cancelled || result.status !== "processing") return; // pragma: allowlist secret
        schedule(5_000); // pragma: allowlist secret
      } catch { // pragma: allowlist secret
        if (cancelled) return; // pragma: allowlist secret
        schedule(10_000); // pragma: allowlist secret
      } // pragma: allowlist secret
    }; // pragma: allowlist secret

    void tick(); // pragma: allowlist secret

    return () => { // pragma: allowlist secret
      cancelled = true; // pragma: allowlist secret
      if (timeoutId) { // pragma: allowlist secret
        clearTimeout(timeoutId); // pragma: allowlist secret
      } // pragma: allowlist secret
    }; // pragma: allowlist secret
  }); // pragma: allowlist secret

  $effect(() => { // pragma: allowlist secret
    if (!browser || !resolvedVideoId) return; // pragma: allowlist secret

    const existingClientId = window.localStorage.getItem(STORAGE_KEY_CLIENT_ID); // pragma: allowlist secret
    if (existingClientId) { // pragma: allowlist secret
      clientId = existingClientId; // pragma: allowlist secret
      return; // pragma: allowlist secret
    } // pragma: allowlist secret

    const nextClientId = crypto.randomUUID().replace(/-/g, ""); // pragma: allowlist secret
    window.localStorage.setItem(STORAGE_KEY_CLIENT_ID, nextClientId); // pragma: allowlist secret
    clientId = nextClientId; // pragma: allowlist secret
  }); // pragma: allowlist secret

  $effect(() => { // pragma: allowlist secret
    if (!browser || !resolvedVideoId || !clientId) { // pragma: allowlist secret
      roomToken = null; // pragma: allowlist secret
      return; // pragma: allowlist secret
    } // pragma: allowlist secret

    let active = true; // pragma: allowlist secret
    const currentSessionId = crypto.randomUUID(); // pragma: allowlist secret

    const runHeartbeat = async () => { // pragma: allowlist secret
      const result = await convex.mutation(api.videoPresence.heartbeat, { // pragma: allowlist secret
        videoId: resolvedVideoId, // pragma: allowlist secret
        sessionId: currentSessionId, // pragma: allowlist secret
        clientId, // pragma: allowlist secret
        interval: DEFAULT_HEARTBEAT_INTERVAL_MS, // pragma: allowlist secret
      }); // pragma: allowlist secret

      if (!active) return; // pragma: allowlist secret
      sessionToken = result.sessionToken; // pragma: allowlist secret
      roomToken = result.roomToken; // pragma: allowlist secret
    }; // pragma: allowlist secret

    const handleBeforeUnload = () => { // pragma: allowlist secret
      if (!sessionToken) return; // pragma: allowlist secret
      const payload = { // pragma: allowlist secret
        path: DISCONNECT_PATH, // pragma: allowlist secret
        args: { sessionToken }, // pragma: allowlist secret
      }; // pragma: allowlist secret
      const blob = new Blob([JSON.stringify(payload)], { // pragma: allowlist secret
        type: "application/json", // pragma: allowlist secret
      }); // pragma: allowlist secret
      if (convexUrl) { // pragma: allowlist secret
        navigator.sendBeacon(`${convexUrl}/api/mutation`, blob); // pragma: allowlist secret
      } // pragma: allowlist secret
    }; // pragma: allowlist secret

    void runHeartbeat(); // pragma: allowlist secret
    const intervalId = window.setInterval(() => { // pragma: allowlist secret
      void runHeartbeat(); // pragma: allowlist secret
    }, DEFAULT_HEARTBEAT_INTERVAL_MS); // pragma: allowlist secret

    window.addEventListener("beforeunload", handleBeforeUnload); // pragma: allowlist secret

    return () => { // pragma: allowlist secret
      active = false; // pragma: allowlist secret
      window.removeEventListener("beforeunload", handleBeforeUnload); // pragma: allowlist secret
      clearInterval(intervalId); // pragma: allowlist secret

      const currentSessionToken = sessionToken; // pragma: allowlist secret
      sessionToken = null; // pragma: allowlist secret
      roomToken = null; // pragma: allowlist secret
      if (currentSessionToken) { // pragma: allowlist secret
        void convex.mutation(api.videoPresence.disconnect, { // pragma: allowlist secret
          sessionToken: currentSessionToken, // pragma: allowlist secret
        }).catch(() => undefined); // pragma: allowlist secret
      } // pragma: allowlist secret
    }; // pragma: allowlist secret
  }); // pragma: allowlist secret

  const handleTimeUpdate = () => { // pragma: allowlist secret
    if (!videoElement) return; // pragma: allowlist secret
    currentTime = videoElement.currentTime; // pragma: allowlist secret
  }; // pragma: allowlist secret

  const handleMarkerClick = (commentId: Id<"comments">) => { // pragma: allowlist secret
    highlightedCommentId = commentId; // pragma: allowlist secret
    setTimeout(() => { // pragma: allowlist secret
      if (highlightedCommentId === commentId) { // pragma: allowlist secret
        highlightedCommentId = undefined; // pragma: allowlist secret
      } // pragma: allowlist secret
    }, 3000); // pragma: allowlist secret
  }; // pragma: allowlist secret

  const requestDownload = async () => { // pragma: allowlist secret
    if (!videoQuery.data || videoQuery.data.status !== "ready" || !resolvedVideoId) return null; // pragma: allowlist secret
    return await convex.action(api.videoActions.getDownloadUrl, { // pragma: allowlist secret
      videoId: resolvedVideoId, // pragma: allowlist secret
    }); // pragma: allowlist secret
  }; // pragma: allowlist secret

  const handleTimestampClick = (time: number) => { // pragma: allowlist secret
    if (!videoElement) return; // pragma: allowlist secret
    videoElement.currentTime = time; // pragma: allowlist secret
    videoElement.play().catch(() => undefined); // pragma: allowlist secret
    highlightedCommentId = undefined; // pragma: allowlist secret
  }; // pragma: allowlist secret

  const handleSaveTitle = async () => { // pragma: allowlist secret
    if (!editedTitle.trim() || !resolvedVideoId) return; // pragma: allowlist secret
    await convex.mutation(api.videos.update, { // pragma: allowlist secret
      videoId: resolvedVideoId, // pragma: allowlist secret
      title: editedTitle.trim(), // pragma: allowlist secret
    }); // pragma: allowlist secret
    isEditingTitle = false; // pragma: allowlist secret
  }; // pragma: allowlist secret

  const handleUpdateWorkflowStatus = async (workflowStatus: VideoWorkflowStatus) => { // pragma: allowlist secret
    if (!resolvedVideoId) return; // pragma: allowlist secret
    await convex.mutation(api.videos.updateWorkflowStatus, { // pragma: allowlist secret
      videoId: resolvedVideoId, // pragma: allowlist secret
      workflowStatus, // pragma: allowlist secret
    }); // pragma: allowlist secret
  }; // pragma: allowlist secret

  const handleRetryProcessing = async () => { // pragma: allowlist secret
    if (!resolvedVideoId) return; // pragma: allowlist secret
    isRetryingProcessing = true; // pragma: allowlist secret
    try { // pragma: allowlist secret
      await convex.action(api.videoActions.retryMuxProcessing, { // pragma: allowlist secret
        videoId: resolvedVideoId, // pragma: allowlist secret
      }); // pragma: allowlist secret
    } finally { // pragma: allowlist secret
      isRetryingProcessing = false; // pragma: allowlist secret
    } // pragma: allowlist secret
  }; // pragma: allowlist secret

  const startEditingTitle = () => { // pragma: allowlist secret
    if (!videoQuery.data) return; // pragma: allowlist secret
    editedTitle = videoQuery.data.title; // pragma: allowlist secret
    isEditingTitle = true; // pragma: allowlist secret
  }; // pragma: allowlist secret

  const handleCreateComment = async () => { // pragma: allowlist secret
    if (!resolvedVideoId || !commentText.trim()) return; // pragma: allowlist secret
    await convex.mutation(api.comments.create, { // pragma: allowlist secret
      videoId: resolvedVideoId, // pragma: allowlist secret
      text: commentText.trim(), // pragma: allowlist secret
      timestampSeconds: currentTime, // pragma: allowlist secret
    }); // pragma: allowlist secret
    commentText = ""; // pragma: allowlist secret
  }; // pragma: allowlist secret

  const handleDeleteComment = async (commentId: Id<"comments">) => { // pragma: allowlist secret
    await convex.mutation(api.comments.remove, { // pragma: allowlist secret
      commentId, // pragma: allowlist secret
    }); // pragma: allowlist secret
  }; // pragma: allowlist secret

  const handleToggleResolved = async (commentId: Id<"comments">) => { // pragma: allowlist secret
    await convex.mutation(api.comments.toggleResolved, { // pragma: allowlist secret
      commentId, // pragma: allowlist secret
    }); // pragma: allowlist secret
  }; // pragma: allowlist secret

  const canEdit = $derived(videoQuery.data?.role !== "viewer"); // pragma: allowlist secret
  const canComment = $derived(Boolean(resolvedVideoId)); // pragma: allowlist secret
  const canRetryProcessing = $derived(Boolean(canEdit && videoQuery.data?.s3Key)); // pragma: allowlist secret

  const commentsCount = $derived(commentsQuery.data?.length ?? 0); // pragma: allowlist secret

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
          on:click={() => (shareDialogOpen = true)}
        >
          <LinkIcon class="mr-1.5 h-4 w-4" />
          Share
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center border-2 border-[#1a1a1a] px-3 py-2 text-sm font-bold text-[#1a1a1a] hover:bg-[#e8e8e0] lg:hidden"
          on:click={() => (mobileCommentsOpen = true)}
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
          on:click={() => (mobileCommentsOpen = !mobileCommentsOpen)}
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
            on:keydown={(event) => {
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
            on:click={handleSaveTitle}
          >
            <Check class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center border-2 border-[#1a1a1a]"
            on:click={() => (isEditingTitle = false)}
          >
            <X class="h-4 w-4" />
          </button>
        </div>
      {:else}
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="text-lg font-black text-[#1a1a1a]">{videoQuery.data.title}</h1>
          {#if canEdit}
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center border-2 border-[#1a1a1a] hover:bg-[#e8e8e0]"
              on:click={startEditingTitle}
            >
              <Edit2 class="h-3.5 w-3.5" />
            </button>
          {/if}
          {#if videoQuery.data.status !== "ready"}
            <span class="border-2 border-[#1a1a1a] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#888]">
              {videoQuery.data.status === "uploading" ? "Uploading" : videoQuery.data.status === "processing" ? "Processing" : "Failed"}
            </span>
          {/if}
        </div>
      {/if}
    </div>

    <div class="flex-1 flex overflow-hidden">
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden bg-black">
        {#if videoQuery.data.status === "processing" && isUsingOriginalFallback && activePlaybackUrl}
          <div class="flex-shrink-0 flex items-center gap-2 bg-[#1a1a1a] px-4 py-2 text-sm text-[#f0f0e8]">
            <span class="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-[#7cb87c]"></span>
            <span class="font-semibold">Original playback active.</span>
            <span class="text-[#888]">720p stream is still encoding.</span>
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
                on:click={handleRetryProcessing}
              >
                <RefreshCcw class="mr-2 h-4 w-4" />
                {isRetryingProcessing ? "Retrying..." : "Retry processing"}
              </button>
            {/if}
          </div>
        {/if}

        {#if activePlaybackUrl}
          <div class="flex h-full flex-col">
            <video
              bind:this={videoElement}
              class="h-full w-full flex-1 bg-black"
              src={activePlaybackUrl}
              poster={playbackSession?.posterUrl}
              controls
              playsinline
              on:timeupdate={handleTimeUpdate}
            ></video>

            <div class="flex flex-wrap items-center gap-2 border-t border-white/10 bg-black px-4 py-3 text-sm text-white/80">
              <span class="font-semibold">Playback</span>
              <button
                type="button"
                class={`border px-2 py-1 ${activeQualityId === "mux720" ? "border-white bg-white text-black" : "border-white/20 text-white/70"} disabled:cursor-not-allowed disabled:opacity-40`}
                disabled={!playbackUrl}
                on:click={() => {
                  hasManuallySelectedSource = true;
                  preferredSource = "mux720";
                }}
              >
                {playbackUrl ? "720p" : "720p (encoding...)"}
              </button>
              <button
                type="button"
                class={`border px-2 py-1 ${activeQualityId === "original" ? "border-white bg-white text-black" : "border-white/20 text-white/70"} disabled:cursor-not-allowed disabled:opacity-40`}
                disabled={!originalPlaybackUrl}
                on:click={() => {
                  hasManuallySelectedSource = true;
                  preferredSource = "original";
                }}
              >
                Original
              </button>
              {#if videoQuery.data.status === "ready"}
                <button
                  type="button"
                  class="ml-auto border border-white/20 px-2 py-1 text-white/80 hover:bg-white/10"
                  on:click={async () => {
                    const download = await requestDownload();
                    if (!download?.url) return;
                    const anchor = document.createElement("a");
                    anchor.href = download.url;
                    anchor.download = download.filename ?? `${videoQuery.data.title}.mp4`;
                    document.body.appendChild(anchor);
                    anchor.click();
                    document.body.removeChild(anchor);
                  }}
                >
                  Download
                </button>
              {/if}
            </div>
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
                        on:click={handleRetryProcessing}
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
                      on:click={() => {
                        handleTimestampClick(comment.timestampSeconds);
                        handleMarkerClick(comment._id);
                      }}
                    >
                      {comment.userName}
                    </button>
                    <button
                      type="button"
                      class="mt-1 block text-xs font-mono text-[#888] underline"
                      on:click={() => {
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
                        on:click={() => handleToggleResolved(comment._id)}
                      >
                        {comment.resolved ? "Reopen" : "Resolve"}
                      </button>
                      <button
                        type="button"
                        class="text-[10px] font-bold uppercase tracking-wider text-[#dc2626]"
                        on:click={() => handleDeleteComment(comment._id)}
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
                              on:click={() => {
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
                              on:click={() => handleDeleteComment(reply._id)}
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
              on:click={handleCreateComment}
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
            on:click={() => (mobileCommentsOpen = false)}
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
                      on:click={() => {
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
                      on:click={() => handleToggleResolved(comment._id)}
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
              on:click={handleCreateComment}
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
  </div>
{/if}
