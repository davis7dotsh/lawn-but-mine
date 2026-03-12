<script lang="ts">
  import { goto } from "$app/navigation"; 
  import { browser } from "$app/environment"; 
  import { page } from "$app/state"; 
  import { api } from "@convex/_generated/api"; 
  import type { Id } from "@convex/_generated/dataModel"; 
  import { useConvexClient, useQuery } from "convex-svelte"; 
  import { 
    Download, 
    Eye, 
    Grid3X3, 
    LayoutList, 
    Link as LinkIcon, 
    MessageSquare, 
    Play, 
    Trash2, 
  } from "lucide-svelte"; 
  import DashboardHeader from "@/lib/components/DashboardHeader.svelte"; 
  import DropZone from "@/lib/components/upload/DropZone.svelte"; 
  import UploadButton from "@/lib/components/upload/UploadButton.svelte"; 
  import VideoWorkflowStatusControl, { 
    type VideoWorkflowStatus, 
  } from "@/lib/components/videos/VideoWorkflowStatusControl.svelte"; 
  import { useDashboardUploadContext } from "@/lib/dashboardUploadContext.svelte"; 
  import { formatDuration, formatRelativeTime } from "@/lib/utils"; 
  import { makeRouteQuerySpec, prewarmIntent, prewarmSpecs } from "@/lib/convex/prewarm"; 
  import { projectPath, teamHomePath, videoPath } from "@/lib/routes"; 

  type ViewMode = "grid" | "list"; 
  type ShareToastState = { 
    tone: "success" | "error"; 
    message: string; 
  }; 

  const convex = useConvexClient(); 
  const uploadContext = useDashboardUploadContext(); 

  let viewMode = $state<ViewMode>("grid"); 
  let shareToast = $state<ShareToastState | null>(null); 
  let shareToastTimeout: ReturnType<typeof setTimeout> | null = null; 

  const teamSlug = $derived(page.params.teamSlug); 
  const projectId = $derived(page.params.projectId as Id<"projects">); 
  const pathname = $derived(page.url.pathname); 

  const contextQuery = useQuery(api.workspace.resolveContext, () => ({ 
    teamSlug, 
    projectId, 
  })); 

  const resolvedProjectId = $derived( 
    contextQuery.data?.project?._id as Id<"projects"> | undefined, 
  ); 
  const resolvedTeamSlug = $derived(contextQuery.data?.team.slug ?? teamSlug); 

  const projectQuery = useQuery(api.projects.get, () => 
    resolvedProjectId ? { projectId: resolvedProjectId } : "skip", 
  ); 
  const videosQuery = useQuery(api.videos.list, () => 
    resolvedProjectId ? { projectId: resolvedProjectId } : "skip", 
  ); 
  const presenceQuery = useQuery(api.videoPresence.listProjectOnlineCounts, () => 
    resolvedProjectId ? { projectId: resolvedProjectId } : "skip", 
  ); 

  const shouldCanonicalize = $derived( 
    Boolean(contextQuery.data && !contextQuery.data.isCanonical && pathname !== contextQuery.data.canonicalPath), 
  ); 

  const prewarmTeam = (nextTeamSlug: string) => 
    prewarmSpecs(convex, [makeRouteQuerySpec(api.workspace.resolveContext, { teamSlug: nextTeamSlug })]); 

  const prewarmVideo = (nextTeamSlug: string, nextProjectId: Id<"projects">, videoId: Id<"videos">) => 
    prewarmSpecs(convex, [ 
      makeRouteQuerySpec(api.workspace.resolveContext, { 
        teamSlug: nextTeamSlug, 
        projectId: nextProjectId, 
        videoId, 
      }), 
      makeRouteQuerySpec(api.videos.get, { 
        videoId, 
      }), 
      makeRouteQuerySpec(api.comments.list, { 
        videoId, 
      }), 
      makeRouteQuerySpec(api.comments.getThreaded, { 
        videoId, 
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
    return () => { 
      if (shareToastTimeout) { 
        clearTimeout(shareToastTimeout); 
      } 
    }; 
  }); 

  const isLoadingData = $derived( 
    contextQuery.data === undefined || 
      projectQuery.data === undefined || 
      videosQuery.data === undefined || 
      shouldCanonicalize, 
  ); 

  const handleFilesSelected = async (files: File[]) => { 
    if (!resolvedProjectId) return; 
    await uploadContext.requestUpload(files, resolvedProjectId); 
  }; 

  const handleDeleteVideo = async (videoId: Id<"videos">) => { 
    if (!window.confirm("Are you sure you want to delete this video?")) return; 
    await convex.mutation(api.videos.remove, { videoId }); 
  }; 

  const handleDownloadVideo = async (videoId: Id<"videos">, title: string) => { 
    const result = await convex.action(api.videoActions.getDownloadUrl, { videoId }); 
    if (!result?.url) return; 

    const anchor = document.createElement("a"); 
    anchor.href = result.url; 
    anchor.download = result.filename ?? `${title}.mp4`; 
    document.body.appendChild(anchor); 
    anchor.click(); 
    document.body.removeChild(anchor); 
  }; 

  const handleUpdateWorkflowStatus = async ( 
    videoId: Id<"videos">, 
    workflowStatus: VideoWorkflowStatus, 
  ) => { 
    await convex.mutation(api.videos.updateWorkflowStatus, { 
      videoId, 
      workflowStatus, 
    }); 
  }; 

  const showShareToast = (tone: ShareToastState["tone"], message: string) => { 
    shareToast = { tone, message }; 
    if (shareToastTimeout) { 
      clearTimeout(shareToastTimeout); 
    } 
    shareToastTimeout = setTimeout(() => { 
      shareToast = null; 
      shareToastTimeout = null; 
    }, 2400); 
  }; 

  const copyTextToClipboard = async (text: string) => { 
    if (navigator.clipboard?.writeText) { 
      await navigator.clipboard.writeText(text); 
      return true; 
    } 

    const textarea = document.createElement("textarea"); 
    textarea.value = text; 
    textarea.style.position = "fixed"; 
    textarea.style.opacity = "0"; 
    document.body.appendChild(textarea); 
    textarea.focus(); 
    textarea.select(); 
    const copied = document.execCommand("copy"); 
    document.body.removeChild(textarea); 
    return copied; 
  }; 

  const handleShareVideo = async (video: { 
    _id: Id<"videos">; 
    publicId?: string; 
    status: string; 
    visibility: "public" | "private"; 
  }) => { 
    const canSharePublicly = 
      Boolean(video.publicId) && 
      video.status === "ready" && 
      video.visibility === "public"; 
    const path = canSharePublicly 
      ? `/watch/${video.publicId}` 
      : videoPath(resolvedTeamSlug, projectId, video._id); 
    const url = `${window.location.origin}${path}`; 

    try { 
      const copied = await copyTextToClipboard(url); 
      if (!copied) { 
        showShareToast("error", "Could not copy link"); 
        return; 
      } 
      showShareToast( 
        "success", 
        canSharePublicly 
          ? "Share link copied" 
          : "Video link copied (public watch link not available yet)", 
      ); 
    } catch { 
      showShareToast("error", "Could not copy link"); 
    } 
  }; 

  const canUpload = $derived(projectQuery.data?.role !== "viewer"); 
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
