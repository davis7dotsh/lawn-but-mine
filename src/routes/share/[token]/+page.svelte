<script lang="ts">
  import { useQuery, useConvexClient } from "convex-svelte";
  import { api } from "@convex/_generated/api";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { loadClerk } from "$lib/clerk";
  import { formatDuration, formatTimestamp, formatRelativeTime } from "$lib/utils";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import Textarea from "$lib/components/ui/Textarea.svelte";
  import Card from "$lib/components/ui/Card.svelte";
  import CardHeader from "$lib/components/ui/CardHeader.svelte";
  import CardTitle from "$lib/components/ui/CardTitle.svelte";
  import CardDescription from "$lib/components/ui/CardDescription.svelte";
  import CardContent from "$lib/components/ui/CardContent.svelte";
  import VideoPlayer from "$lib/components/VideoPlayer.svelte";

  let token = $derived($page.params.token ?? "");
  const client = useConvexClient();

  const shareInfo = useQuery(api.shareLinks.getByToken, () => token ? { token } : "skip");

  let grantToken = $state<string | null>(null);
  let password = $state("");
  let isSubmittingPassword = $state(false);
  let passwordError = $state<string | null>(null);
  let isRequestingGrant = $state(false);

  const videoData = useQuery(api.videos.getByShareGrant, () => grantToken ? { grantToken } : "skip");
  const comments = useQuery(api.comments.getThreadedForShareGrant, () => grantToken ? { grantToken } : "skip");

  let playbackSession = $state<{ url: string; posterUrl: string } | null>(null);
  let isLoadingPlayback = $state(false);
  let currentTime = $state(0);
  let commentText = $state("");
  let isSubmittingComment = $state(false);
  let isUserSignedIn = $state(false);
  let playerRef: any = null;

  onMount(async () => {
    try {
      const clerk = await loadClerk();
      isUserSignedIn = !!clerk.user;
      clerk.addListener(() => { isUserSignedIn = !!clerk.user; });
    } catch {}
  });

  $effect(() => {
    if (shareInfo.data?.status !== "ok" || grantToken || !token) return;
    isRequestingGrant = true;
    client.mutation(api.shareLinks.issueAccessGrant, { token: token as string })
      .then((result) => {
        if (result.ok && result.grantToken) { grantToken = result.grantToken; }
      })
      .catch(() => {})
      .finally(() => { isRequestingGrant = false; });
  });

  $effect(() => {
    if (!grantToken || !videoData.data?.video?.muxPlaybackId) { playbackSession = null; return; }
    isLoadingPlayback = true;
    client.action(api.videoActions.getSharedPlaybackSession, { grantToken })
      .then((session) => { playbackSession = session; })
      .catch(() => { playbackSession = null; })
      .finally(() => { isLoadingPlayback = false; });
  });

  async function handlePasswordSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!password.trim() || isSubmittingPassword) return;
    isSubmittingPassword = true;
    passwordError = null;
    try {
      const result = await client.mutation(api.shareLinks.issueAccessGrant, { token: token as string, password: password.trim() });
      if (result.ok && result.grantToken) {
        grantToken = result.grantToken;
      } else {
        passwordError = "Incorrect password. Please try again.";
      }
    } catch {
      passwordError = "Something went wrong. Please try again.";
    } finally {
      isSubmittingPassword = false;
    }
  }

  async function handleSubmitComment(e: SubmitEvent) {
    e.preventDefault();
    if (!commentText.trim() || !grantToken || isSubmittingComment) return;
    isSubmittingComment = true;
    try {
      await client.mutation(api.comments.createForShareGrant, { grantToken, text: commentText.trim(), timestampSeconds: currentTime });
      commentText = "";
    } catch {} finally { isSubmittingComment = false; }
  }
</script>

<svelte:head><title>{videoData.data?.video?.title ?? "Shared Video"} — lawn</title></svelte:head>

