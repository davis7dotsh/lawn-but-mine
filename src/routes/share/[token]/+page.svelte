<script lang="ts">
  import { page } from "$app/state"; 
  import { setConvexClientContext, useQuery } from "convex-svelte";
  import { AlertCircle, Lock, Video } from "lucide-svelte";
  import { api } from "@convex/_generated/api";
  import CommentInput from "@/lib/components/comments/CommentInput.svelte";
  import CommentList from "@/lib/components/comments/CommentList.svelte";
  import VideoWatchers from "@/lib/components/presence/VideoWatchers.svelte";
  import VideoPlayer from "@/lib/components/video-player/VideoPlayer.svelte";
  import { formatDuration } from "@/lib/utils";
  import { buildSignInHref, clerkAuth, getSharedConvexClient } from "@/lib/useVideoPresence";

  const convex = getSharedConvexClient();
  setConvexClientContext(convex);

  const auth = clerkAuth;
  const token = $derived(page.params.token ?? "");
  const signInHref = $derived(buildSignInHref(`/share/${token}`));

  let grantToken = $state<string | null>(null);
  let hasAttemptedAutoGrant = $state(false);
  let passwordInput = $state("");
  let passwordError = $state(false);
  let isRequestingGrant = $state(false);
  let playbackSession = $state<{ url: string; posterUrl: string } | null>(null);
  let isLoadingPlayback = $state(false);
  let playbackError = $state<string | null>(null);
  let currentTime = $state(0);
  let commentText = $state("");
  let isSubmittingComment = $state(false);
  let commentError = $state<string | null>(null);
  let playerRef = $state<{ seekTo: (time: number, options?: { play?: boolean }) => void } | null>(null);

  const shareInfoQuery = useQuery(api.shareLinks.getByToken, () =>
    token ? { token } : "skip",
  );
  const videoQuery = useQuery(api.videos.getByShareGrant, () =>
    grantToken ? { grantToken } : "skip",
  );
  const commentsQuery = useQuery(api.comments.getThreadedForShareGrant, () =>
    grantToken ? { grantToken } : "skip",
  );

  const shareInfo = $derived(shareInfoQuery.data);
  const videoData = $derived(videoQuery.data);
  const comments = $derived(commentsQuery.data);
  const flattenedComments = $derived.by(() => {
    if (!comments) {
      return [] as Array<{ _id: string; timestampSeconds: number; resolved: boolean }>;
    }

    const markers: Array<{ _id: string; timestampSeconds: number; resolved: boolean }> = [];
    for (const comment of comments) {
      markers.push({
        _id: comment._id,
        timestampSeconds: comment.timestampSeconds,
        resolved: comment.resolved,
      });
      for (const reply of comment.replies) {
        markers.push({
          _id: reply._id,
          timestampSeconds: reply.timestampSeconds,
          resolved: reply.resolved,
        });
      }
    }
    return markers;
  });
  const canTrackPresence = $derived(Boolean(playbackSession?.url && videoData?.video?._id));
  const isBootstrappingShare = $derived(
    shareInfo === undefined ||
      (shareInfo?.status === "ok" &&
        ((!grantToken && (!hasAttemptedAutoGrant || isRequestingGrant)) ||
          (Boolean(grantToken) && videoData === undefined))),
  );

  async function acquireGrant(password?: string) {
    if (!token || isRequestingGrant) {
      return false;
    }

    isRequestingGrant = true;
    passwordError = false;

    try {
      const result = await convex.mutation(api.shareLinks.issueAccessGrant, {
        token,
        password,
      });

      if (result.ok && result.grantToken) {
        grantToken = result.grantToken;
        return true;
      }

      passwordError = Boolean(password);
      return false;
    } catch {
      passwordError = Boolean(password);
      return false;
    } finally {
      isRequestingGrant = false;
    }
  }

  async function submitComment(text: string) {
    if (!grantToken || !text.trim() || isSubmittingComment) {
      return;
    }

    isSubmittingComment = true;
    commentError = null;

    try {
      await convex.mutation(api.comments.createForShareGrant, {
        grantToken,
        text: text.trim(),
        timestampSeconds: currentTime,
      });
      commentText = "";
    } catch {
      commentError = "Failed to post comment.";
    } finally {
      isSubmittingComment = false;
    }
  }

  function jumpToComment(seconds: number) {
    playerRef?.seekTo(seconds, { play: true });
  }

  $effect(() => {
    token;
    grantToken = null;
    hasAttemptedAutoGrant = false;
    passwordError = false;
    passwordInput = "";
  });

  $effect(() => {
    if (!shareInfo || grantToken || shareInfo.status !== "ok" || hasAttemptedAutoGrant) {
      return;
    }

    hasAttemptedAutoGrant = true;
    void acquireGrant();
  });

  $effect(() => {
    if (!grantToken) {
      playbackSession = null;
      playbackError = null;
      return;
    }

    let cancelled = false;
    isLoadingPlayback = true;
    playbackError = null;

    void convex
      .action(api.videoActions.getSharedPlaybackSession, { grantToken })
      .then((session) => {
        if (!cancelled) {
          playbackSession = session;
        }
      })
      .catch(() => {
        if (!cancelled) {
          playbackError = "Unable to load playback session.";
        }
      })
      .finally(() => {
        if (!cancelled) {
          isLoadingPlayback = false;
        }
      });

    return () => {
      cancelled = true;
    };
  });
