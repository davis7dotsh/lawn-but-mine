<script lang="ts">
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { api } from "@lawn/convex/api";
  import type { Id } from "@lawn/convex/dataModel";
  import { useConvexClient, useQuery } from "convex-svelte";
  import {
    Download,
    Eye,
    Grid3X3,
    LayoutList,
    Link as LinkIcon,
    MessageSquare,
    Play,
    Search,
    Tag,
    Trash2,
    X,
  } from "lucide-svelte";

  import DashboardHeader from "@/lib/components/DashboardHeader.svelte";
  import ManageVideoTagsDialog from "@/lib/components/tags/ManageVideoTagsDialog.svelte";
  import TagEditorDialog from "@/lib/components/tags/TagEditorDialog.svelte";
  import TagPill from "@/lib/components/tags/TagPill.svelte";
  import Button from "@/lib/components/ui/Button.svelte";
  import Input from "@/lib/components/ui/Input.svelte";
  import Select from "@/lib/components/ui/Select.svelte";
  import DropZone from "@/lib/components/upload/DropZone.svelte";
  import UploadButton from "@/lib/components/upload/UploadButton.svelte";
  import VideoWorkflowStatusControl, {
    type VideoWorkflowStatus,
  } from "@/lib/components/videos/VideoWorkflowStatusControl.svelte";
  import { makeRouteQuerySpec, prewarmIntent, prewarmSpecs } from "@/lib/convex/prewarm";
  import { useDashboardUploadContext } from "@/lib/dashboardUploadContext.svelte";
  import { teamHomePath, videoPath } from "@/lib/routes";
  import { formatDuration, formatRelativeTime } from "@/lib/utils";

  type ViewMode = "grid" | "list";
  type ShareToastState = {
    tone: "success" | "error";
    message: string;
  };
  type SortMode = "newest" | "oldest" | "title" | "comments";
  type WorkflowFilter = "all" | VideoWorkflowStatus;
  type TeamTag = {
    _id: Id<"tags">;
    name: string;
    color: string;
    videoCount: number;
  };

  const convex = useConvexClient();
  const uploadContext = useDashboardUploadContext();

  let viewMode = $state<ViewMode>("grid");
  let shareToast = $state<ShareToastState | null>(null);
  let shareToastTimeout: ReturnType<typeof setTimeout> | null = null;
  let selectedVideoIds = $state<Id<"videos">[]>([]);
  let searchQuery = $state("");
  let workflowFilter = $state<WorkflowFilter>("all");
  let tagFilterId = $state<Id<"tags"> | "all">("all");
  let sortMode = $state<SortMode>("newest");
  let manageTagsOpen = $state(false);
  let tagEditorOpen = $state(false);
  let editingTag = $state<TeamTag | null>(null);

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
  const resolvedTeamId = $derived(
    contextQuery.data?.team?._id as Id<"teams"> | null,
  );
  const resolvedTeamSlug = $derived(contextQuery.data?.team.slug ?? teamSlug);

  const projectQuery = useQuery(api.projects.get, () =>
    resolvedProjectId ? { projectId: resolvedProjectId } : "skip",
  );
  const videosQuery = useQuery(api.videos.list, () =>
    resolvedProjectId ? { projectId: resolvedProjectId } : "skip",
  );
  const tagsQuery = useQuery(api.tags.listForProject, () =>
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

  $effect(() => {
    const validIds = new Set((videosQuery.data ?? []).map((video) => video._id));
    const nextSelectedIds = selectedVideoIds.filter((videoId) => validIds.has(videoId));

    if (
      nextSelectedIds.length !== selectedVideoIds.length ||
      nextSelectedIds.some((videoId, index) => videoId !== selectedVideoIds[index])
    ) {
      selectedVideoIds = nextSelectedIds;
    }
  });

  const isLoadingData = $derived(
    contextQuery.data === undefined ||
      projectQuery.data === undefined ||
      videosQuery.data === undefined ||
      tagsQuery.data === undefined ||
      shouldCanonicalize,
  );

  const canManageVideos = $derived(projectQuery.data?.role !== "viewer");
  const allProjectVideos = $derived(videosQuery.data ?? []);
  const selectedVideoIdSet = $derived(new Set(selectedVideoIds));
  const projectTags = $derived((tagsQuery.data ?? []).slice().sort((left, right) => left.name.localeCompare(right.name)));

  const visibleVideos = $derived.by(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const filtered = (allProjectVideos ?? []).filter((video) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        video.title.toLowerCase().includes(normalizedSearch) ||
        video.uploaderName.toLowerCase().includes(normalizedSearch) ||
        video.tags.some((tag) => tag.name.toLowerCase().includes(normalizedSearch));

      const matchesWorkflow =
        workflowFilter === "all" || video.workflowStatus === workflowFilter;

      const matchesTag =
        tagFilterId === "all" || video.tags.some((tag) => tag._id === tagFilterId);

      return matchesSearch && matchesWorkflow && matchesTag;
    });

    filtered.sort((left, right) => {
      if (sortMode === "oldest") {
        return left._creationTime - right._creationTime;
      }
      if (sortMode === "title") {
        return left.title.localeCompare(right.title);
      }
      if (sortMode === "comments") {
        return right.commentCount - left.commentCount || right._creationTime - left._creationTime;
      }
      return right._creationTime - left._creationTime;
    });

    return filtered;
  });

  const selectedVideos = $derived(
    allProjectVideos.filter((video) => selectedVideoIdSet.has(video._id)),
  );
  const selectedCount = $derived(selectedVideos.length);
  const allVisibleSelected = $derived(
    visibleVideos.length > 0 && visibleVideos.every((video) => selectedVideoIdSet.has(video._id)),
  );
  const handleFilesSelected = async (files: File[]) => {
    if (!resolvedProjectId) return;
    await uploadContext.requestUpload(files, resolvedProjectId);
  };

  const toggleVideoSelection = (videoId: Id<"videos">) => {
    selectedVideoIds = selectedVideoIdSet.has(videoId)
      ? selectedVideoIds.filter((selectedId) => selectedId !== videoId)
      : [...selectedVideoIds, videoId];
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const visibleIds = new Set(visibleVideos.map((video) => video._id));
      selectedVideoIds = selectedVideoIds.filter((videoId) => !visibleIds.has(videoId));
      return;
    }

    const nextIds = new Set(selectedVideoIds);
    for (const video of visibleVideos) {
      nextIds.add(video._id);
    }
    selectedVideoIds = Array.from(nextIds);
  };

  const clearSelection = () => {
    selectedVideoIds = [];
  };

  const openManageTagsForVideos = (videoIds: Id<"videos">[]) => {
    selectedVideoIds = videoIds;
    manageTagsOpen = true;
  };

  const handleDeleteVideo = async (videoId: Id<"videos">) => {
    if (!window.confirm("Are you sure you want to delete this video?")) return;
    await convex.mutation(api.videos.remove, { videoId });
    selectedVideoIds = selectedVideoIds.filter((selectedId) => selectedId !== videoId);
  };

  const handleDeleteSelectedVideos = async () => {
    if (selectedVideos.length === 0) {
      return;
    }

    if (!window.confirm(`Delete ${selectedVideos.length} selected video${selectedVideos.length === 1 ? "" : "s"}?`)) {
      return;
    }

    await convex.mutation(api.videos.removeMany, {
      videoIds: selectedVideos.map((video) => video._id),
    });

    clearSelection();
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
    nextWorkflowStatus: VideoWorkflowStatus,
  ) => {
    await convex.mutation(api.videos.updateWorkflowStatus, {
      videoId,
      workflowStatus: nextWorkflowStatus,
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
      : videoPath(resolvedTeamSlug, resolvedProjectId ?? projectId, video._id);
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

  const openCreateTagDialog = () => {
    editingTag = null;
    tagEditorOpen = true;
  };

  const toggleTagFilter = (tagId: Id<"tags">) => {
    tagFilterId = tagFilterId === tagId ? "all" : tagId;
  };
</script>

{#if contextQuery.data === null || projectQuery.data === null}
  <div class="flex h-full items-center justify-center">
    <div class="text-[#888]">Project not found</div>
  </div>
{:else}
  <div class="flex h-full flex-col">
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
      <div class={`flex shrink-0 items-center gap-2 transition-opacity duration-300 ${isLoadingData ? "opacity-0" : "opacity-100"}`}>
        <div class="flex items-center border-2 border-[#1a1a1a] p-0.5">
          <button
            type="button"
            class={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-[#1a1a1a] text-[#f0f0e8]" : "text-[#888] hover:text-[#1a1a1a]"}`}
            onclick={() => (viewMode = "grid")}
          >
            <Grid3X3 class="h-4 w-4" />
          </button>
          <button
            type="button"
            class={`p-1.5 transition-colors ${viewMode === "list" ? "bg-[#1a1a1a] text-[#f0f0e8]" : "text-[#888] hover:text-[#1a1a1a]"}`}
            onclick={() => (viewMode = "list")}
          >
            <LayoutList class="h-4 w-4" />
          </button>
        </div>

        {#if canManageVideos}
          <UploadButton onFilesSelected={handleFilesSelected} />
        {/if}
      </div>
    </DashboardHeader>

    <div class="flex-1 overflow-auto">
      <div class={`space-y-5 p-6 transition-opacity duration-300 ${isLoadingData ? "opacity-0" : "opacity-100"}`}>
        <section class="flex flex-wrap items-center gap-2 border-2 border-[#1a1a1a] bg-[#f0f0e8] px-3 py-2 shadow-[4px_4px_0px_0px_var(--shadow-color)]">
          <div class="relative min-w-[180px] flex-1">
            <Search class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#888]" />
            <Input
              id="video-search"
              bind:value={searchQuery}
              class="h-8 pl-8 text-xs"
              placeholder="Search..."
            />
          </div>

          <Select
            id="workflow-filter"
            bind:value={workflowFilter}
            class="w-[140px]"
            size="sm"
            options={[
              { value: "all", label: "All statuses" },
              { value: "review", label: "In review" },
              { value: "rework", label: "Needs rework" },
              { value: "done", label: "Done" },
            ]}
          />

          <Select
            id="sort-mode"
            bind:value={sortMode}
            class="w-[140px]"
            size="sm"
            options={[
              { value: "newest", label: "Newest first" },
              { value: "oldest", label: "Oldest first" },
              { value: "title", label: "Title A-Z" },
              { value: "comments", label: "Most comments" },
            ]}
          />

          <div class="flex items-center gap-2 border-l border-[#ccc] pl-2">
            {#each projectTags as tag (tag._id)}
              <TagPill
                {tag}
                active={tagFilterId === tag._id}
                onclick={() => toggleTagFilter(tag._id)}
              />
            {/each}
            {#if canManageVideos}
              <button
                type="button"
                class="text-[11px] text-[#888] hover:text-[#1a1a1a]"
                onclick={openCreateTagDialog}
                disabled={!resolvedTeamId}
              >{projectTags.length > 0 ? "+" : "+ tag"}</button>
            {/if}
          </div>

          <span class="border-l border-[#ccc] pl-2 text-[11px] font-mono text-[#888]">
            {visibleVideos.length}/{allProjectVideos.length}
          </span>
        </section>

        {#if !isLoadingData && allProjectVideos.length === 0}
          <div class="animate-in fade-in flex items-center justify-center p-2 duration-300">
            <DropZone
              class="w-full max-w-xl"
              onFilesSelected={handleFilesSelected}
              disabled={!canManageVideos}
            />
          </div>
        {:else if !isLoadingData && visibleVideos.length === 0}
          <div class="border-2 border-dashed border-[#1a1a1a] bg-[#f0f0e8] p-10 text-center shadow-[6px_6px_0px_0px_var(--shadow-color)]">
            <p class="text-lg font-black uppercase tracking-tight text-[#1a1a1a]">No videos match those filters</p>
            <p class="mt-2 text-sm text-[#666]">Try a different tag, clear the search, or reset the sort and status filters.</p>
          </div>
        {:else if viewMode === "grid"}
          <div class="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {#each visibleVideos as video (video._id)}
              <a
                href={videoPath(resolvedTeamSlug, projectQuery.data!._id, video._id)}
                class={`group flex cursor-pointer flex-col ${selectedVideoIdSet.has(video._id) ? "translate-x-[2px] translate-y-[2px]" : ""}`}
                use:prewarmIntent={{
                  run: () => prewarmVideo(resolvedTeamSlug, projectQuery.data!._id, video._id),
                }}
              >
                <div class={`relative aspect-video overflow-hidden border-2 border-[#1a1a1a] bg-[#e8e8e0] shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-all group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-[2px_2px_0px_0px_var(--shadow-color)] ${selectedVideoIdSet.has(video._id) ? "ring-2 ring-[#2d5a2d] ring-offset-2 ring-offset-[#f0f0e8]" : ""}`}>
                  {#if canManageVideos}
                    <button
                      type="button"
                      class={`absolute left-2 top-2 z-20 inline-flex h-9 w-9 items-center justify-center border-2 border-[#1a1a1a] text-sm font-black ${selectedVideoIdSet.has(video._id) ? "bg-[#2d5a2d] text-[#f0f0e8]" : "bg-[#f0f0e8] text-[#1a1a1a]"}`}
                      aria-label={selectedVideoIdSet.has(video._id) ? "Unselect video" : "Select video"}
                      onclick={(event) => {
                        event.preventDefault();
                        toggleVideoSelection(video._id);
                      }}
                    >
                      {selectedVideoIdSet.has(video._id) ? "✓" : ""}
                    </button>
                  {/if}

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
                  <div class="flex items-start gap-3">
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-[15px] font-black leading-tight text-[#1a1a1a]">{video.title}</p>
                    </div>
                    <span class="shrink-0 text-[11px] font-mono text-[#888]">
                      {formatRelativeTime(video._creationTime)}
                    </span>
                  </div>

                  <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <VideoWorkflowStatusControl
                      status={video.workflowStatus}
                      stopPropagation
                      disabled={!canManageVideos}
                      onChange={(nextWorkflowStatus) => handleUpdateWorkflowStatus(video._id, nextWorkflowStatus)}
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

                    {#each video.tags as tag (tag._id)}
                      <TagPill
                        {tag}
                        compact
                        active={tagFilterId === tag._id}
                        onclick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          toggleTagFilter(tag._id);
                        }}
                      />
                    {/each}
                  </div>

                  <div class="mt-2 flex flex-wrap items-center gap-2.5 text-[11px] text-[#888]">
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 hover:text-[#1a1a1a]"
                      onclick={(event) => {
                        event.preventDefault();
                        void handleShareVideo(video);
                      }}
                    >
                      <LinkIcon class="h-3 w-3" />
                      Share
                    </button>

                    {#if canManageVideos}
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 hover:text-[#1a1a1a]"
                        onclick={(event) => {
                          event.preventDefault();
                          openManageTagsForVideos([video._id]);
                        }}
                      >
                        <Tag class="h-3 w-3" />
                        Tags
                      </button>
                    {/if}

                    {#if video.s3Key && video.status !== "failed" && video.status !== "uploading"}
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 hover:text-[#1a1a1a]"
                        onclick={(event) => {
                          event.preventDefault();
                          void handleDownloadVideo(video._id, video.title);
                        }}
                      >
                        <Download class="h-3 w-3" />
                        DL
                      </button>
                    {/if}

                    {#if canManageVideos}
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 text-[#dc2626]/60 hover:text-[#dc2626]"
                        onclick={(event) => {
                          event.preventDefault();
                          void handleDeleteVideo(video._id);
                        }}
                      >
                        <Trash2 class="h-3 w-3" />
                      </button>
                    {/if}
                  </div>
                </div>
              </a>
            {/each}
          </div>
        {:else}
          <div class="divide-y-2 divide-[#1a1a1a] overflow-hidden border-2 border-[#1a1a1a] bg-[#f0f0e8] shadow-[6px_6px_0px_0px_var(--shadow-color)]">
            {#each visibleVideos as video (video._id)}
              <a
                href={videoPath(resolvedTeamSlug, projectQuery.data!._id, video._id)}
                class={`group flex cursor-pointer flex-col gap-4 px-6 py-4 transition-colors hover:bg-[#e8e8e0] lg:flex-row lg:items-center ${selectedVideoIdSet.has(video._id) ? "bg-[#e8f4e8]" : ""}`}
                use:prewarmIntent={{
                  run: () => prewarmVideo(resolvedTeamSlug, projectQuery.data!._id, video._id),
                }}
              >
                <div class="flex items-start gap-4">
                  {#if canManageVideos}
                    <button
                      type="button"
                      class={`mt-1 inline-flex h-9 w-9 items-center justify-center border-2 border-[#1a1a1a] text-sm font-black ${selectedVideoIdSet.has(video._id) ? "bg-[#2d5a2d] text-[#f0f0e8]" : "bg-[#f0f0e8] text-[#1a1a1a]"}`}
                      aria-label={selectedVideoIdSet.has(video._id) ? "Unselect video" : "Select video"}
                      onclick={(event) => {
                        event.preventDefault();
                        toggleVideoSelection(video._id);
                      }}
                    >
                      {selectedVideoIdSet.has(video._id) ? "✓" : ""}
                    </button>
                  {/if}

                  <div class="relative aspect-video w-44 shrink-0 overflow-hidden border-2 border-[#1a1a1a] bg-[#e8e8e0] shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-all group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-[2px_2px_0px_0px_var(--shadow-color)]">
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
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <p class="truncate font-black text-[#1a1a1a]">{video.title}</p>
                    <span class="text-xs font-mono text-[#888]">{formatRelativeTime(video._creationTime)}</span>
                  </div>

                  <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <VideoWorkflowStatusControl
                      status={video.workflowStatus}
                      stopPropagation
                      disabled={!canManageVideos}
                      onChange={(nextWorkflowStatus) => handleUpdateWorkflowStatus(video._id, nextWorkflowStatus)}
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

                    {#if video.uploaderName}
                      <span class="text-xs text-[#888]">{video.uploaderName}</span>
                    {/if}

                    {#each video.tags as tag (tag._id)}
                      <TagPill
                        {tag}
                        compact
                        active={tagFilterId === tag._id}
                        onclick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          toggleTagFilter(tag._id);
                        }}
                      />
                    {/each}
                  </div>
                </div>

                <div class="flex flex-wrap items-center gap-3 text-[11px] text-[#888]">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 hover:text-[#1a1a1a]"
                    onclick={(event) => {
                      event.preventDefault();
                      void handleShareVideo(video);
                    }}
                  >
                    <LinkIcon class="h-3 w-3" />
                    Share
                  </button>

                  {#if canManageVideos}
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 hover:text-[#1a1a1a]"
                      onclick={(event) => {
                        event.preventDefault();
                        openManageTagsForVideos([video._id]);
                      }}
                    >
                      <Tag class="h-3 w-3" />
                      Tags
                    </button>
                  {/if}

                  {#if video.s3Key && video.status !== "failed" && video.status !== "uploading"}
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 hover:text-[#1a1a1a]"
                      onclick={(event) => {
                        event.preventDefault();
                        void handleDownloadVideo(video._id, video.title);
                      }}
                    >
                      <Download class="h-3 w-3" />
                      DL
                    </button>
                  {/if}

                  {#if canManageVideos}
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 text-[#dc2626]/60 hover:text-[#dc2626]"
                      onclick={(event) => {
                        event.preventDefault();
                        void handleDeleteVideo(video._id);
                      }}
                    >
                      <Trash2 class="h-3 w-3" />
                    </button>
                  {/if}
                </div>
              </a>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    {#if canManageVideos && selectedCount > 0}
      <div class="fixed bottom-4 right-4 z-40 flex items-center gap-3 border-2 border-[#1a1a1a] bg-[#f0f0e8] px-4 py-3 shadow-[4px_4px_0px_0px_var(--shadow-color)]">
        <span class="text-xs font-bold text-[#1a1a1a]">
          {selectedCount} selected
        </span>
        <button
          type="button"
          class="text-[11px] text-[#888] hover:text-[#1a1a1a]"
          onclick={toggleSelectAllVisible}
        >{allVisibleSelected ? "unselect all" : "select all"}</button>
        <Button size="sm" onclick={() => (manageTagsOpen = true)}>
          <Tag class="h-3.5 w-3.5" />
          Tags
        </Button>
        <Button size="sm" variant="destructive" onclick={handleDeleteSelectedVideos}>
          <Trash2 class="h-3.5 w-3.5" />
        </Button>
        <button
          type="button"
          class="text-[#888] hover:text-[#1a1a1a]"
          aria-label="Clear selection"
          onclick={clearSelection}
        >
          <X class="h-4 w-4" />
        </button>
      </div>
    {/if}

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

  <ManageVideoTagsDialog
    open={manageTagsOpen}
    projectId={resolvedProjectId ?? null}
    teamId={resolvedTeamId}
    {selectedVideos}
    onOpenChange={(nextOpen) => (manageTagsOpen = nextOpen)}
  />

  <TagEditorDialog
    open={tagEditorOpen}
    teamId={resolvedTeamId}
    tag={editingTag}
    onOpenChange={(nextOpen) => {
      tagEditorOpen = nextOpen;
      if (!nextOpen) {
        editingTag = null;
      }
    }}
  />
{/if}