{#if shareInfo.data === undefined}
  <div class="min-h-screen bg-[#f0f0e8] flex items-center justify-center"><div class="text-[#888]">Loading...</div></div>
{:else if shareInfo.data.status === "missing"}
  <div class="min-h-screen bg-[#f0f0e8] flex items-center justify-center p-4">
    <Card class="max-w-md w-full">
      <CardHeader class="text-center">
        <CardTitle>Link not found</CardTitle>
        <CardDescription>This share link is invalid or has been removed.</CardDescription>
      </CardHeader>
      <CardContent><a href="/" class="block"><Button variant="outline" class="w-full">Go to lawn</Button></a></CardContent>
    </Card>
  </div>
{:else if shareInfo.data.status === "expired"}
  <div class="min-h-screen bg-[#f0f0e8] flex items-center justify-center p-4">
    <Card class="max-w-md w-full">
      <CardHeader class="text-center">
        <CardTitle>Link expired</CardTitle>
        <CardDescription>This share link has expired. Ask the owner for a new one.</CardDescription>
      </CardHeader>
      <CardContent><a href="/" class="block"><Button variant="outline" class="w-full">Go to lawn</Button></a></CardContent>
    </Card>
  </div>
{:else if shareInfo.data.status === "requiresPassword" && !grantToken}
  <div class="min-h-screen bg-[#f0f0e8] flex items-center justify-center p-4">
    <Card class="max-w-md w-full">
      <CardHeader class="text-center">
        <CardTitle>Password required</CardTitle>
        <CardDescription>This video is password protected.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onsubmit={handlePasswordSubmit} class="space-y-4">
          <Input type="password" value={password} oninput={(e) => password = e.currentTarget.value} placeholder="Enter password" autofocus />
          {#if passwordError}
            <p class="text-sm font-bold text-[#dc2626]">{passwordError}</p>
          {/if}
          <Button type="submit" class="w-full" disabled={!password.trim() || isSubmittingPassword}>
            {isSubmittingPassword ? "Verifying..." : "Continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
{:else if !grantToken}
  <div class="min-h-screen bg-[#f0f0e8] flex items-center justify-center"><div class="text-[#888]">{isRequestingGrant ? "Verifying access..." : "Loading..."}</div></div>
{:else if videoData.data === undefined}
  <div class="min-h-screen bg-[#f0f0e8] flex items-center justify-center"><div class="text-[#888]">Loading video...</div></div>
{:else if !videoData.data?.video}
  <div class="min-h-screen bg-[#f0f0e8] flex items-center justify-center p-4">
    <Card class="max-w-md w-full">
      <CardHeader class="text-center">
        <CardTitle>Video unavailable</CardTitle>
        <CardDescription>This video is no longer available.</CardDescription>
      </CardHeader>
      <CardContent><a href="/" class="block"><Button variant="outline" class="w-full">Go to lawn</Button></a></CardContent>
    </Card>
  </div>
{:else}
  {@const video = videoData.data.video}
  <div class="h-[100dvh] flex flex-col bg-[#f0f0e8]">
    <header class="flex-shrink-0 bg-[#f0f0e8] border-b-2 border-[#1a1a1a] px-5 py-3 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <a href="/" class="text-[#888] hover:text-[#1a1a1a] text-sm font-bold">lawn</a>
        <div class="h-4 w-[2px] bg-[#1a1a1a]/20"></div>
        <h1 class="text-base font-black truncate max-w-[150px] sm:max-w-[300px]">{video.title}</h1>
      </div>
      <div class="flex items-center gap-3 text-xs text-[#888]">
        {#if video.duration}<span class="hidden sm:inline font-mono">{formatDuration(video.duration)}</span>{/if}
      </div>
    </header>

    <div class="flex-1 flex overflow-hidden">
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden bg-black">
        {#if playbackSession?.url}
          <VideoPlayer src={playbackSession.url} poster={playbackSession.posterUrl} comments={[]} onTimeUpdate={(time: number) => currentTime = time} controlsBelow />
        {:else}
          <div class="flex-1 flex items-center justify-center">
            <div class="flex flex-col items-center gap-3 text-white">
              <div class="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80"></div>
              <p class="text-sm font-medium text-white/85">{isLoadingPlayback ? "Loading stream..." : "Preparing stream..."}</p>
            </div>
          </div>
        {/if}
      </div>

      <aside class="hidden lg:flex w-80 xl:w-96 border-l-2 border-[#1a1a1a] flex-col bg-[#f0f0e8]">
        <div class="flex-shrink-0 px-5 py-4 border-b border-[#1a1a1a]/10">
          <h2 class="font-semibold text-sm text-[#1a1a1a]">Discussion</h2>
        </div>
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
          {#if comments.data === undefined}
            <p class="text-sm text-[#888]">Loading comments...</p>
          {:else if comments.data.length === 0}
            <p class="text-sm text-[#888]">No comments yet.</p>
          {:else}
            {#each comments.data as comment}
              <article class="border-2 border-[#1a1a1a] bg-[#f0f0e8] p-3">
                <div class="flex items-center justify-between gap-2">
                  <div class="text-sm font-bold text-[#1a1a1a]">{comment.userName}</div>
                  <button type="button" class="font-mono text-xs text-[#2d5a2d]" onclick={() => playerRef?.seekTo(comment.timestampSeconds)}>{formatTimestamp(comment.timestampSeconds)}</button>
                </div>
                <p class="text-sm text-[#1a1a1a] mt-1 whitespace-pre-wrap">{comment.text}</p>
                <p class="text-[11px] text-[#888] mt-1">{formatRelativeTime(comment._creationTime)}</p>
              </article>
            {/each}
          {/if}
        </div>
        <div class="flex-shrink-0 border-t-2 border-[#1a1a1a] bg-[#f0f0e8] p-4">
          {#if isUserSignedIn}
            <form onsubmit={handleSubmitComment} class="space-y-2">
              <div class="text-xs text-[#666]">Comment at {formatTimestamp(currentTime)}</div>
              <Textarea value={commentText} oninput={(e) => commentText = e.currentTarget.value} placeholder="Leave a comment..." class="min-h-[90px] text-sm" />
              <Button type="submit" size="sm" disabled={!commentText.trim() || isSubmittingComment} class="w-full">{isSubmittingComment ? "Posting..." : "Post comment"}</Button>
            </form>
          {:else}
            <a href={`/sign-in?redirect_url=${encodeURIComponent(`/share/${token}`)}`} class="block">
              <Button class="w-full">Sign in to comment</Button>
            </a>
          {/if}
        </div>
      </aside>
    </div>
  </div>
{/if}
