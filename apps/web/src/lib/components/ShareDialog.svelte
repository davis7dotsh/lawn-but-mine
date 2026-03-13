<script lang="ts">
  import { api } from "@lawn/convex/api"; 
  import type { Id } from "@lawn/convex/dataModel"; 
  import { useConvexClient, useQuery } from "convex-svelte"; 
  import { Check, Copy, ExternalLink, Globe, Lock, Plus, Trash2, X, Eye } from "lucide-svelte"; 
  import { formatRelativeTime } from "@/lib/utils"; 

  let { 
    videoId, 
    open, 
    onOpenChange, 
  }: { 
    videoId: Id<"videos">; 
    open: boolean; 
    onOpenChange: (open: boolean) => void; 
  } = $props(); 

  const convex = useConvexClient(); 
  const videoQuery = useQuery(api.videos.get, () => (open ? { videoId } : "skip")); 
  const shareLinksQuery = useQuery(api.shareLinks.list, () => (open ? { videoId } : "skip")); 

  let isCreating = $state(false); 
  let isUpdatingVisibility = $state(false); 
  let copiedId = $state<string | null>(null); 
  let expiresInDays = $state<string>("never"); 
  let password = $state(""); 

  const copyText = async (text: string, id: string) => { 
    await navigator.clipboard.writeText(text); 
    copiedId = id; 
    setTimeout(() => { 
      copiedId = null; 
    }, 2000); 
  }; 

  const handleCreateLink = async () => { 
    isCreating = true; 
    try { 
      await convex.mutation(api.shareLinks.create, { 
        videoId, 
        expiresInDays: expiresInDays === "never" ? undefined : Number(expiresInDays), 
        allowDownload: false, 
        password: password.trim() || undefined, 
      }); 
      expiresInDays = "never"; 
      password = ""; 
    } finally { 
      isCreating = false; 
    } 
  }; 

  const handleSetVisibility = async (visibility: "public" | "private") => { 
    const video = videoQuery.data; 
    if (!video || video.visibility === visibility || isUpdatingVisibility) return; 
    isUpdatingVisibility = true; 
    try { 
      await convex.mutation(api.videos.setVisibility, { videoId, visibility }); 
    } finally { 
      isUpdatingVisibility = false; 
    } 
  }; 

  const handleDeleteLink = async (linkId: Id<"shareLinks">) => { 
    if (!window.confirm("Are you sure you want to delete this share link?")) return; 
    await convex.mutation(api.shareLinks.remove, { linkId }); 
  }; 

  const publicWatchPath = $derived(videoQuery.data?.publicId ? `/watch/${videoQuery.data.publicId}` : null); 
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <button
      type="button"
      class="absolute inset-0 bg-[#1a1a1a]/40"
      aria-label="Close share dialog"
      on:click={() => onOpenChange(false)}
    ></button>

    <div class="relative w-full max-w-2xl border-2 border-[#1a1a1a] bg-[#f0f0e8] p-6 shadow-[8px_8px_0px_0px_var(--shadow-color)] max-h-[90vh] overflow-y-auto">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-lg font-black text-[#1a1a1a]">Share video</h2>
          <p class="mt-1 text-sm text-[#888]">
            Public videos can be viewed by anyone with the URL. Only signed-in users can comment.
          </p>
        </div>
        <button
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center border-2 border-[#1a1a1a] hover:bg-[#e8e8e0]"
          aria-label="Close"
          on:click={() => onOpenChange(false)}
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <div class="mt-6 space-y-3 border-2 border-[#1a1a1a] bg-[#e8e8e0] p-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h3 class="text-sm font-bold text-[#1a1a1a]">Visibility</h3>
            <p class="text-xs text-[#666]">
              Private disables the public URL. Restricted share links can still be used.
            </p>
          </div>
          <span class="border-2 border-[#1a1a1a] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#888]">
            {videoQuery.data?.visibility === "public" ? "Public" : "Private"}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            class={`inline-flex items-center justify-center border-2 px-3 py-2 text-sm font-bold ${videoQuery.data?.visibility === "public" ? "border-[#1a1a1a] bg-[#1a1a1a] text-[#f0f0e8]" : "border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#f0f0e8]"}`}
            disabled={isUpdatingVisibility || !videoQuery.data}
            on:click={() => handleSetVisibility("public")}
          >
            <Globe class="mr-2 h-4 w-4" />
            Public
          </button>
          <button
            type="button"
            class={`inline-flex items-center justify-center border-2 px-3 py-2 text-sm font-bold ${videoQuery.data?.visibility === "private" ? "border-[#1a1a1a] bg-[#1a1a1a] text-[#f0f0e8]" : "border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#f0f0e8]"}`}
            disabled={isUpdatingVisibility || !videoQuery.data}
            on:click={() => handleSetVisibility("private")}
          >
            <Lock class="mr-2 h-4 w-4" />
            Private
          </button>
        </div>

        {#if publicWatchPath}
          <div class="space-y-2 border-2 border-[#1a1a1a] bg-[#f0f0e8] p-3">
            <div class="text-xs text-[#666]">Public URL</div>
            <code class="block truncate bg-[#e8e8e0] px-2 py-1 text-sm font-mono">
              {publicWatchPath}
            </code>
            <div class="flex gap-2">
              <button
                type="button"
                class="inline-flex flex-1 items-center justify-center border-2 border-[#1a1a1a] px-3 py-2 text-sm font-bold hover:bg-[#e8e8e0] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={videoQuery.data?.visibility !== "public"}
                on:click={() => copyText(`${window.location.origin}${publicWatchPath}`, "public")}
              >
                {#if copiedId === "public"}
                  <Check class="mr-2 h-4 w-4" />
                {:else}
                  <Copy class="mr-2 h-4 w-4" />
                {/if}
                Copy URL
              </button>
              <button
                type="button"
                class="inline-flex flex-1 items-center justify-center border-2 border-[#1a1a1a] px-3 py-2 text-sm font-bold hover:bg-[#e8e8e0] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={videoQuery.data?.visibility !== "public"}
                on:click={() => window.open(publicWatchPath, "_blank")}
              >
                <ExternalLink class="mr-2 h-4 w-4" />
                Open
              </button>
            </div>
          </div>
        {/if}
      </div>

      <div class="mt-4 space-y-4 border-2 border-[#1a1a1a] bg-[#e8e8e0] p-4">
        <h3 class="text-sm font-bold text-[#1a1a1a]">Create restricted share link</h3>

        <div>
          <label class="text-sm text-[#888]" for="share-expiration">Expiration</label>
          <select
            id="share-expiration"
            bind:value={expiresInDays}
            class="mt-1 w-full border-2 border-[#1a1a1a] bg-[#f0f0e8] px-3 py-2 text-sm font-bold outline-none"
          >
            <option value="never">Never</option>
            <option value="1">1 day</option>
            <option value="7">7 days</option>
            <option value="30">30 days</option>
          </select>
        </div>

        <div>
          <label class="text-sm text-[#888]" for="share-password">Password (optional)</label>
          <input
            id="share-password"
            bind:value={password}
            type="password"
            placeholder="Leave empty for no password"
            class="mt-1 w-full border-2 border-[#1a1a1a] bg-[#f0f0e8] px-3 py-2 text-sm outline-none"
          />
        </div>

        <button
          type="button"
          class="inline-flex w-full items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-3 py-2 text-sm font-bold text-[#f0f0e8] hover:bg-[#2d5a2d] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isCreating}
          on:click={handleCreateLink}
        >
          <Plus class="mr-2 h-4 w-4" />
          {isCreating ? "Creating..." : "Create restricted link"}
        </button>
      </div>

      <div class="my-4 h-px bg-[#1a1a1a]/20"></div>

      <div class="space-y-2">
        <h3 class="text-sm font-bold text-[#1a1a1a]">Restricted links</h3>
        {#if shareLinksQuery.data === undefined}
          <p class="text-sm text-[#888]">Loading...</p>
        {:else if shareLinksQuery.data.length === 0}
          <p class="text-sm text-[#888]">No share links yet</p>
        {:else}
          <div class="space-y-2">
            {#each shareLinksQuery.data as link}
              <div class="flex items-center justify-between gap-3 border-2 border-[#1a1a1a] p-3">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <code class="max-w-[220px] truncate bg-[#e8e8e0] px-2 py-0.5 text-sm font-mono">
                      /share/{link.token}
                    </code>
                    {#if link.isExpired}
                      <span class="border-2 border-[#dc2626] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#dc2626]">
                        Expired
                      </span>
                    {/if}
                  </div>

                  <div class="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#888]">
                    <span class="inline-flex items-center gap-1">
                      <Eye class="h-3 w-3" />
                      {link.viewCount} views
                    </span>
                    {#if link.hasPassword}
                      <span class="inline-flex items-center gap-1">
                        <Lock class="h-3 w-3" />
                        Protected
                      </span>
                    {/if}
                    {#if link.expiresAt}
                      <span>Expires {formatRelativeTime(link.expiresAt)}</span>
                    {/if}
                  </div>
                </div>

                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center hover:text-[#2d5a2d]"
                    on:click={() => copyText(`${window.location.origin}/share/${link.token}`, link.token)}
                  >
                    {#if copiedId === link.token}
                      <Check class="h-4 w-4 text-[#2d5a2d]" />
                    {:else}
                      <Copy class="h-4 w-4" />
                    {/if}
                  </button>
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center hover:text-[#1a1a1a]"
                    on:click={() => window.open(`/share/${link.token}`, "_blank")}
                  >
                    <ExternalLink class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center text-[#dc2626] hover:bg-[#dc2626]/10"
                    on:click={() => handleDeleteLink(link._id)}
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
