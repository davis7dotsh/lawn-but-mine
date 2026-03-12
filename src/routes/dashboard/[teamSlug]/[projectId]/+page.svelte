<script lang="ts">// pragma: allowlist secret
  import { goto } from "$app/navigation"; // pragma: allowlist secret
  import { browser } from "$app/environment"; // pragma: allowlist secret
  import { page } from "$app/state"; // pragma: allowlist secret
  import { api } from "@convex/_generated/api"; // pragma: allowlist secret
  import type { Id } from "@convex/_generated/dataModel"; // pragma: allowlist secret
  import { useConvexClient, useQuery } from "convex-svelte"; // pragma: allowlist secret
  import { // pragma: allowlist secret
    Download, // pragma: allowlist secret
    Eye, // pragma: allowlist secret
    Grid3X3, // pragma: allowlist secret
    LayoutList, // pragma: allowlist secret
    Link as LinkIcon, // pragma: allowlist secret
    MessageSquare, // pragma: allowlist secret
    Play, // pragma: allowlist secret
    Trash2, // pragma: allowlist secret
  } from "lucide-svelte"; // pragma: allowlist secret
  import DashboardHeader from "@/lib/components/DashboardHeader.svelte"; // pragma: allowlist secret
  import DropZone from "@/lib/components/upload/DropZone.svelte"; // pragma: allowlist secret
  import UploadButton from "@/lib/components/upload/UploadButton.svelte"; // pragma: allowlist secret
  import VideoWorkflowStatusControl, { // pragma: allowlist secret
    type VideoWorkflowStatus, // pragma: allowlist secret
  } from "@/lib/components/videos/VideoWorkflowStatusControl.svelte"; // pragma: allowlist secret
  import { useDashboardUploadContext } from "@/lib/dashboardUploadContext.svelte"; // pragma: allowlist secret
  import { formatDuration, formatRelativeTime } from "@/lib/utils"; // pragma: allowlist secret
  import { makeRouteQuerySpec, prewarmIntent, prewarmSpecs } from "@/lib/convex/prewarm"; // pragma: allowlist secret
  import { projectPath, teamHomePath, videoPath } from "@/lib/routes"; // pragma: allowlist secret

  type ViewMode = "grid" | "list"; // pragma: allowlist secret
  type ShareToastState = { // pragma: allowlist secret
    tone: "success" | "error"; // pragma: allowlist secret
    message: string; // pragma: allowlist secret
  }; // pragma: allowlist secret

  const convex = useConvexClient(); // pragma: allowlist secret
  const uploadContext = useDashboardUploadContext(); // pragma: allowlist secret

  let viewMode = $state<ViewMode>("grid"); // pragma: allowlist secret
  let shareToast = $state<ShareToastState | null>(null); // pragma: allowlist secret
  let shareToastTimeout: ReturnType<typeof setTimeout> | null = null; // pragma: allowlist secret

  const teamSlug = $derived(page.params.teamSlug); // pragma: allowlist secret
  const projectId = $derived(page.params.projectId as Id<"projects">); // pragma: allowlist secret
  const pathname = $derived(page.url.pathname); // pragma: allowlist secret

  const contextQuery = useQuery(api.workspace.resolveContext, () => ({ // pragma: allowlist secret
    teamSlug, // pragma: allowlist secret
    projectId, // pragma: allowlist secret
  })); // pragma: allowlist secret

  const resolvedProjectId = $derived( // pragma: allowlist secret
    contextQuery.data?.project?._id as Id<"projects"> | undefined, // pragma: allowlist secret
  ); // pragma: allowlist secret
  const resolvedTeamSlug = $derived(contextQuery.data?.team.slug ?? teamSlug); // pragma: allowlist secret

  const projectQuery = useQuery(api.projects.get, () => // pragma: allowlist secret
    resolvedProjectId ? { projectId: resolvedProjectId } : "skip", // pragma: allowlist secret
  ); // pragma: allowlist secret
  const videosQuery = useQuery(api.videos.list, () => // pragma: allowlist secret
    resolvedProjectId ? { projectId: resolvedProjectId } : "skip", // pragma: allowlist secret
  ); // pragma: allowlist secret
  const presenceQuery = useQuery(api.videoPresence.listProjectOnlineCounts, () => // pragma: allowlist secret
    resolvedProjectId ? { projectId: resolvedProjectId } : "skip", // pragma: allowlist secret
  ); // pragma: allowlist secret

  const shouldCanonicalize = $derived( // pragma: allowlist secret
    Boolean(contextQuery.data && !contextQuery.data.isCanonical && pathname !== contextQuery.data.canonicalPath), // pragma: allowlist secret
  ); // pragma: allowlist secret

  const prewarmTeam = (nextTeamSlug: string) => // pragma: allowlist secret
    prewarmSpecs(convex, [makeRouteQuerySpec(api.workspace.resolveContext, { teamSlug: nextTeamSlug })]); // pragma: allowlist secret

  const prewarmVideo = (nextTeamSlug: string, nextProjectId: Id<"projects">, videoId: Id<"videos">) => // pragma: allowlist secret
    prewarmSpecs(convex, [ // pragma: allowlist secret
      makeRouteQuerySpec(api.workspace.resolveContext, { // pragma: allowlist secret
        teamSlug: nextTeamSlug, // pragma: allowlist secret
        projectId: nextProjectId, // pragma: allowlist secret
        videoId, // pragma: allowlist secret
      }), // pragma: allowlist secret
      makeRouteQuerySpec(api.videos.get, { // pragma: allowlist secret
        videoId, // pragma: allowlist secret
      }), // pragma: allowlist secret
      makeRouteQuerySpec(api.comments.list, { // pragma: allowlist secret
        videoId, // pragma: allowlist secret
      }), // pragma: allowlist secret
      makeRouteQuerySpec(api.comments.getThreaded, { // pragma: allowlist secret
        videoId, // pragma: allowlist secret
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
    return () => { // pragma: allowlist secret
      if (shareToastTimeout) { // pragma: allowlist secret
        clearTimeout(shareToastTimeout); // pragma: allowlist secret
      } // pragma: allowlist secret
    }; // pragma: allowlist secret
  }); // pragma: allowlist secret

  const isLoadingData = $derived( // pragma: allowlist secret
    contextQuery.data === undefined || // pragma: allowlist secret
      projectQuery.data === undefined || // pragma: allowlist secret
      videosQuery.data === undefined || // pragma: allowlist secret
      shouldCanonicalize, // pragma: allowlist secret
  ); // pragma: allowlist secret

  const handleFilesSelected = async (files: File[]) => { // pragma: allowlist secret
    if (!resolvedProjectId) return; // pragma: allowlist secret
    await uploadContext.requestUpload(files, resolvedProjectId); // pragma: allowlist secret
  }; // pragma: allowlist secret

  const handleDeleteVideo = async (videoId: Id<"videos">) => { // pragma: allowlist secret
    if (!window.confirm("Are you sure you want to delete this video?")) return; // pragma: allowlist secret
    await convex.mutation(api.videos.remove, { videoId }); // pragma: allowlist secret
  }; // pragma: allowlist secret

  const handleDownloadVideo = async (videoId: Id<"videos">, title: string) => { // pragma: allowlist secret
    const result = await convex.action(api.videoActions.getDownloadUrl, { videoId }); // pragma: allowlist secret
    if (!result?.url) return; // pragma: allowlist secret

    const anchor = document.createElement("a"); // pragma: allowlist secret
    anchor.href = result.url; // pragma: allowlist secret
    anchor.download = result.filename ?? `${title}.mp4`; // pragma: allowlist secret
    document.body.appendChild(anchor); // pragma: allowlist secret
    anchor.click(); // pragma: allowlist secret
    document.body.removeChild(anchor); // pragma: allowlist secret
  }; // pragma: allowlist secret

  const handleUpdateWorkflowStatus = async ( // pragma: allowlist secret
    videoId: Id<"videos">, // pragma: allowlist secret
    workflowStatus: VideoWorkflowStatus, // pragma: allowlist secret
  ) => { // pragma: allowlist secret
    await convex.mutation(api.videos.updateWorkflowStatus, { // pragma: allowlist secret
      videoId, // pragma: allowlist secret
      workflowStatus, // pragma: allowlist secret
    }); // pragma: allowlist secret
  }; // pragma: allowlist secret

  const showShareToast = (tone: ShareToastState["tone"], message: string) => { // pragma: allowlist secret
    shareToast = { tone, message }; // pragma: allowlist secret
    if (shareToastTimeout) { // pragma: allowlist secret
      clearTimeout(shareToastTimeout); // pragma: allowlist secret
    } // pragma: allowlist secret
    shareToastTimeout = setTimeout(() => { // pragma: allowlist secret
      shareToast = null; // pragma: allowlist secret
      shareToastTimeout = null; // pragma: allowlist secret
    }, 2400); // pragma: allowlist secret
  }; // pragma: allowlist secret

  const copyTextToClipboard = async (text: string) => { // pragma: allowlist secret
    if (navigator.clipboard?.writeText) { // pragma: allowlist secret
      await navigator.clipboard.writeText(text); // pragma: allowlist secret
      return true; // pragma: allowlist secret
    } // pragma: allowlist secret

    const textarea = document.createElement("textarea"); // pragma: allowlist secret
    textarea.value = text; // pragma: allowlist secret
    textarea.style.position = "fixed"; // pragma: allowlist secret
    textarea.style.opacity = "0"; // pragma: allowlist secret
    document.body.appendChild(textarea); // pragma: allowlist secret
    textarea.focus(); // pragma: allowlist secret
    textarea.select(); // pragma: allowlist secret
    const copied = document.execCommand("copy"); // pragma: allowlist secret
    document.body.removeChild(textarea); // pragma: allowlist secret
    return copied; // pragma: allowlist secret
  }; // pragma: allowlist secret

  const handleShareVideo = async (video: { // pragma: allowlist secret
    _id: Id<"videos">; // pragma: allowlist secret
    publicId?: string; // pragma: allowlist secret
    status: string; // pragma: allowlist secret
    visibility: "public" | "private"; // pragma: allowlist secret
  }) => { // pragma: allowlist secret
    const canSharePublicly = // pragma: allowlist secret
      Boolean(video.publicId) && // pragma: allowlist secret
      video.status === "ready" && // pragma: allowlist secret
      video.visibility === "public"; // pragma: allowlist secret
    const path = canSharePublicly // pragma: allowlist secret
      ? `/watch/${video.publicId}` // pragma: allowlist secret
      : videoPath(resolvedTeamSlug, projectId, video._id); // pragma: allowlist secret
    const url = `${window.location.origin}${path}`; // pragma: allowlist secret

    try { // pragma: allowlist secret
      const copied = await copyTextToClipboard(url); // pragma: allowlist secret
      if (!copied) { // pragma: allowlist secret
        showShareToast("error", "Could not copy link"); // pragma: allowlist secret
        return; // pragma: allowlist secret
      } // pragma: allowlist secret
      showShareToast( // pragma: allowlist secret
        "success", // pragma: allowlist secret
        canSharePublicly // pragma: allowlist secret
          ? "Share link copied" // pragma: allowlist secret
          : "Video link copied (public watch link not available yet)", // pragma: allowlist secret
      ); // pragma: allowlist secret
    } catch { // pragma: allowlist secret
      showShareToast("error", "Could not copy link"); // pragma: allowlist secret
    } // pragma: allowlist secret
  }; // pragma: allowlist secret

  const canUpload = $derived(projectQuery.data?.role !== "viewer"); // pragma: allowlist secret
</script>

{#if contextQuery.data === null || projectQuery.data === null}
  <div class="flex h-full items-center justify-center">
    <div class="text-[#888]">Project not found</div>
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
        { label: projectQuery.data?.name ?? " " },
      ]}
    >
      <div class={`flex items-center gap-2 transition-opacity duration-300 flex-shrink-0 ${isLoadingData ? "opacity-0" : "opacity-100"}`}>
        <div class="flex items-center border-2 border-[#1a1a1a] p-0.5">
          <button
            type="button"
            class={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-[#1a1a1a] text-[#f0f0e8]" : "text-[#888] hover:text-[#1a1a1a]"}`}
            on:click={() => (viewMode = "grid")}
          >
            <Grid3X3 class="h-4 w-4" />
          </button>
          <button
            type="button"
            class={`p-1.5 transition-colors ${viewMode === "list" ? "bg-[#1a1a1a] text-[#f0f0e8]" : "text-[#888] hover:text-[#1a1a1a]"}`}
            on:click={() => (viewMode = "list")}
          >
            <LayoutList class="h-4 w-4" />
          </button>
        </div>

        {#if canUpload}
          <UploadButton onFilesSelected={handleFilesSelected} />
        {/if}
      </div>
    </DashboardHeader>

    <div class="flex-1 overflow-auto">
      {#if !isLoadingData && videosQuery.data && videosQuery.data.length === 0}
        <div class="h-full flex items-center justify-center p-6 animate-in fade-in duration-300">
          <DropZone
            class="max-w-xl w-full"
            onFilesSelected={handleFilesSelected}
            disabled={!canUpload}
          />
        </div>
      {:else if viewMode === "grid"}
        <div class={`p-6 transition-opacity duration-300 ${isLoadingData ? "opacity-0" : "opacity-100"}`}>
          <div class="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {#if videosQuery.data && projectQuery.data}
              {#each videosQuery.data as video}
                <a
                  href={videoPath(resolvedTeamSlug, projectQuery.data._id, video._id)}
                  class="group cursor-pointer flex flex-col"
                  use:prewarmIntent={{
                    run: () => prewarmVideo(resolvedTeamSlug, projectQuery.data!._id, video._id),
                  }}
                >
                  <div class="relative aspect-video bg-[#e8e8e0] overflow-hidden border-2 border-[#1a1a1a] shadow-[4px_4px_0px_0px_var(--shadow-color)] group-hover:translate-y-[2px] group-hover:translate-x-[2px] group-hover:shadow-[2px_2px_0px_0px_var(--shadow-color)] transition-all">
                    {#if video.thumbnailUrl?.startsWith("http")}
                      <img src={video.thumbnailUrl} alt={video.title} class="h-full w-full object-cover" />
                    {:else}
                      <div class="absolute inset-0 flex items-center justify-center">
                        <Play class="h-10 w-10 text-[#888]" />
                      </div>
                    {/if}

                    {#if video.status === "ready" && video.duration}
                      <div class="absolute bottom-2 right-2 bg-black/70 px-1.5 py-0.5 text-[11px] font-mono text-white">
                        {formatDuration(video.duration)}
                      </div>
                    {/if}

                    {#if video.status !== "ready"}
                      <div class="absolute inset-0 flex items-center justify-center bg-black/60">
                        <span class="text-xs font-bold uppercase tracking-wider text-white">
                          {video.status === "uploading" ? "Uploading..." : video.status === "processing" ? "Processing..." : "Failed"}
                        </span>
                      </div>
                    {/if}
                  </div>

                  <div class="mt-2.5">
                    <p class="truncate text-[15px] font-black leading-tight text-[#1a1a1a]">{video.title}</p>
                    <div class="mt-1.5 flex items-center gap-3">
                      <VideoWorkflowStatusControl
                        status={video.workflowStatus}
                        stopPropagation
                        disabled={!canUpload}
                        onChange={(workflowStatus) => handleUpdateWorkflowStatus(video._id, workflowStatus)}
                      />

                      {#if video.commentCount > 0}
                        <span class="inline-flex items-center gap-1 text-[11px] text-[#888]">
                          <MessageSquare class="h-3 w-3" />
                          {video.commentCount}
                        </span>
                      {/if}

                      {#if presenceQuery.data?.counts?.[video._id] > 0}
                        <span class="inline-flex items-center gap-1 text-[11px] text-[#1a1a1a]">
                          <Eye class="h-3 w-3" />
                          {presenceQuery.data.counts[video._id]}
                        </span>
                      {/if}

                      <span class="ml-auto text-[11px] font-mono text-[#888]">
                        {formatRelativeTime(video._creationTime)}
                      </span>
                    </div>

                    <div class="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        class="inline-flex items-center justify-center border-2 border-[#1a1a1a] px-2 py-1 text-[11px] font-bold text-[#1a1a1a] hover:bg-[#e8e8e0]"
                        on:click|preventDefault={() => handleShareVideo(video)}
                      >
                        <LinkIcon class="mr-1 h-3 w-3" />
                        Share
                      </button>

                      {#if video.s3Key && video.status !== "failed" && video.status !== "uploading"}
                        <button
                          type="button"
                          class="inline-flex items-center justify-center border-2 border-[#1a1a1a] px-2 py-1 text-[11px] font-bold text-[#1a1a1a] hover:bg-[#e8e8e0]"
                          on:click|preventDefault={() => handleDownloadVideo(video._id, video.title)}
                        >
                          <Download class="mr-1 h-3 w-3" />
                          Download
                        </button>
                      {/if}

                      {#if canUpload}
                        <button
                          type="button"
                          class="inline-flex items-center justify-center border-2 border-[#dc2626] px-2 py-1 text-[11px] font-bold text-[#dc2626] hover:bg-[#dc2626]/10"
                          on:click|preventDefault={() => handleDeleteVideo(video._id)}
                        >
                          <Trash2 class="mr-1 h-3 w-3" />
                          Delete
                        </button>
                      {/if}
                    </div>
                  </div>
                </a>
              {/each}
            {/if}
          </div>
        </div>
      {:else}
        <div class={`divide-y-2 divide-[#1a1a1a] transition-opacity duration-300 ${isLoadingData ? "opacity-0" : "opacity-100"}`}>
          {#if videosQuery.data && projectQuery.data}
            {#each videosQuery.data as video}
              <a
                href={videoPath(resolvedTeamSlug, projectQuery.data._id, video._id)}
                class="group flex items-center gap-5 px-6 py-3 hover:bg-[#e8e8e0] cursor-pointer transition-colors"
                use:prewarmIntent={{
                  run: () => prewarmVideo(resolvedTeamSlug, projectQuery.data!._id, video._id),
                }}
              >
                <div class="relative w-44 aspect-video bg-[#e8e8e0] overflow-hidden border-2 border-[#1a1a1a] shrink-0 shadow-[4px_4px_0px_0px_var(--shadow-color)] group-hover:translate-y-[2px] group-hover:translate-x-[2px] group-hover:shadow-[2px_2px_0px_0px_var(--shadow-color)] transition-all">
                  {#if video.thumbnailUrl?.startsWith("http")}
                    <img src={video.thumbnailUrl} alt={video.title} class="h-full w-full object-cover" />
                  {:else}
                    <div class="absolute inset-0 flex items-center justify-center">
                      <Play class="h-6 w-6 text-[#888]" />
                    </div>
                  {/if}

                  {#if video.status !== "ready"}
                    <div class="absolute inset-0 flex items-center justify-center bg-black/60">
                      <span class="text-[10px] font-bold uppercase tracking-wider text-white">
                        {video.status === "uploading" ? "Uploading..." : video.status === "processing" ? "Processing..." : "Failed"}
                      </span>
                    </div>
                  {/if}

                  {#if video.status === "ready" && video.duration}
                    <div class="absolute bottom-1 right-1 bg-black/70 px-1 py-0.5 text-[10px] font-mono text-white">
                      {formatDuration(video.duration)}
                    </div>
                  {/if}
                </div>

                <div class="flex-1 min-w-0">
                  <p class="truncate font-black text-[#1a1a1a]">{video.title}</p>
                  <div class="mt-1 flex items-center gap-3">
                    <VideoWorkflowStatusControl
                      status={video.workflowStatus}
                      stopPropagation
                      disabled={!canUpload}
                      onChange={(workflowStatus) => handleUpdateWorkflowStatus(video._id, workflowStatus)}
                    />

                    {#if video.commentCount > 0}
                      <span class="inline-flex items-center gap-1 text-xs text-[#888]">
                        <MessageSquare class="h-3.5 w-3.5" />
                        {video.commentCount}
                      </span>
                    {/if}

                    {#if presenceQuery.data?.counts?.[video._id] > 0}
                      <span class="inline-flex items-center gap-1 text-xs text-[#1a1a1a]">
                        <Eye class="h-3.5 w-3.5" />
                        {presenceQuery.data.counts[video._id]}
                      </span>
                    {/if}

                    <span class="text-xs font-mono text-[#888]">{formatRelativeTime(video._creationTime)}</span>

                    {#if video.uploaderName}
                      <span class="text-xs text-[#888]">{video.uploaderName}</span>
                    {/if}
                  </div>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    class="inline-flex items-center justify-center border-2 border-[#1a1a1a] px-2 py-1 text-[11px] font-bold text-[#1a1a1a] hover:bg-[#e8e8e0]"
                    on:click|preventDefault={() => handleShareVideo(video)}
                  >
                    <LinkIcon class="mr-1 h-3 w-3" />
                    Share
                  </button>

                  {#if video.s3Key && video.status !== "failed" && video.status !== "uploading"}
                    <button
                      type="button"
                      class="inline-flex items-center justify-center border-2 border-[#1a1a1a] px-2 py-1 text-[11px] font-bold text-[#1a1a1a] hover:bg-[#e8e8e0]"
                      on:click|preventDefault={() => handleDownloadVideo(video._id, video.title)}
                    >
                      <Download class="mr-1 h-3 w-3" />
                      Download
                    </button>
                  {/if}

                  {#if canUpload}
                    <button
                      type="button"
                      class="inline-flex items-center justify-center border-2 border-[#dc2626] px-2 py-1 text-[11px] font-bold text-[#dc2626] hover:bg-[#dc2626]/10"
                      on:click|preventDefault={() => handleDeleteVideo(video._id)}
                    >
                      <Trash2 class="mr-1 h-3 w-3" />
                      Delete
                    </button>
                  {/if}
                </div>
              </a>
            {/each}
          {/if}
        </div>
      {/if}
    </div>

    {#if shareToast}
      <div class="fixed right-4 top-4 z-50" aria-live="polite">
        <div
          class={`border-2 px-3 py-2 text-sm font-bold shadow-[4px_4px_0px_0px_var(--shadow-color)] ${shareToast.tone === "success" ? "border-[#1a1a1a] bg-[#f0f0e8] text-[#1a1a1a]" : "border-[#dc2626] bg-[#fef2f2] text-[#dc2626]"}`}
        >
          {shareToast.message}
        </div>
      </div>
    {/if}
  </div>
{/if}
