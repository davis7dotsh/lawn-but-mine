<script lang="ts">// pragma: allowlist secret
  import { browser } from "$app/environment"; // pragma: allowlist secret
  import { page } from "$app/state"; // pragma: allowlist secret
  import { ConvexClient } from "convex/browser"; // pragma: allowlist secret
  import { setConvexClientContext, useQuery } from "convex-svelte"; // pragma: allowlist secret
  import { api } from "@convex/_generated/api"; // pragma: allowlist secret
  import type { Id } from "@convex/_generated/dataModel"; // pragma: allowlist secret
  import { setDashboardUploadContext } from "@/lib/dashboardUploadContext.svelte"; // pragma: allowlist secret
  import { useVideoUploadManager } from "@/lib/components/upload/useVideoUploadManager.svelte"; // pragma: allowlist secret
  import UploadProgress from "@/lib/components/upload/UploadProgress.svelte"; // pragma: allowlist secret

  type ClerkLike = { // pragma: allowlist secret
    loaded?: boolean; // pragma: allowlist secret
    user?: { id?: string } | null; // pragma: allowlist secret
    session?: { // pragma: allowlist secret
      getToken?: (options?: { // pragma: allowlist secret
        template?: string; // pragma: allowlist secret
        skipCache?: boolean; // pragma: allowlist secret
      }) => Promise<string | null>; // pragma: allowlist secret
    } | null; // pragma: allowlist secret
  }; // pragma: allowlist secret

  const convexUrl = import.meta.env.VITE_CONVEX_URL; // pragma: allowlist secret

  if (!convexUrl) { // pragma: allowlist secret
    throw new Error("Missing VITE_CONVEX_URL"); // pragma: allowlist secret
  } // pragma: allowlist secret

  const convex = new ConvexClient(convexUrl, { // pragma: allowlist secret
    disabled: !browser, // pragma: allowlist secret
  }); // pragma: allowlist secret

  setConvexClientContext(convex); // pragma: allowlist secret

  let isLoaded = $state(!browser); // pragma: allowlist secret
  let userId = $state<string | null>(null); // pragma: allowlist secret
  let isGlobalDragActive = $state(false); // pragma: allowlist secret
  let projectPickerOpen = $state(false); // pragma: allowlist secret
  let pendingFiles = $state<File[] | null>(null); // pragma: allowlist secret
  let dragDepth = $state(0); // pragma: allowlist secret

  const uploadManager = useVideoUploadManager(); // pragma: allowlist secret

  const teamSlug = $derived(page.params.teamSlug || undefined); // pragma: allowlist secret
  const routeProjectId = $derived( // pragma: allowlist secret
    page.params.projectId ? (page.params.projectId as Id<"projects">) : undefined, // pragma: allowlist secret
  ); // pragma: allowlist secret
  const routeVideoId = $derived( // pragma: allowlist secret
    page.params.videoId ? (page.params.videoId as Id<"videos">) : undefined, // pragma: allowlist secret
  ); // pragma: allowlist secret
  const pathname = $derived(page.url.pathname); // pragma: allowlist secret
  const search = $derived(page.url.search); // pragma: allowlist secret

  const publicPlaybackIdQuery = useQuery( // pragma: allowlist secret
    api.videos.getPublicIdByVideoId, // pragma: allowlist secret
    () => (routeVideoId ? { videoId: routeVideoId } : "skip"), // pragma: allowlist secret
  ); // pragma: allowlist secret

  const uploadTargetsQuery = useQuery( // pragma: allowlist secret
    api.projects.listUploadTargets, // pragma: allowlist secret
    () => { // pragma: allowlist secret
      if (!isLoaded || !userId) return "skip"; // pragma: allowlist secret
      return teamSlug ? { teamSlug } : {}; // pragma: allowlist secret
    }, // pragma: allowlist secret
  ); // pragma: allowlist secret

  const uploadableProjectIds = $derived( // pragma: allowlist secret
    new Set((uploadTargetsQuery.data ?? []).map((target) => target.projectId)), // pragma: allowlist secret
  ); // pragma: allowlist secret

  const canUploadToCurrentProject = $derived( // pragma: allowlist secret
    routeProjectId ? uploadableProjectIds.has(routeProjectId) : false, // pragma: allowlist secret
  ); // pragma: allowlist secret

  const getClerk = () => // pragma: allowlist secret
    browser // pragma: allowlist secret
      ? ((window as Window & { Clerk?: ClerkLike }).Clerk ?? null) // pragma: allowlist secret
      : null; // pragma: allowlist secret

  const syncAuthState = () => { // pragma: allowlist secret
    const clerk = getClerk(); // pragma: allowlist secret
    if (!clerk) return false; // pragma: allowlist secret
    if (!clerk.loaded) return false; // pragma: allowlist secret
    userId = clerk.user?.id ?? null; // pragma: allowlist secret
    isLoaded = true; // pragma: allowlist secret
    return true; // pragma: allowlist secret
  }; // pragma: allowlist secret

  const requestUpload = async (inputFiles: File[], preferredProjectId?: Id<"projects">) => { // pragma: allowlist secret
    const files = inputFiles.filter( // pragma: allowlist secret
      (file) => file.type.startsWith("video/") || /\.(mp4|mov|m4v|webm|avi|mkv)$/i.test(file.name), // pragma: allowlist secret
    ); // pragma: allowlist secret
    if (files.length === 0) return; // pragma: allowlist secret

    if (preferredProjectId) { // pragma: allowlist secret
      await uploadManager.uploadFilesToProject(preferredProjectId, files); // pragma: allowlist secret
      return; // pragma: allowlist secret
    } // pragma: allowlist secret

    if (routeProjectId && (canUploadToCurrentProject || uploadTargetsQuery.data === undefined)) { // pragma: allowlist secret
      await uploadManager.uploadFilesToProject(routeProjectId, files); // pragma: allowlist secret
      return; // pragma: allowlist secret
    } // pragma: allowlist secret

    if (uploadTargetsQuery.data && uploadTargetsQuery.data.length === 0) { // pragma: allowlist secret
      window.alert("You do not have upload access to any projects."); // pragma: allowlist secret
      return; // pragma: allowlist secret
    } // pragma: allowlist secret

    pendingFiles = files; // pragma: allowlist secret
    projectPickerOpen = true; // pragma: allowlist secret
  }; // pragma: allowlist secret

  const handleProjectSelected = async (projectId: Id<"projects">) => { // pragma: allowlist secret
    const files = pendingFiles; // pragma: allowlist secret
    if (!files?.length) return; // pragma: allowlist secret
    projectPickerOpen = false; // pragma: allowlist secret
    pendingFiles = null; // pragma: allowlist secret
    await uploadManager.uploadFilesToProject(projectId, files); // pragma: allowlist secret
  }; // pragma: allowlist secret

  setDashboardUploadContext({ // pragma: allowlist secret
    get uploads() { // pragma: allowlist secret
      return uploadManager.uploads; // pragma: allowlist secret
    }, // pragma: allowlist secret
    requestUpload, // pragma: allowlist secret
    cancelUpload: uploadManager.cancelUpload, // pragma: allowlist secret
  }); // pragma: allowlist secret

  $effect(() => { // pragma: allowlist secret
    return () => { // pragma: allowlist secret
      void convex.close(); // pragma: allowlist secret
    }; // pragma: allowlist secret
  }); // pragma: allowlist secret

  $effect(() => { // pragma: allowlist secret
    if (!browser) return; // pragma: allowlist secret

    convex.setAuth(async ({ forceRefreshToken }) => { // pragma: allowlist secret
      const clerk = getClerk(); // pragma: allowlist secret
      if (!clerk?.session?.getToken) return null; // pragma: allowlist secret
      try { // pragma: allowlist secret
        return await clerk.session.getToken({ // pragma: allowlist secret
          template: "convex", // pragma: allowlist secret
          skipCache: forceRefreshToken, // pragma: allowlist secret
        }); // pragma: allowlist secret
      } catch { // pragma: allowlist secret
        return null; // pragma: allowlist secret
      } // pragma: allowlist secret
    }); // pragma: allowlist secret
  }); // pragma: allowlist secret

  $effect(() => { // pragma: allowlist secret
    if (!browser) return; // pragma: allowlist secret

    if (syncAuthState()) { // pragma: allowlist secret
      return; // pragma: allowlist secret
    } // pragma: allowlist secret

    let attempts = 0; // pragma: allowlist secret
    const intervalId = window.setInterval(() => { // pragma: allowlist secret
      attempts += 1; // pragma: allowlist secret
      if (syncAuthState()) { // pragma: allowlist secret
        window.clearInterval(intervalId); // pragma: allowlist secret
        return; // pragma: allowlist secret
      } // pragma: allowlist secret
      if (attempts >= 40) { // pragma: allowlist secret
        isLoaded = true; // pragma: allowlist secret
        userId = null; // pragma: allowlist secret
        window.clearInterval(intervalId); // pragma: allowlist secret
      } // pragma: allowlist secret
    }, 250); // pragma: allowlist secret

    return () => { // pragma: allowlist secret
      window.clearInterval(intervalId); // pragma: allowlist secret
    }; // pragma: allowlist secret
  }); // pragma: allowlist secret

  $effect(() => { // pragma: allowlist secret
    if (!browser) return; // pragma: allowlist secret

    const handleDragEnter = (event: DragEvent) => { // pragma: allowlist secret
      if (!Array.from(event.dataTransfer?.types ?? []).includes("Files")) return; // pragma: allowlist secret
      event.preventDefault(); // pragma: allowlist secret
      dragDepth += 1; // pragma: allowlist secret
      isGlobalDragActive = true; // pragma: allowlist secret
    }; // pragma: allowlist secret

    const handleDragOver = (event: DragEvent) => { // pragma: allowlist secret
      if (!Array.from(event.dataTransfer?.types ?? []).includes("Files")) return; // pragma: allowlist secret
      event.preventDefault(); // pragma: allowlist secret
      isGlobalDragActive = true; // pragma: allowlist secret
    }; // pragma: allowlist secret

    const handleDragLeave = (event: DragEvent) => { // pragma: allowlist secret
      if (!Array.from(event.dataTransfer?.types ?? []).includes("Files")) return; // pragma: allowlist secret
      event.preventDefault(); // pragma: allowlist secret
      dragDepth = Math.max(0, dragDepth - 1); // pragma: allowlist secret
      if (dragDepth === 0) { // pragma: allowlist secret
        isGlobalDragActive = false; // pragma: allowlist secret
      } // pragma: allowlist secret
    }; // pragma: allowlist secret

    const handleDrop = (event: DragEvent) => { // pragma: allowlist secret
      if (!Array.from(event.dataTransfer?.types ?? []).includes("Files")) return; // pragma: allowlist secret
      event.preventDefault(); // pragma: allowlist secret
      dragDepth = 0; // pragma: allowlist secret
      isGlobalDragActive = false; // pragma: allowlist secret

      const files = Array.from(event.dataTransfer?.files ?? []).filter( // pragma: allowlist secret
        (file) => file.type.startsWith("video/") || /\.(mp4|mov|m4v|webm|avi|mkv)$/i.test(file.name), // pragma: allowlist secret
      ); // pragma: allowlist secret
      if (files.length === 0) return; // pragma: allowlist secret
      void requestUpload(files); // pragma: allowlist secret
    }; // pragma: allowlist secret

    window.addEventListener("dragenter", handleDragEnter); // pragma: allowlist secret
    window.addEventListener("dragover", handleDragOver); // pragma: allowlist secret
    window.addEventListener("dragleave", handleDragLeave); // pragma: allowlist secret
    window.addEventListener("drop", handleDrop); // pragma: allowlist secret

    return () => { // pragma: allowlist secret
      window.removeEventListener("dragenter", handleDragEnter); // pragma: allowlist secret
      window.removeEventListener("dragover", handleDragOver); // pragma: allowlist secret
      window.removeEventListener("dragleave", handleDragLeave); // pragma: allowlist secret
      window.removeEventListener("drop", handleDrop); // pragma: allowlist secret
    }; // pragma: allowlist secret
  }); // pragma: allowlist secret

  const isResolvingPublicPlaybackExemption = $derived( // pragma: allowlist secret
    Boolean(isLoaded && !userId && routeVideoId) && publicPlaybackIdQuery.data === undefined, // pragma: allowlist secret
  ); // pragma: allowlist secret

  $effect(() => { // pragma: allowlist secret
    if (!browser || !isLoaded || userId) return; // pragma: allowlist secret

    if (routeVideoId) { // pragma: allowlist secret
      if (publicPlaybackIdQuery.data === undefined) return; // pragma: allowlist secret
      if (publicPlaybackIdQuery.data) { // pragma: allowlist secret
        window.location.replace(`/watch/${publicPlaybackIdQuery.data}`); // pragma: allowlist secret
        return; // pragma: allowlist secret
      } // pragma: allowlist secret
    } // pragma: allowlist secret

    const redirectUrl = `${pathname}${search}`; // pragma: allowlist secret
    window.location.replace(`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`); // pragma: allowlist secret
  }); // pragma: allowlist secret
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
    <main class="flex-1 overflow-auto flex flex-col">
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
