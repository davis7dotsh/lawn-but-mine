<script lang="ts">// pragma: allowlist secret
  import { page } from "$app/state"; // pragma: allowlist secret
  import { setConvexClientContext, useQuery } from "convex-svelte";
  import { AlertCircle, MessageSquare, X } from "lucide-svelte";
  import { api } from "@convex/_generated/api";
  import CommentInput from "@/lib/components/comments/CommentInput.svelte";
  import CommentList from "@/lib/components/comments/CommentList.svelte";
  import VideoPlayer from "@/lib/components/video-player/VideoPlayer.svelte";
  import { formatDuration } from "@/lib/utils";
  import { buildSignInHref, clerkAuth, getSharedConvexClient } from "@/lib/useVideoPresence";

  const convex = getSharedConvexClient();
  setConvexClientContext(convex);

  const auth = clerkAuth;
  const publicId = $derived(page.params.publicId ?? "");
  const signInHref = $derived(buildSignInHref(`/watch/${publicId}`));

  const videoQuery = useQuery(api.videos.getByPublicId, () =>
    publicId ? { publicId } : "skip",
  );
  const commentsQuery = useQuery(api.comments.getThreadedForPublic, () =>
    publicId ? { publicId } : "skip",
  );

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

  let playbackSession = $state<{ url: string; posterUrl: string } | null>(null);
  let isLoadingPlayback = $state(false);
  let playbackError = $state<string | null>(null);
  let currentTime = $state(0);
  let commentText = $state("");
  let isSubmittingComment = $state(false);
  let commentError = $state<string | null>(null);
  let mobileCommentsOpen = $state(false);
  let playerRef = $state<{ seekTo: (time: number, options?: { play?: boolean }) => void } | null>(null);

  async function submitComment(text: string) {
    if (!publicId || !text.trim() || isSubmittingComment) {
      return;
    }

    isSubmittingComment = true;
    commentError = null;

    try {
      await convex.mutation(api.comments.createForPublic, {
        publicId,
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

  function jumpToComment(seconds: number, closeMobile = false) {
    playerRef?.seekTo(seconds, { play: true });
    if (closeMobile) {
      mobileCommentsOpen = false;
    }
  }

  $effect(() => {
    if (!videoData?.video?.muxPlaybackId || !publicId) {
      playbackSession = null;
      playbackError = null;
      return;
    }

    let cancelled = false;
    isLoadingPlayback = true;
    playbackError = null;

    void convex
      .action(api.videoActions.getPublicPlaybackSession, { publicId })
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
  <title>Watch video</title>
  <meta name="description" content="Watch and review this video on lawn." />
  <meta name="robots" content="noindex" />
</svelte:head>

{#if videoData === undefined}
  <div class="flex min-h-screen items-center justify-center bg-[#f0f0e8]">
    <div class="text-[#888]">Loading...</div>
  </div>
{:else if !videoData?.video}
  <div class="flex min-h-screen items-center justify-center bg-[#f0f0e8] p-4">
    <div class="w-full max-w-md border-2 border-[#1a1a1a] bg-[#f0f0e8] p-6">
      <div class="text-center">
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center border-2 border-[#dc2626] bg-[#dc2626]/10">
          <AlertCircle class="h-6 w-6 text-[#dc2626]" />
        </div>
        <h1 class="text-xl font-black text-[#1a1a1a]">Video unavailable</h1>
        <p class="mt-2 text-sm text-[#888]">
          This video is private, invalid, or no longer available.
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
{:else}
  {@const video = videoData.video}

  <div class="flex h-[100dvh] flex-col bg-[#f0f0e8]">
    <header class="flex shrink-0 items-center justify-between border-b-2 border-[#1a1a1a] bg-[#f0f0e8] px-5 py-3">
      <div class="flex items-center gap-4">
        <a href="/" class="flex items-center gap-2 text-sm font-bold text-[#888] hover:text-[#1a1a1a]">
          lawn
        </a>
        <div class="h-4 w-[2px] bg-[#1a1a1a]/20"></div>
        <h1 class="max-w-[150px] truncate text-base font-black sm:max-w-[300px]">{video.title}</h1>
      </div>

      <div class="flex items-center gap-3 text-xs text-[#888]">
        {#if video.duration}
          <span class="hidden sm:inline text-[#ccc]">&middot;</span>
          <span class="hidden font-mono sm:inline">{formatDuration(video.duration)}</span>
        {/if}

        <button
          type="button"
          class="inline-flex h-8 items-center justify-center gap-1 border-2 border-[#1a1a1a] px-2 text-[#1a1a1a] transition hover:bg-[#1a1a1a] hover:text-[#f0f0e8] lg:hidden"
          onclick={() => {
            mobileCommentsOpen = true;
          }}
        >
          <MessageSquare class="h-4 w-4" />
          {#if comments && comments.length > 0}
            <span class="text-xs">{comments.length}</span>
          {/if}
        </button>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <div class="flex min-w-0 flex-1 flex-col overflow-hidden bg-black">
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
            controlsBelow
          />
        {:else}
          <div class="flex flex-1 items-center justify-center">
            <div class="flex flex-col items-center gap-3 text-white">
              <div class="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80"></div>
              <p class="text-sm font-medium text-white/85">
                {playbackError ?? (isLoadingPlayback ? "Loading stream..." : "Preparing stream...")}
              </p>
            </div>
          </div>
        {/if}
      </div>

      <aside class="hidden w-80 flex-col border-l-2 border-[#1a1a1a] bg-[#f0f0e8] xl:w-96 lg:flex">
        <div class="flex shrink-0 items-center justify-between border-b border-[#1a1a1a]/10 px-5 py-4">
          <h2 class="text-sm font-semibold tracking-tight text-[#1a1a1a]">Discussion</h2>
          {#if comments && comments.length > 0}
            <span class="bg-[#1a1a1a]/5 px-2 py-0.5 text-[11px] font-medium text-[#888]">
              {comments.length} {comments.length === 1 ? "comment" : "comments"}
            </span>
          {/if}
        </div>

        <div class="flex-1 overflow-y-auto p-4">
          <CommentList
            {comments}
            loading={commentsQuery.isLoading}
            onJump={(seconds) => jumpToComment(seconds)}
          />
        </div>

        <div class="shrink-0 border-t-2 border-[#1a1a1a] bg-[#f0f0e8] p-4">
          <CommentInput
            bind:value={commentText}
            {currentTime}
            signedIn={$auth.isSignedIn}
            {signInHref}
            isSubmitting={isSubmittingComment}
            error={commentError}
            onSubmit={submitComment}
          />
        </div>
      </aside>
    </div>

    {#if mobileCommentsOpen}
      <div class="fixed inset-0 z-50 flex flex-col bg-[#f0f0e8] lg:hidden">
        <div class="flex shrink-0 items-center justify-between border-b-2 border-[#1a1a1a] px-5 py-4">
          <h2 class="flex items-center gap-2 text-sm font-semibold tracking-tight text-[#1a1a1a]">
            Discussion
            {#if comments && comments.length > 0}
              <span class="bg-[#1a1a1a]/5 px-2 py-0.5 text-[11px] font-medium text-[#888]">
                {comments.length}
              </span>
            {/if}
          </h2>

          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center border-2 border-transparent text-[#1a1a1a] transition hover:border-[#1a1a1a]"
            onclick={() => {
              mobileCommentsOpen = false;
            }}
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4">
          <CommentList
            {comments}
            loading={commentsQuery.isLoading}
            onJump={(seconds) => jumpToComment(seconds, true)}
          />
        </div>

        <div class="shrink-0 border-t-2 border-[#1a1a1a] bg-[#f0f0e8] p-4">
          <CommentInput
            bind:value={commentText}
            {currentTime}
            signedIn={$auth.isSignedIn}
            {signInHref}
            isSubmitting={isSubmittingComment}
            error={commentError}
            onSubmit={submitComment}
          />
        </div>
      </div>
    {/if}
  </div>
{/if}
