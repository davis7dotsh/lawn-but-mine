<script lang="ts">
  import { useQuery, useConvexClient } from "convex-svelte";
  import { api } from "@convex/_generated/api";
  import type { Id } from "@convex/_generated/dataModel";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { formatDuration, formatRelativeTime } from "$lib/utils";
  import Button from "$lib/components/ui/Button.svelte";
  import DashboardHeader from "$lib/components/DashboardHeader.svelte";

  let teamSlug = $derived($page.params.teamSlug ?? "");
  let projectId = $derived($page.params.projectId ?? "");
  const client = useConvexClient();

  const context = useQuery(api.workspace.resolveContext, () => ({ teamSlug, projectId: projectId as Id<"projects"> | undefined }));
  const resolvedProjectId = $derived(context.data?.project?._id);
  const resolvedTeamSlug = $derived(context.data?.team?.slug ?? teamSlug);
  const project = useQuery(api.projects.get, () => resolvedProjectId ? { projectId: resolvedProjectId } : "skip");
  const videos = useQuery(api.videos.list, () => resolvedProjectId ? { projectId: resolvedProjectId } : "skip");

  let viewMode = $state<"grid" | "list">("grid");
  let openMenuVideoId = $state<string | null>(null);
  const isLoadingData = $derived(context.data === undefined || project.data === undefined || videos.data === undefined);
  const canUpload = $derived(project.data?.role !== "viewer");
  const canDeleteVideo = $derived(project.data?.role !== "viewer");

  async function handleDeleteVideo(videoId: string) {
    if (!confirm("Are you sure you want to delete this video?")) return;
    try {
      await client.mutation(api.videos.remove, { videoId: videoId as any });
      openMenuVideoId = null;
    } catch (error) {
      console.error("Failed to delete video:", error);
    }
  }

  async function handleCopyShareLink(videoId: string) {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/${resolvedTeamSlug ?? teamSlug}/${project.data?._id}/${videoId}`;
    try {
      await navigator.clipboard.writeText(url);
      openMenuVideoId = null;
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  }

  function handleFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !resolvedProjectId) return;
    const files = Array.from(input.files);
    for (const file of files) {
      uploadFile(file);
    }
    input.value = "";
  }

  async function uploadFile(file: File) {
    if (!resolvedProjectId) return;
    const title = file.name.replace(/\.[^/.]+$/, "");
    try {
      const videoId = await client.mutation(api.videos.create, {
        projectId: resolvedProjectId as any,
        title,
        fileSize: file.size,
        contentType: file.type || "video/mp4",
      });
      const { url } = await client.action(api.videoActions.getUploadUrl, {
        videoId,
        filename: file.name,
        fileSize: file.size,
        contentType: file.type || "video/mp4",
      });
      await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type || "video/mp4" } });
      await client.action(api.videoActions.markUploadComplete, { videoId });
    } catch (error) {
      console.error("Upload failed:", error);
    }
  }
</script>

<div class="h-full flex flex-col" style="--shadow-color: #1a1a1a">
  <DashboardHeader paths={[
    { label: resolvedTeamSlug ?? teamSlug, href: `/dashboard/${resolvedTeamSlug ?? teamSlug}` },
    { label: project.data?.name ?? "\u00A0" }
  ]}>
    <div class={`flex items-center gap-2 transition-opacity duration-300 flex-shrink-0 ${isLoadingData ? 'opacity-0' : 'opacity-100'}`}>
      <div class="flex items-center border-2 border-[#1a1a1a] p-0.5">
        <button onclick={() => viewMode = "grid"} class={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-[#1a1a1a] text-[#f0f0e8]" : "text-[#888] hover:text-[#1a1a1a]"}`}>Grid</button>
        <button onclick={() => viewMode = "list"} class={`p-1.5 transition-colors ${viewMode === "list" ? "bg-[#1a1a1a] text-[#f0f0e8]" : "text-[#888] hover:text-[#1a1a1a]"}`}>List</button>
      </div>
      {#if canUpload}
        <label class="inline-flex items-center justify-center px-4 py-2 text-sm font-bold bg-[#1a1a1a] text-[#f0f0e8] border-2 border-[#1a1a1a] hover:bg-[#2d5a2d] hover:border-[#2d5a2d] transition-colors cursor-pointer">
          Upload
          <input type="file" accept="video/*" multiple class="hidden" onchange={handleFilesSelected} />
        </label>
      {/if}
    </div>
  </DashboardHeader>

  <div class="flex-1 overflow-auto">
    {#if context.data === null || project.data === null}
      <div class="flex items-center justify-center h-full">
        <div class="text-[#888]">Project not found</div>
      </div>
    {:else if !isLoadingData && (videos.data?.length ?? 0) === 0}
      <div class="h-full flex items-center justify-center p-6 animate-in fade-in duration-300">
        <div class="border-4 border-dashed border-[#2d5a2d]/30 p-12 text-center max-w-xl w-full">
          <p class="text-2xl font-black text-[#1a1a1a] mb-2">Drop videos here</p>
          <p class="text-[#888] mb-6">Or click upload to get started</p>
          {#if canUpload}
            <label class="inline-flex items-center justify-center px-6 py-3 text-sm font-bold bg-[#1a1a1a] text-[#f0f0e8] border-2 border-[#1a1a1a] hover:bg-[#2d5a2d] transition-colors cursor-pointer">
              Choose files
              <input type="file" accept="video/*" multiple class="hidden" onchange={handleFilesSelected} />
            </label>
          {/if}
        </div>
      </div>
    {:else if viewMode === "grid"}
      <div class={`p-6 transition-opacity duration-300 ${isLoadingData ? 'opacity-0' : 'opacity-100'}`}>
        <div class="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {#each videos.data ?? [] as video}
            {@const thumbnailSrc = video.thumbnailUrl?.startsWith("http") ? video.thumbnailUrl : undefined}
            <div
              class="group cursor-pointer flex flex-col relative"
              role="button"
              tabindex="0"
              onclick={() => goto(`/dashboard/${resolvedTeamSlug ?? teamSlug}/${project.data?._id}/${video._id}`)}
              onkeydown={(e) => { if (e.key === "Enter") goto(`/dashboard/${resolvedTeamSlug ?? teamSlug}/${project.data?._id}/${video._id}`); }}
            >
              <div class="relative aspect-video bg-[#e8e8e0] overflow-hidden border-2 border-[#1a1a1a] shadow-[4px_4px_0px_0px_var(--shadow-color)] group-hover:translate-y-[2px] group-hover:translate-x-[2px] group-hover:shadow-[2px_2px_0px_0px_var(--shadow-color)] transition-all">
                {#if thumbnailSrc}
                  <img src={thumbnailSrc} alt={video.title} class="object-cover w-full h-full" />
                {:else}
                  <div class="absolute inset-0 flex items-center justify-center">
                    <span class="text-[#888] text-2xl">▶</span>
                  </div>
                {/if}
                {#if video.status === "ready" && video.duration}
                  <div class="absolute bottom-2 right-2 bg-black/70 text-white text-[11px] font-mono px-1.5 py-0.5">{formatDuration(video.duration)}</div>
                {/if}
                {#if video.status !== "ready"}
                  <div class="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span class="text-white text-xs font-bold uppercase tracking-wider">
                      {#if video.status === "uploading"}Uploading...{/if}
                      {#if video.status === "processing"}Processing...{/if}
                      {#if video.status === "failed"}Failed{/if}
                    </span>
                  </div>
                {/if}
                <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onclick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      class="w-8 h-8 flex items-center justify-center bg-[#1a1a1a]/80 text-[#f0f0e8] hover:bg-[#1a1a1a] text-sm"
                      onclick={() => openMenuVideoId = openMenuVideoId === video._id ? null : video._id}
                      aria-label="Video menu"
                    >
                      ⋯
                    </button>
                    {#if openMenuVideoId === video._id}
                      <div class="absolute right-0 top-full mt-1 w-40 bg-[#f0f0e8] border-2 border-[#1a1a1a] shadow-[4px_4px_0px_0px_var(--shadow-color)] z-10">
                        <button
                          type="button"
                          class="block w-full text-left px-4 py-2 text-sm hover:bg-[#e8e8e0]"
                          onclick={() => handleCopyShareLink(video._id)}
                        >
                          Copy share link
                        </button>
                        {#if canDeleteVideo}
                          <button
                            type="button"
                            class="block w-full text-left px-4 py-2 text-sm hover:bg-[#e8e8e0] text-[#dc2626]"
                            onclick={() => handleDeleteVideo(video._id)}
                          >
                            Delete
                          </button>
                        {/if}
                      </div>
                    {/if}
                  </div>
                </div>
              <div class="mt-2.5">
                <p class="text-[15px] text-[#1a1a1a] font-black truncate leading-tight">{video.title}</p>
                <div class="mt-1.5 flex items-center gap-3">
                  <span class={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 border ${
                    video.workflowStatus === "done" ? "border-[#16a34a] text-[#16a34a] bg-[#16a34a]/10" :
                    video.workflowStatus === "rework" ? "border-[#ca8a04] text-[#ca8a04] bg-[#ca8a04]/10" :
                    "border-[#888] text-[#888]"
                  }`}>{video.workflowStatus}</span>
                  <span class="text-[11px] text-[#888] ml-auto font-mono">{formatRelativeTime(video._creationTime)}</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <div class={`divide-y-2 divide-[#1a1a1a] transition-opacity duration-300 ${isLoadingData ? 'opacity-0' : 'opacity-100'}`}>
        {#each videos.data ?? [] as video}
          {@const thumbnailSrc = video.thumbnailUrl?.startsWith("http") ? video.thumbnailUrl : undefined}
          <div
            class="group flex items-center gap-5 px-6 py-3 hover:bg-[#e8e8e0] cursor-pointer transition-colors relative"
            role="button"
            tabindex="0"
            onclick={() => goto(`/dashboard/${resolvedTeamSlug ?? teamSlug}/${project.data?._id}/${video._id}`)}
            onkeydown={(e) => { if (e.key === "Enter") goto(`/dashboard/${resolvedTeamSlug ?? teamSlug}/${project.data?._id}/${video._id}`); }}
          >
            <div class="relative w-44 aspect-video bg-[#e8e8e0] overflow-hidden border-2 border-[#1a1a1a] shrink-0">
              {#if thumbnailSrc}
                <img src={thumbnailSrc} alt={video.title} class="object-cover w-full h-full" />
              {:else}
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="text-[#888]">▶</span>
                </div>
              {/if}
              {#if video.status === "ready" && video.duration}
                <div class="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] font-mono px-1 py-0.5">{formatDuration(video.duration)}</div>
              {/if}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-black text-[#1a1a1a] truncate">{video.title}</p>
              <div class="flex items-center gap-3 mt-1">
                <span class={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 border ${
                  video.workflowStatus === "done" ? "border-[#16a34a] text-[#16a34a]" :
                  video.workflowStatus === "rework" ? "border-[#ca8a04] text-[#ca8a04]" :
                  "border-[#888] text-[#888]"
                }`}>{video.workflowStatus}</span>
                <span class="text-xs text-[#888] font-mono">{formatRelativeTime(video._creationTime)}</span>
              </div>
            </div>
            <div class="relative shrink-0" onclick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  class="w-8 h-8 flex items-center justify-center text-[#888] hover:text-[#1a1a1a] hover:bg-[#e8e8e0] text-sm"
                  onclick={() => openMenuVideoId = openMenuVideoId === video._id ? null : video._id}
                  aria-label="Video menu"
                >
                  ⋯
                </button>
                {#if openMenuVideoId === video._id}
                  <div class="absolute right-0 top-full mt-1 w-40 bg-[#f0f0e8] border-2 border-[#1a1a1a] shadow-[4px_4px_0px_0px_var(--shadow-color)] z-10">
                    <button
                      type="button"
                      class="block w-full text-left px-4 py-2 text-sm hover:bg-[#e8e8e0]"
                      onclick={() => handleCopyShareLink(video._id)}
                    >
                      Copy share link
                    </button>
                    {#if canDeleteVideo}
                      <button
                        type="button"
                        class="block w-full text-left px-4 py-2 text-sm hover:bg-[#e8e8e0] text-[#dc2626]"
                        onclick={() => handleDeleteVideo(video._id)}
                      >
                        Delete
                      </button>
                    {/if}
                  </div>
                {/if}
              </div>
            </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