</script>

<svelte:head>
  <title>Shared video</title>
  <meta name="description" content="Review this shared video on lawn." />
  <meta name="robots" content="noindex" />
</svelte:head>

{#if isBootstrappingShare}
  <div class="flex min-h-screen items-center justify-center bg-[#f0f0e8]">
    <div class="text-[#888]">Opening shared video...</div>
  </div>
{:else if shareInfo?.status === "missing" || shareInfo?.status === "expired"}
  <div class="flex min-h-screen items-center justify-center bg-[#f0f0e8] p-4">
    <div class="w-full max-w-md border-2 border-[#1a1a1a] bg-[#f0f0e8] p-6">
      <div class="text-center">
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center border-2 border-[#dc2626] bg-[#dc2626]/10">
          <AlertCircle class="h-6 w-6 text-[#dc2626]" />
        </div>
        <h1 class="text-xl font-black text-[#1a1a1a]">Link expired or invalid</h1>
        <p class="mt-2 text-sm text-[#888]">
          This share link is no longer valid. Please ask the video owner for a new link.
        </p>
      </div>

      <a
        href="/"
        class="mt-6 inline-flex w-full items-center justify-center border-2 border-[#1a1a1a] px-4 py-2 text-sm font-bold text-[#1a1a1a] transition hover:bg-[#1a1a1a] hover:text-[#f0f0e8]"
      >
        Go to lawn
      </a>
    </div>
  </div>
{:else if shareInfo?.status === "requiresPassword" && !grantToken}
  <div class="flex min-h-screen items-center justify-center bg-[#f0f0e8] p-4">
    <div class="w-full max-w-md border-2 border-[#1a1a1a] bg-[#f0f0e8] p-6">
      <div class="text-center">
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center border-2 border-[#1a1a1a] bg-[#e8e8e0]">
          <Lock class="h-6 w-6 text-[#888]" />
        </div>
        <h1 class="text-xl font-black text-[#1a1a1a]">Password required</h1>
        <p class="mt-2 text-sm text-[#888]">
          This video is password protected. Enter the password to view.
        </p>
      </div>

      <form
        class="mt-6 space-y-4"
        onsubmit={async (event) => {
          event.preventDefault();
          await acquireGrant(passwordInput);
        }}
      >
        <input
          bind:value={passwordInput}
          type="password"
          placeholder="Enter password"
          class="w-full border-2 border-[#1a1a1a] bg-[#f0f0e8] px-3 py-2 text-sm text-[#1a1a1a] outline-none placeholder:text-[#888]"
        />

        {#if passwordError}
          <p class="text-sm text-[#dc2626]">Incorrect password</p>
        {/if}

        <button
          type="submit"
          class="inline-flex w-full items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-4 py-2 text-sm font-bold text-[#f0f0e8] transition hover:bg-[#2d5a2d] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!passwordInput || isRequestingGrant}
        >
          {isRequestingGrant ? "Verifying..." : "View video"}
        </button>
      </form>
    </div>
  </div>
{:else if !videoData?.video}
  <div class="flex min-h-screen items-center justify-center bg-[#f0f0e8] p-4">
    <div class="w-full max-w-md border-2 border-[#1a1a1a] bg-[#f0f0e8] p-6">
      <div class="text-center">
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center border-2 border-[#1a1a1a] bg-[#e8e8e0]">
          <Video class="h-6 w-6 text-[#888]" />
        </div>
        <h1 class="text-xl font-black text-[#1a1a1a]">Video not available</h1>
        <p class="mt-2 text-sm text-[#888]">This video is not available or is still processing.</p>
      </div>
    </div>
  </div>
{:else}
  {@const video = videoData.video}

  <div class="min-h-screen bg-[#f0f0e8]">
    <header class="border-b-2 border-[#1a1a1a] bg-[#f0f0e8] px-6 py-4">
      <div class="mx-auto flex max-w-6xl items-center justify-between">
        <a href="/" class="flex items-center gap-2 text-sm font-bold text-[#888] hover:text-[#1a1a1a]">
          lawn
        </a>
      </div>
    </header>

    <main class="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 class="text-2xl font-black text-[#1a1a1a]">{video.title}</h1>
        {#if video.description}
          <p class="mt-1 text-[#888]">{video.description}</p>
        {/if}

        <div class="mt-2 flex items-center gap-4 text-sm text-[#888]">
          {#if video.duration}
            <span class="font-mono">{formatDuration(video.duration)}</span>
          {/if}
          {#if comments}
            <span>{comments.length} threads</span>
          {/if}

          <VideoWatchers
            videoId={video._id}
            enabled={canTrackPresence}
            shareToken={token}
            className="ml-auto"
          />
        </div>
      </div>

      <div class="overflow-hidden border-2 border-[#1a1a1a]">
        {#if playbackSession?.url}
          <VideoPlayer
            bind:this={playerRef}
            src={playbackSession.url}
            poster={playbackSession.posterUrl}
            comments={flattenedComments}
            onTimeUpdate={(time) => {
              currentTime = time;
            }}
            allowDownload={false}
          />
        {:else}
          <div class="relative aspect-video overflow-hidden border border-zinc-800/80 bg-black shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
            {#if playbackSession?.posterUrl || video.thumbnailUrl?.startsWith("http")}
              <img
                src={playbackSession?.posterUrl ?? video.thumbnailUrl}
                alt={`${video.title} thumbnail`}
                class="h-full w-full object-cover blur-[4px]"
              />
            {/if}

            <div class="absolute inset-0 bg-black/45"></div>
            <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
              <div class="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80"></div>
              <p class="text-sm font-medium text-white/85">
                {playbackError ?? (isLoadingPlayback ? "Loading stream..." : "Preparing stream...")}
              </p>
            </div>
          </div>
        {/if}
      </div>

      <section class="space-y-4 border-2 border-[#1a1a1a] bg-[#e8e8e0] p-4">
        <div class="flex items-center justify-between">
          <h2 class="font-black text-[#1a1a1a]">Comments</h2>
          <span class="font-mono text-xs text-[#888]">{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, "0")}</span>
        </div>

        <CommentInput
          bind:value={commentText}
          {currentTime}
          signedIn={$auth.isSignedIn}
          {signInHref}
          isSubmitting={isSubmittingComment}
          error={commentError}
          onSubmit={submitComment}
        />

        <CommentList
          {comments}
          loading={commentsQuery.isLoading}
          onJump={jumpToComment}
        />
      </section>
    </main>

    <footer class="mt-8 border-t-2 border-[#1a1a1a] px-6 py-4">
      <div class="mx-auto max-w-6xl text-center text-sm text-[#888]">
        Shared via
        <a href="/" class="ml-1 font-bold text-[#1a1a1a] hover:text-[#2d5a2d]">lawn</a>
      </div>
    </footer>
  </div>
{/if}
