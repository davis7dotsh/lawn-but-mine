<script lang="ts">
  import { browser } from "$app/environment";
  import { page } from "$app/state";
  import { setConvexClientContext, useQuery } from "convex-svelte";
  import { api } from "@lawn/convex/api";
  import type { Id } from "@lawn/convex/dataModel";

  import { setDashboardUploadContext } from "@/lib/dashboardUploadContext.svelte";
  import { useVideoUploadManager } from "@/lib/components/upload/useVideoUploadManager.svelte";
  import UploadProgress from "@/lib/components/upload/UploadProgress.svelte";
  import { clerkAuth, getSharedConvexClient } from "@/lib/useVideoPresence";

  const auth = clerkAuth;
  const convex = getSharedConvexClient();
  setConvexClientContext(convex);

  let isGlobalDragActive = $state(false);
  let projectPickerOpen = $state(false);
  let pendingFiles = $state<File[] | null>(null);
  let dragDepth = $state(0);

  const uploadManager = useVideoUploadManager();

  const teamSlug = $derived(page.params.teamSlug || undefined);
  const routeProjectId = $derived(
    page.params.projectId ? (page.params.projectId as Id<"projects">) : undefined,
  );
  const routeVideoId = $derived(
    page.params.videoId ? (page.params.videoId as Id<"videos">) : undefined,
  );
  const pathname = $derived(page.url.pathname);
  const search = $derived(page.url.search);
  const isLoaded = $derived($auth.isLoaded);
  const userId = $derived($auth.user?.id ?? null);

  const publicPlaybackIdQuery = useQuery(
    api.videos.getPublicIdByVideoId,
    () => (routeVideoId ? { videoId: routeVideoId } : "skip"),
  );

  const uploadTargetsQuery = useQuery(
    api.projects.listUploadTargets,
    () => {
      if (!isLoaded || !userId) return "skip";
      return teamSlug ? { teamSlug } : {};
    },
  );

  const uploadableProjectIds = $derived(
    new Set((uploadTargetsQuery.data ?? []).map((target) => target.projectId)),
  );

  const canUploadToCurrentProject = $derived(
    routeProjectId ? uploadableProjectIds.has(routeProjectId) : false,
  );

  const requestUpload = async (inputFiles: File[], preferredProjectId?: Id<"projects">) => { 
    const files = inputFiles.filter( 
      (file) => file.type.startsWith("video/") || /\.(mp4|mov|m4v|webm|avi|mkv)$/i.test(file.name), 
    ); 
    if (files.length === 0) return; 

    if (preferredProjectId) { 
      await uploadManager.uploadFilesToProject(preferredProjectId, files); 
      return; 
    } 

    if (routeProjectId && (canUploadToCurrentProject || uploadTargetsQuery.data === undefined)) { 
      await uploadManager.uploadFilesToProject(routeProjectId, files); 
      return; 
    } 

    if (uploadTargetsQuery.data && uploadTargetsQuery.data.length === 0) { 
      window.alert("You do not have upload access to any projects."); 
      return; 
    } 

    pendingFiles = files; 
    projectPickerOpen = true; 
  }; 

  const handleProjectSelected = async (projectId: Id<"projects">) => { 
    const files = pendingFiles; 
    if (!files?.length) return; 
    projectPickerOpen = false; 
    pendingFiles = null; 
    await uploadManager.uploadFilesToProject(projectId, files); 
  }; 

  setDashboardUploadContext({
    get uploads() {
      return uploadManager.uploads;
    },
    requestUpload,
    cancelUpload: uploadManager.cancelUpload,
  });

  $effect(() => { 
    if (!browser) return; 

    const handleDragEnter = (event: DragEvent) => { 
      if (!Array.from(event.dataTransfer?.types ?? []).includes("Files")) return; 
      event.preventDefault(); 
      dragDepth += 1; 
      isGlobalDragActive = true; 
    }; 

    const handleDragOver = (event: DragEvent) => { 
      if (!Array.from(event.dataTransfer?.types ?? []).includes("Files")) return; 
      event.preventDefault(); 
      isGlobalDragActive = true; 
    }; 

    const handleDragLeave = (event: DragEvent) => { 
      if (!Array.from(event.dataTransfer?.types ?? []).includes("Files")) return; 
      event.preventDefault(); 
      dragDepth = Math.max(0, dragDepth - 1); 
      if (dragDepth === 0) { 
        isGlobalDragActive = false; 
      } 
    }; 

    const handleDrop = (event: DragEvent) => { 
      if (!Array.from(event.dataTransfer?.types ?? []).includes("Files")) return; 
      event.preventDefault(); 
      dragDepth = 0; 
      isGlobalDragActive = false; 

      const files = Array.from(event.dataTransfer?.files ?? []).filter( 
        (file) => file.type.startsWith("video/") || /\.(mp4|mov|m4v|webm|avi|mkv)$/i.test(file.name), 
      ); 
      if (files.length === 0) return; 
      void requestUpload(files); 
    }; 

    window.addEventListener("dragenter", handleDragEnter); 
    window.addEventListener("dragover", handleDragOver); 
    window.addEventListener("dragleave", handleDragLeave); 
    window.addEventListener("drop", handleDrop); 

    return () => { 
      window.removeEventListener("dragenter", handleDragEnter); 
      window.removeEventListener("dragover", handleDragOver); 
      window.removeEventListener("dragleave", handleDragLeave); 
      window.removeEventListener("drop", handleDrop); 
    }; 
  }); 

  const isResolvingPublicPlaybackExemption = $derived( 
    Boolean(isLoaded && !userId && routeVideoId) && publicPlaybackIdQuery.data === undefined, 
  ); 

  $effect(() => { 
    if (!browser || !isLoaded || userId) return; 

    if (routeVideoId) { 
      if (publicPlaybackIdQuery.data === undefined) return; 
      if (publicPlaybackIdQuery.data) { 
        window.location.replace(`/watch/${publicPlaybackIdQuery.data}`); 
        return; 
      } 
    } 

    const redirectUrl = `${pathname}${search}`; 
    window.location.replace(`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`); 
  }); 
