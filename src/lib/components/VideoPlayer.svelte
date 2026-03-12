<script lang="ts" module>
  export interface VideoPlayerHandle {
    seekTo: (time: number, opts?: { play?: boolean }) => void;
  }
</script>

<script lang="ts">
  import { onMount, untrack } from "svelte";
  import type Hls from "hls.js";

  interface Comment {
    _id: string;
    timestampSeconds: number;
    resolved?: boolean;
  }

  interface Props {
    src: string;
    poster?: string;
    comments?: Comment[];
    onTimeUpdate?: (time: number) => void;
    onMarkerClick?: (comment: Comment) => void;
    controlsBelow?: boolean;
    allowDownload?: boolean;
  }

  let {
    src,
    poster,
    comments = [],
    onTimeUpdate,
    onMarkerClick,
    controlsBelow = false,
    allowDownload = false,
  }: Props = $props();

  let wrapperEl: HTMLDivElement;
  let containerEl: HTMLDivElement;
  let videoEl: HTMLVideoElement;
  let trackEl: HTMLDivElement;
  let hlsInstance: Hls | null = null;

  let duration = $state(0);
  let currentTime = $state(0);
  let bufferedPercent = $state(0);
  let isPlaying = $state(false);
  let isMediaReady = $state(false);
  let isBuffering = $state(false);
  let controlsVisible = $state(true);
  let volume = $state(1);
  let isMuted = $state(false);
  let playbackRate = $state(1);
  let isFullscreen = $state(false);
  let isScrubbing = $state(false);
  let scrubTime = $state(0);

  let hideControlsTimeout: number | null = null;
  let wasPlayingBeforeScrub = false;
  let scrubTimeRef = 0;
  let volumeBeforeMute = 1;
  let resumeTimeOnSourceChange: number | null = null;

  const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

  function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
  }

  function isHlsSource(s: string) { return s.includes(".m3u8"); }

  function formatDur(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s2 = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s2.toString().padStart(2, "0")}`;
    return `${m}:${s2.toString().padStart(2, "0")}`;
  }

  function formatTs(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s2 = Math.floor(seconds % 60);
    return `${m}:${s2.toString().padStart(2, "0")}`;
  }

  export function seekTo(time: number, opts?: { play?: boolean }) {
    if (!videoEl) return;
    const t = duration > 0 ? clamp(time, 0, duration) : Math.max(time, 0);
    videoEl.currentTime = t;
    currentTime = t;
    onTimeUpdate?.(t);
    if (opts?.play) videoEl.play().catch(() => {});
    showControls();
  }

  function showControls() {
    controlsVisible = true;
    if (hideControlsTimeout !== null) {
      window.clearTimeout(hideControlsTimeout);
      hideControlsTimeout = null;
    }
    if (isPlaying) {
      hideControlsTimeout = window.setTimeout(() => { controlsVisible = false; }, 2500);
    }
  }

  function applyTime(time: number) {
    if (!videoEl) return;
    const d = duration || videoEl.duration || 0;
    const next = d > 0 ? clamp(time, 0, d) : Math.max(time, 0);
    videoEl.currentTime = next;
    currentTime = next;
    onTimeUpdate?.(next);
  }

  function togglePlay() {
    if (!videoEl) return;
    showControls();
    if (videoEl.paused) videoEl.play().catch(() => {});
    else videoEl.pause();
  }

  function toggleMute() {
    if (!videoEl) return;
    showControls();
    if (videoEl.muted || videoEl.volume === 0) {
      const restored = volumeBeforeMute > 0 ? volumeBeforeMute : 1;
      videoEl.volume = restored;
      videoEl.muted = false;
      volume = restored;
      isMuted = false;
    } else {
      volumeBeforeMute = videoEl.volume;
      videoEl.muted = true;
      isMuted = true;
    }
  }

  function cyclePlaybackRate() {
    if (!videoEl) return;
    showControls();
    const currentIndex = PLAYBACK_RATES.findIndex((r) => r === videoEl.playbackRate);
    const nextIndex = currentIndex === -1 ? 2 : (currentIndex + 1) % PLAYBACK_RATES.length;
    videoEl.playbackRate = PLAYBACK_RATES[nextIndex];
    playbackRate = PLAYBACK_RATES[nextIndex];
  }

  async function toggleFullscreen() {
    const target = controlsBelow ? wrapperEl : containerEl;
    if (!target) return;
    showControls();
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await target.requestFullscreen();
    } catch {}
  }

  function handleSeekBy(delta: number) {
    applyTime((videoEl?.currentTime ?? 0) + delta);
    showControls();
  }

  function getTimeFromClientX(clientX: number) {
    if (!trackEl || !duration) return 0;
    const rect = trackEl.getBoundingClientRect();
    if (rect.width <= 0) return 0;
    return clamp((clientX - rect.left) / rect.width, 0, 1) * duration;
  }

  function startScrub(clientX: number) {
    if (!videoEl || !duration) return;
    wasPlayingBeforeScrub = !videoEl.paused;
    videoEl.pause();
    isScrubbing = true;
    const t = getTimeFromClientX(clientX);
    scrubTimeRef = t;
    scrubTime = t;
    currentTime = t;
    onTimeUpdate?.(t);
  }

  function updateScrub(clientX: number) {
    if (!isScrubbing) return;
    const t = getTimeFromClientX(clientX);
    scrubTimeRef = t;
    scrubTime = t;
    currentTime = t;
    onTimeUpdate?.(t);
  }

  function endScrub() {
    if (!videoEl || !duration) return;
    const t = clamp(scrubTimeRef, 0, duration);
    videoEl.currentTime = t;
    currentTime = t;
    isScrubbing = false;
    if (wasPlayingBeforeScrub) videoEl.play().catch(() => {});
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === " " || e.key.toLowerCase() === "k") { e.preventDefault(); togglePlay(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); handleSeekBy(-5); }
    else if (e.key === "ArrowRight") { e.preventDefault(); handleSeekBy(5); }
    else if (e.key.toLowerCase() === "f") { e.preventDefault(); toggleFullscreen(); }
    else if (e.key.toLowerCase() === "m") { e.preventDefault(); toggleMute(); }
  }

  let groupedMarkers = $derived.by(() => {
    if (!duration || comments.length === 0) return [];
    const markers: { position: number; comment: Comment }[] = [];
    for (const c of comments) {
      const pos = (c.timestampSeconds / duration) * 100;
      if (!markers.find((m) => Math.abs(m.position - pos) < 1)) {
        markers.push({ position: pos, comment: c });
      }
    }
    return markers;
  });

  let displayTime = $derived(isScrubbing ? scrubTime : currentTime);
  let playedPercent = $derived(duration > 0 ? clamp(displayTime / duration, 0, 1) : 0);
  let isExternalControls = $derived(controlsBelow && !isFullscreen);

  onMount(() => {
    let cancelled = false;

    const onLoadedMetadata = () => {
      if (cancelled) return;
      duration = videoEl.duration || 0;
      const resume = resumeTimeOnSourceChange ?? undefined;
      if (resume && resume > 0) videoEl.currentTime = clamp(resume, 0, videoEl.duration || resume);
      resumeTimeOnSourceChange = null;
    };
    const onLoadedData = () => { if (!cancelled) { isMediaReady = true; isBuffering = false; } };
    const onDurationChange = () => { if (!cancelled) duration = videoEl.duration || 0; };
    const onTimeUpdate2 = () => { if (!cancelled && !isScrubbing) { currentTime = videoEl.currentTime || 0; onTimeUpdate?.(currentTime); } };
    const onPlay = () => { if (!cancelled) { isPlaying = true; isBuffering = false; showControls(); } };
    const onPause = () => { if (!cancelled) { isPlaying = false; controlsVisible = true; } };
    const onWaiting = () => { if (!cancelled) isBuffering = true; };
    const onPlaying = () => { if (!cancelled) { isMediaReady = true; isBuffering = false; } };
    const onCanPlay = () => { if (!cancelled) isMediaReady = true; };
    const onError = () => { if (!cancelled) { isMediaReady = true; isBuffering = false; } };
    const onVolumeChange = () => { if (!cancelled) { volume = videoEl.volume; isMuted = videoEl.muted || videoEl.volume === 0; } };
    const onRateChange = () => { if (!cancelled) playbackRate = videoEl.playbackRate || 1; };
    const onProgress = () => {
      if (!cancelled && videoEl.duration && videoEl.buffered.length > 0) {
        bufferedPercent = clamp(videoEl.buffered.end(videoEl.buffered.length - 1) / videoEl.duration, 0, 1);
      }
    };
    const onEnded = () => { if (!cancelled) { isPlaying = false; controlsVisible = true; } };

    const onFsChange = () => { isFullscreen = Boolean(document.fullscreenElement); };
    document.addEventListener("fullscreenchange", onFsChange);

    videoEl.addEventListener("loadedmetadata", onLoadedMetadata);
    videoEl.addEventListener("loadeddata", onLoadedData);
    videoEl.addEventListener("durationchange", onDurationChange);
    videoEl.addEventListener("timeupdate", onTimeUpdate2);
    videoEl.addEventListener("play", onPlay);
    videoEl.addEventListener("pause", onPause);
    videoEl.addEventListener("waiting", onWaiting);
    videoEl.addEventListener("playing", onPlaying);
    videoEl.addEventListener("canplay", onCanPlay);
    videoEl.addEventListener("error", onError);
    videoEl.addEventListener("volumechange", onVolumeChange);
    videoEl.addEventListener("ratechange", onRateChange);
    videoEl.addEventListener("progress", onProgress);
    videoEl.addEventListener("ended", onEnded);

    const attachSource = async () => {
      const ct = videoEl.currentTime;
      resumeTimeOnSourceChange = ct > 0 ? ct : resumeTimeOnSourceChange;
      if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null; }
      duration = 0; currentTime = 0; bufferedPercent = 0; isMediaReady = false; isBuffering = false;
      videoEl.removeAttribute("src");
      videoEl.load();

      const currentSrc = untrack(() => src);
      if (isHlsSource(currentSrc)) {
        try {
          const { default: HlsLib } = await import("hls.js");
          if (cancelled) return;
          if (HlsLib.isSupported()) {
            const hls = new HlsLib({ enableWorker: true });
            hlsInstance = hls;
            hls.loadSource(currentSrc);
            hls.attachMedia(videoEl);
          } else {
            videoEl.src = currentSrc;
          }
        } catch {
          videoEl.src = currentSrc;
        }
      } else {
        videoEl.src = currentSrc;
      }
    };

    attachSource().catch(() => { videoEl.src = untrack(() => src); });

    return () => {
      cancelled = true;
      document.removeEventListener("fullscreenchange", onFsChange);
      videoEl.removeEventListener("loadedmetadata", onLoadedMetadata);
      videoEl.removeEventListener("loadeddata", onLoadedData);
      videoEl.removeEventListener("durationchange", onDurationChange);
      videoEl.removeEventListener("timeupdate", onTimeUpdate2);
      videoEl.removeEventListener("play", onPlay);
      videoEl.removeEventListener("pause", onPause);
      videoEl.removeEventListener("waiting", onWaiting);
      videoEl.removeEventListener("playing", onPlaying);
      videoEl.removeEventListener("canplay", onCanPlay);
      videoEl.removeEventListener("error", onError);
      videoEl.removeEventListener("volumechange", onVolumeChange);
      videoEl.removeEventListener("ratechange", onRateChange);
      videoEl.removeEventListener("progress", onProgress);
      videoEl.removeEventListener("ended", onEnded);
      if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null; }
      if (hideControlsTimeout !== null) window.clearTimeout(hideControlsTimeout);
      videoEl.removeAttribute("src");
      videoEl.load();
    };
  });

  $effect(() => {
    if (!isScrubbing) return;
    const handleMove = (e: PointerEvent) => updateScrub(e.clientX);
    const handleUp = () => endScrub();
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  });
</script>

<div
  bind:this={wrapperEl}
  class={controlsBelow ? "relative flex flex-col h-full bg-black" : "relative"}
>
  <div
    bind:this={containerEl}
    class={controlsBelow
      ? "relative w-full overflow-hidden bg-black flex-1 min-h-0"
      : `relative w-full overflow-hidden bg-black aspect-video ${isFullscreen ? "" : "border border-zinc-800/80 shadow-[0_10px_40px_rgba(0,0,0,0.45)]"}`}
    tabindex="0"
    role="application"
    aria-label="Video player"
    onmousemove={showControls}
    onmouseenter={showControls}
    onmouseleave={() => { if (isPlaying) controlsVisible = false; }}
    onkeydown={handleKeydown}
  >
    <!-- svelte-ignore a11y_media_has_caption -->
    <video
      bind:this={videoEl}
      {poster}
      class={`h-full w-full object-contain transition-opacity duration-200 ${isMediaReady ? "opacity-100" : "opacity-0"}`}
      playsinline
      preload="auto"
      onclick={(e) => { e.stopPropagation(); togglePlay(); }}
    ></video>

    {#if !isMediaReady}
      <div class="pointer-events-none absolute inset-0 z-[5]">
        {#if poster}
          <img src={poster} alt="" class="h-full w-full object-cover blur-[4px]" />
        {:else}
          <div class="h-full w-full bg-zinc-900"></div>
        {/if}
        <div class="absolute inset-0 bg-black/40"></div>
        <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
          <div class="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80"></div>
          <p class="text-sm font-medium text-white/85">Loading stream...</p>
        </div>
      </div>
    {/if}

    {#if !isPlaying}
      <div class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <button
          type="button"
          onclick={(e) => { e.stopPropagation(); togglePlay(); }}
          class="pointer-events-auto inline-flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white shadow-lg transition hover:scale-[1.03] hover:border-white/30 hover:bg-black/75"
          aria-label="Play video"
        >
          <svg class="ml-1 h-9 w-9" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
        </button>
      </div>
    {/if}

    {#if isBuffering && isPlaying}
      <div class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <div class="h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-white/80"></div>
      </div>
    {/if}

    {#if !isExternalControls}
      <div class={`absolute inset-x-0 bottom-0 z-20 transition-opacity ${controlsVisible ? "opacity-100" : "opacity-0"}`}>
        <div class="pointer-events-auto bg-gradient-to-t from-black/90 via-black/70 to-transparent px-4 pb-4 pt-10">
          {@render controlsContent()}
        </div>
      </div>
    {/if}
  </div>

  {#if isExternalControls}
    <div class="flex-shrink-0 bg-black px-4 pb-3 pt-2" onmousemove={showControls} onmouseenter={showControls}>
      {@render controlsContent()}
    </div>
  {/if}
</div>

{#snippet controlsContent()}
  <div
    bind:this={trackEl}
    class="relative mb-3 h-3 w-full cursor-pointer rounded-full border border-white/10 bg-white/10"
    onpointerdown={(e) => { e.preventDefault(); showControls(); startScrub(e.clientX); }}
    role="slider"
    aria-label="Video progress"
    aria-valuenow={displayTime}
    aria-valuemin={0}
    aria-valuemax={duration}
    tabindex="0"
  >
    <div class="absolute inset-y-0 left-0 rounded-full bg-white/20" style="width: {bufferedPercent * 100}%"></div>
    <div class="absolute inset-y-0 left-0 rounded-full bg-[color:var(--accent,#2d5a2d)]" style="width: {playedPercent * 100}%"></div>
    {#each groupedMarkers as marker}
      {@const isResolved = marker.comment.resolved}
      <button
        type="button"
        class={`absolute top-1/2 z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/40 shadow ${isResolved ? "bg-green-400" : "bg-orange-400"}`}
        style="left: {marker.position}%"
        onpointerdown={(e) => e.stopPropagation()}
        onclick={(e) => { e.stopPropagation(); applyTime(marker.comment.timestampSeconds); onMarkerClick?.(marker.comment); showControls(); }}
        aria-label="Jump to comment at {formatTs(marker.comment.timestampSeconds)}"
      ></button>
    {/each}
    <div class="absolute top-1/2 z-20 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-white shadow" style="left: {playedPercent * 100}%"></div>
  </div>

  <div class="flex flex-wrap items-center gap-2 text-white">
    <button
      type="button"
      onclick={(e) => { e.stopPropagation(); togglePlay(); }}
      class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 transition hover:border-white/25 hover:bg-white/20"
      aria-label={isPlaying ? "Pause" : "Play"}
    >
      {#if isPlaying}
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
      {:else}
        <svg class="ml-0.5 h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
      {/if}
    </button>

    <div class="hidden sm:flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-1">
      <button
        type="button"
        onclick={(e) => { e.stopPropagation(); toggleMute(); }}
        class="inline-flex h-7 w-7 items-center justify-center rounded-full text-white/90 transition hover:bg-white/10"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {#if isMuted || volume === 0}
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
        {:else}
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
        {/if}
      </button>
      <input
        aria-label="Volume"
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={isMuted ? 0 : volume}
        oninput={(e) => { e.stopPropagation(); const v = clamp(Number(e.currentTarget.value), 0, 1); if (videoEl) { videoEl.volume = v; videoEl.muted = v === 0; } volume = v; isMuted = v === 0; }}
        class="h-1 w-24 cursor-pointer accent-[color:var(--accent,#2d5a2d)]"
      />
    </div>

    <div class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/90">
      <span class="font-mono">{formatDur(displayTime)} / {formatDur(duration || 0)}</span>
    </div>

    <div class="ml-auto flex items-center gap-2">
      <button
        type="button"
        onclick={(e) => { e.stopPropagation(); handleSeekBy(-10); }}
        class="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:border-white/25 hover:bg-white/15"
        aria-label="Rewind 10 seconds"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1,4 1,10 7,10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
      </button>

      <button
        type="button"
        onclick={(e) => { e.stopPropagation(); handleSeekBy(10); }}
        class="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:border-white/25 hover:bg-white/15"
        aria-label="Forward 10 seconds"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
      </button>

      <button
        type="button"
        onclick={(e) => { e.stopPropagation(); cyclePlaybackRate(); }}
        class="inline-flex h-9 min-w-[56px] items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 text-xs font-medium text-white/95 transition hover:border-white/25 hover:bg-white/15"
        aria-label="Playback speed {playbackRate}x"
      >
        {playbackRate}x
      </button>

      <button
        type="button"
        onclick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
        class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 transition hover:border-white/25 hover:bg-white/20"
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {#if isFullscreen}
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4,14 10,14 10,20"/><polyline points="20,10 14,10 14,4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
        {:else}
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15,3 21,3 21,9"/><polyline points="9,21 3,21 3,15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
        {/if}
      </button>
    </div>
  </div>
{/snippet}