</script>

{#if !isLoaded}
  <div class="h-full flex items-center justify-center bg-[#f0f0e8]">
    <div class="text-[#888]">Loading...</div>
  </div>
{:else if !userId}
  <div class="h-full flex items-center justify-center bg-[#f0f0e8]">
    <div class="text-[#888]">
      {isResolvingPublicPlaybackExemption
        ? "Checking public playback access..."
        : "Redirecting to sign in..."}
    </div>
  </div>
{:else}
  <div class="relative h-full flex flex-col bg-[#f0f0e8]">
    <main class="flex-1 overflow-hidden flex flex-col">
      <slot />
    </main>

    {#if isGlobalDragActive}
      <div class="pointer-events-none fixed inset-0 z-40">
        <div class="absolute inset-0 bg-[#1a1a1a]/20"></div>
        <div class="absolute inset-4 flex items-center justify-center border-4 border-dashed border-[#2d5a2d] bg-[#2d5a2d]/10">
          <p class="border-2 border-[#1a1a1a] bg-[#f0f0e8] px-4 py-2 text-sm font-bold text-[#1a1a1a]">
            Drop videos to upload
          </p>
        </div>
      </div>
    {/if}

    {#if uploadManager.uploads.length > 0}
      <div class="fixed left-4 right-4 top-16 z-50 space-y-2 sm:bottom-4 sm:top-auto sm:right-auto sm:w-full sm:max-w-sm">
        {#each uploadManager.uploads as upload (upload.id)}
          <UploadProgress
            fileName={upload.file.name}
            fileSize={upload.file.size}
            progress={upload.progress}
            status={upload.status}
            error={upload.error}
            bytesPerSecond={upload.bytesPerSecond}
            estimatedSecondsRemaining={upload.estimatedSecondsRemaining}
            onCancel={() => uploadManager.cancelUpload(upload.id)}
          />
        {/each}
      </div>
    {/if}

    {#if projectPickerOpen}
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <button
          type="button"
          class="absolute inset-0 bg-[#1a1a1a]/40"
          aria-label="Close project picker"
          on:click={() => {
            projectPickerOpen = false;
            pendingFiles = null;
          }}
        ></button>

        <div class="relative w-full max-w-lg border-2 border-[#1a1a1a] bg-[#f0f0e8] p-6 shadow-[8px_8px_0px_0px_var(--shadow-color)]">
          <h2 class="text-lg font-black text-[#1a1a1a]">Choose a project</h2>
          <p class="mt-1 text-sm text-[#888]">
            {pendingFiles?.length
              ? `Upload ${pendingFiles.length} video${pendingFiles.length > 1 ? "s" : ""} to:`
              : "Pick a project to start uploading."}
          </p>

          <div class="mt-4">
            {#if uploadTargetsQuery.data === undefined}
              <p class="text-sm text-[#888]">Loading projects...</p>
            {:else if uploadTargetsQuery.data.length === 0}
              <p class="text-sm text-[#888]">No uploadable projects found for your account.</p>
            {:else}
              <div class="max-h-80 overflow-y-auto border-2 border-[#1a1a1a] divide-y-2 divide-[#1a1a1a]">
                {#each uploadTargetsQuery.data as target}
                  <button
                    type="button"
                    class="w-full px-4 py-3 text-left hover:bg-[#e8e8e0] transition-colors"
                    on:click={() => handleProjectSelected(target.projectId)}
                  >
                    <p class="font-bold text-[#1a1a1a]">{target.projectName}</p>
                    <p class="text-xs text-[#888]">{target.teamName}</p>
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}
