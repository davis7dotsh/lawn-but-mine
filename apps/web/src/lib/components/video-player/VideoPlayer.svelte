<script lang="ts">
  import { browser } from "$app/environment";
  import type Hls from "hls.js";
  import {
    Check,
    ChevronDown,
    Download,
    Maximize2,
    Minimize2,
    Pause,
    Play,
    RotateCcw,
    RotateCw,
    Settings2,
    Timer,
    Volume2,
    VolumeX,
  } from "lucide-svelte";
  import { triggerDownload } from "@/lib/download";
  import { cn, formatDuration, formatTimestamp } from "@/lib/utils";

  export type CommentMarker = {
    _id: string;
    timestampSeconds: number;
    resolved: boolean;
  };

  export type DownloadResult = {
    url: string;
    filename?: string;
  };

  export type QualityOption = {
    id: string;
    label: string;
    disabled?: boolean;
  };

  export type VideoPlayerHandle = {
    seekTo: (time: number, options?: { play?: boolean }) => void;
  };

  type QualityLevelOption = {
    level: number;
    label: string;
  };

  type VideoPlayerProps = {
    src: string;
    poster?: string;
    comments?: CommentMarker[];
    onTimeUpdate?: (currentTime: number) => void;
    onMarkerClick?: (comment: CommentMarker) => void;
    initialTime?: number;
    className?: string;
    allowDownload?: boolean;
    downloadUrl?: string;
    downloadFilename?: string;
    onRequestDownload?: () => Promise<DownloadResult | null | undefined> | DownloadResult | null | undefined;
    qualityOptionsConfig?: QualityOption[];
    selectedQualityId?: string;
    onSelectQuality?: (id: string) => void;
    controlsBelow?: boolean;
  };

  const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
  const AUTO_QUALITY_LEVEL = -1 as const;

  let {
    src,
    poster,
    comments = [],
    onTimeUpdate = (_currentTime: number) => {},
    onMarkerClick = (_comment: CommentMarker) => {},
    initialTime,
    className,
    allowDownload = false,
    downloadUrl,
    downloadFilename,
    onRequestDownload,
    qualityOptionsConfig,
    selectedQualityId,
    onSelectQuality = (_id: string) => {},
    controlsBelow = false,
  }: VideoPlayerProps = $props();

  let wrapperElement: HTMLDivElement | null = null;
  let containerElement: HTMLDivElement | null = null;
  let videoElement: HTMLVideoElement | null = null;
  let trackElement: HTMLDivElement | null = null;
  let qualityMenuElement = $state<HTMLDivElement | null>(null);
  let contextMenuElement = $state<HTMLDivElement | null>(null);
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
  let isDownloading = $state(false);
  let loopEnabled = $state(false);
  let contextMenu = $state<{ x: number; y: number } | null>(null);
  let qualityMenuOpen = $state(false);
  let qualityOptions = $state<QualityLevelOption[]>([]);
  let selectedQualityLevel = $state<number>(AUTO_QUALITY_LEVEL);

  let hideControlsTimeoutId: number | null = null;
  let scrubPointerId: number | null = null;
  let wasPlayingBeforeScrub = false;
  let volumeBeforeMute = 1;
  let resumeTimeOnSourceChange: number | null = null;

  function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
  }

  function isHlsSource(value: string) {
    return value.includes(".m3u8");
  }

  const groupedMarkers = $derived.by(() => {
    if (!duration || comments.length === 0) {
      return [] as Array<{ position: number; comment: CommentMarker }>;
    }

    const markers: Array<{ position: number; comment: CommentMarker }> = [];
    for (const comment of comments) {
      const position = (comment.timestampSeconds / duration) * 100;
      const existing = markers.find((marker) => Math.abs(marker.position - position) < 1);
      if (!existing) {
        markers.push({ position, comment });
      }
    }
    return markers;
  });

  const displayTime = $derived(isScrubbing ? scrubTime : currentTime);
  const playedPercent = $derived(duration > 0 ? clamp(displayTime / duration, 0, 1) : 0);
  const canDownload = $derived(allowDownload && (Boolean(downloadUrl) || Boolean(onRequestDownload)));
  const isHls = $derived(isHlsSource(src));
  const hasExternalQualityOptions = $derived(Boolean(qualityOptionsConfig?.length));
  const hasManualQualityOptions = $derived(isHls && qualityOptions.length > 0);
  const isExternalControls = $derived(controlsBelow && !isFullscreen);
  const qualityLabel = $derived.by(() => {
    if (hasExternalQualityOptions) {
      return qualityOptionsConfig?.find((option) => option.id === selectedQualityId)?.label ?? "Quality";
    }
    if (!isHls) {
      return "Original";
    }
    if (selectedQualityLevel === AUTO_QUALITY_LEVEL) {
      return "Auto";
    }
    return qualityOptions.find((option) => option.level === selectedQualityLevel)?.label ?? "Auto";
  });

  function clearHideControlsTimeout() {
    if (!browser || hideControlsTimeoutId === null) {
      return;
    }

    window.clearTimeout(hideControlsTimeoutId);
    hideControlsTimeoutId = null;
  }

  function scheduleHideControls() {
    clearHideControlsTimeout();

    if (!browser || !isPlaying || isScrubbing || qualityMenuOpen || contextMenu) {
      return;
    }

    hideControlsTimeoutId = window.setTimeout(() => {
      controlsVisible = false;
    }, 2_500);
  }

  function showControls(options?: { persist?: boolean }) {
    controlsVisible = true;

    if (options?.persist) {
      clearHideControlsTimeout();
      return;
    }

    scheduleHideControls();
  }

  function closeMenus() {
    qualityMenuOpen = false;
    contextMenu = null;
  }

  function focusPlayer() {
    containerElement?.focus({ preventScroll: true });
  }

  function shouldIgnorePlayerShortcut(event: KeyboardEvent) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    return (
      target.isContentEditable ||
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.tagName === "BUTTON"
    );
  }

  function updateBuffered() {
    if (!videoElement || !videoElement.duration || videoElement.buffered.length === 0) {
      return;
    }

    const end = videoElement.buffered.end(videoElement.buffered.length - 1);
    bufferedPercent = clamp(end / videoElement.duration, 0, 1);
  }

  function applyTime(time: number) {
    if (!videoElement) {
      return;
    }

    const actualDuration = duration || videoElement.duration || 0;
    const next = actualDuration > 0 ? clamp(time, 0, actualDuration) : Math.max(time, 0);
    videoElement.currentTime = next;
    currentTime = next;
    onTimeUpdate(next);
  }

  export function seekTo(time: number, options?: { play?: boolean }) {
    applyTime(time);

    if (options?.play && videoElement) {
      void videoElement.play().catch(() => {});
    }

    showControls();
  }

  function handleSeekBy(delta: number) {
    applyTime((videoElement?.currentTime ?? 0) + delta);
    showControls();
  }

  function togglePlay() {
    if (!videoElement) {
      return;
    }

    showControls();

    if (videoElement.paused) {
      void videoElement.play().catch(() => {});
      return;
    }

    videoElement.pause();
  }

  function setVideoVolume(nextVolume: number) {
    if (!videoElement) {
      return;
    }

    const clamped = clamp(nextVolume, 0, 1);
    videoElement.volume = clamped;
    videoElement.muted = clamped === 0;
    volume = clamped;
    isMuted = videoElement.muted;
  }

  function toggleMute() {
    if (!videoElement) {
      return;
    }

    showControls();

    if (videoElement.muted || videoElement.volume === 0) {
      const restored = volumeBeforeMute > 0 ? volumeBeforeMute : 1;
      setVideoVolume(restored);
      videoElement.muted = false;
      isMuted = false;
      return;
    }

    volumeBeforeMute = videoElement.volume;
    videoElement.muted = true;
    isMuted = true;
  }

  function cyclePlaybackRate() {
    if (!videoElement) {
      return;
    }

    showControls();

    const currentIndex = PLAYBACK_RATES.findIndex((rate) => rate === videoElement?.playbackRate);
    const nextIndex = currentIndex === -1 ? 2 : (currentIndex + 1) % PLAYBACK_RATES.length;
    const nextRate = PLAYBACK_RATES[nextIndex];
    videoElement.playbackRate = nextRate;
    playbackRate = nextRate;
  }

  async function toggleFullscreen() {
    const target = controlsBelow ? wrapperElement : containerElement;
    if (!target) {
      return;
    }

    showControls();

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await target.requestFullscreen();
      }
    } catch {}
  }

  async function handleDownload() {
    if (!canDownload || isDownloading) {
      return;
    }

    showControls();
    isDownloading = true;

    try {
      if (onRequestDownload) {
        const result = await onRequestDownload();
        if (result?.url) {
          triggerDownload(result.url, result.filename ?? downloadFilename);
          return;
        }
      }

      if (downloadUrl) {
        triggerDownload(downloadUrl, downloadFilename);
      }
    } finally {
      closeMenus();
      isDownloading = false;
    }
  }

  async function copyTimestamp() {
    const label = formatTimestamp(displayTime);
    try {
      await navigator.clipboard.writeText(label);
    } catch {}
    closeMenus();
    showControls();
  }

  function toggleLoop() {
    if (!videoElement) {
      return;
    }

    const next = !loopEnabled;
    videoElement.loop = next;
    loopEnabled = next;
    closeMenus();
    showControls();
  }

  function applyQualityLevel(level: number) {
    if (!hlsInstance) {
      return;
    }

    hlsInstance.currentLevel = level;
    selectedQualityLevel = level;
    qualityMenuOpen = false;
    showControls();
  }

  function getTimeFromClientX(clientX: number) {
    if (!trackElement || !duration) {
      return 0;
    }

    const rect = trackElement.getBoundingClientRect();
    if (rect.width <= 0) {
      return 0;
    }

    const percent = clamp((clientX - rect.left) / rect.width, 0, 1);
    return percent * duration;
  }

  function startScrub(clientX: number, pointerId: number) {
    if (!videoElement || !duration) {
      return;
    }

    scrubPointerId = pointerId;
    wasPlayingBeforeScrub = !videoElement.paused;
    videoElement.pause();
    isScrubbing = true;

    const nextTime = getTimeFromClientX(clientX);
    scrubTime = nextTime;
    currentTime = nextTime;
    onTimeUpdate(nextTime);
  }

  function updateScrub(clientX: number) {
    if (!isScrubbing) {
      return;
    }

    const nextTime = getTimeFromClientX(clientX);
    scrubTime = nextTime;
    currentTime = nextTime;
    onTimeUpdate(nextTime);
  }

  function endScrub(pointerId?: number) {
    if (!videoElement || !duration) {
      return;
    }

    if (pointerId !== undefined && scrubPointerId !== null && pointerId !== scrubPointerId) {
      return;
    }

    const finalTime = clamp(scrubTime, 0, duration);
    videoElement.currentTime = finalTime;
    currentTime = finalTime;
    onTimeUpdate(finalTime);
    isScrubbing = false;
    scrubPointerId = null;

    if (wasPlayingBeforeScrub) {
      void videoElement.play().catch(() => {});
    }

    showControls();
  }

  $effect(() => {
    return () => {
      clearHideControlsTimeout();
    };
  });

  $effect(() => {
    if (!browser) {
      return;
    }

    const handleFullscreenChange = () => {
      isFullscreen = Boolean(document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  });

  $effect(() => {
    if (!browser || !contextMenu) {
      return;
    }

    const handleClose = (event?: Event) => {
      const target = event?.target;
      if (target instanceof Node && contextMenuElement?.contains(target)) {
        return;
      }

      contextMenu = null;
    };

    window.addEventListener("click", handleClose);
    window.addEventListener("blur", handleClose);
    window.addEventListener("contextmenu", handleClose);

    return () => {
      window.removeEventListener("click", handleClose);
      window.removeEventListener("blur", handleClose);
      window.removeEventListener("contextmenu", handleClose);
    };
  });

  $effect(() => {
    if (!browser || !qualityMenuOpen) {
      return;
    }

    const handleClose = (event?: Event) => {
      const target = event?.target;
      if (target instanceof Node && qualityMenuElement?.contains(target)) {
        return;
      }

      qualityMenuOpen = false;
    };

    window.addEventListener("click", handleClose);
    window.addEventListener("blur", handleClose);

    return () => {
      window.removeEventListener("click", handleClose);
      window.removeEventListener("blur", handleClose);
    };
  });

  $effect(() => {
    if (!browser) {
      return;
    }

    scheduleHideControls();
  });

  $effect(() => {
    if (!browser || !videoElement) {
      return;
    }

    let cancelled = false;

    const handleLoadedMetadata = () => {
      if (cancelled || !videoElement) {
        return;
      }

      duration = videoElement.duration || 0;
      updateBuffered();

      const resumeTime = initialTime ?? resumeTimeOnSourceChange ?? undefined;
      if (resumeTime && resumeTime > 0) {
        videoElement.currentTime = clamp(resumeTime, 0, videoElement.duration || resumeTime);
      }

      resumeTimeOnSourceChange = null;
    };

    const handleLoadedData = () => {
      if (cancelled) {
        return;
      }

      isMediaReady = true;
      isBuffering = false;
    };

    const handleDurationChange = () => {
      if (cancelled || !videoElement) {
        return;
      }
      duration = videoElement.duration || 0;
    };

    const handleTimeUpdate = () => {
      if (cancelled || !videoElement || isScrubbing) {
        return;
      }

      const time = videoElement.currentTime || 0;
      currentTime = time;
      onTimeUpdate(time);
    };

    const handlePlay = () => {
      if (cancelled) {
        return;
      }

      isPlaying = true;
      isBuffering = false;
      showControls();
    };

    const handlePause = () => {
      if (cancelled) {
        return;
      }

      isPlaying = false;
      isBuffering = false;
      controlsVisible = true;
    };

    const handleWaiting = () => {
      if (!cancelled) {
        isBuffering = true;
      }
    };

    const handlePlaying = () => {
      if (cancelled) {
        return;
      }

      isMediaReady = true;
      isBuffering = false;
    };

    const handleCanPlay = () => {
      if (!cancelled) {
        isMediaReady = true;
      }
    };

    const handleError = () => {
      if (cancelled) {
        return;
      }

      isMediaReady = true;
      isBuffering = false;
    };

    const handleVolumeChange = () => {
      if (cancelled || !videoElement) {
        return;
      }

      volume = videoElement.volume;
      isMuted = videoElement.muted || videoElement.volume === 0;
    };

    const handleRateChange = () => {
      if (cancelled || !videoElement) {
        return;
      }

      playbackRate = videoElement.playbackRate || 1;
    };

    const handleProgress = () => {
      if (!cancelled) {
        updateBuffered();
      }
    };

    const handleEnded = () => {
      if (cancelled) {
        return;
      }

      isPlaying = false;
      controlsVisible = true;
    };

    const attachSource = async () => {
      if (!videoElement) {
        return;
      }

      const currentSourceTime = videoElement.currentTime;
      resumeTimeOnSourceChange =
        currentSourceTime > 0 ? currentSourceTime : resumeTimeOnSourceChange;

      if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
      }

      duration = 0;
      currentTime = 0;
      bufferedPercent = 0;
      isMediaReady = false;
      isBuffering = false;
      qualityMenuOpen = false;
      qualityOptions = [];
      selectedQualityLevel = AUTO_QUALITY_LEVEL;

      videoElement.removeAttribute("src");
      videoElement.load();

      if (isHlsSource(src)) {
        const module = await import("hls.js");
        const HlsCtor = module.default;

        if (cancelled) {
          return;
        }

        if (HlsCtor.isSupported()) {
          const nextHls = new HlsCtor({ enableWorker: true });
          hlsInstance = nextHls;
          nextHls.loadSource(src);
          nextHls.attachMedia(videoElement);
          nextHls.on(HlsCtor.Events.MANIFEST_PARSED, () => {
            const dedupedByHeight = new Map<number, { level: number; bitrate: number }>();

            nextHls.levels.forEach((levelInfo, levelIndex) => {
              const height = levelInfo.height;
              if (!height) {
                return;
              }

              const bitrate = levelInfo.bitrate ?? 0;
              const existing = dedupedByHeight.get(height);
              if (!existing || bitrate >= existing.bitrate) {
                dedupedByHeight.set(height, { level: levelIndex, bitrate });
              }
            });

            qualityOptions = Array.from(dedupedByHeight.entries())
              .sort((left, right) => right[0] - left[0])
              .map(([height, data]) => ({
                level: data.level,
                label: `${height}p`,
              }));
            selectedQualityLevel = AUTO_QUALITY_LEVEL;
          });
          nextHls.on(HlsCtor.Events.LEVEL_SWITCHED, () => {
            if (nextHls.autoLevelEnabled) {
              selectedQualityLevel = AUTO_QUALITY_LEVEL;
            }
          });
          return;
        }
      }

      videoElement.src = src;
    };

    videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    videoElement.addEventListener("loadeddata", handleLoadedData);
    videoElement.addEventListener("durationchange", handleDurationChange);
    videoElement.addEventListener("timeupdate", handleTimeUpdate);
    videoElement.addEventListener("play", handlePlay);
    videoElement.addEventListener("pause", handlePause);
    videoElement.addEventListener("waiting", handleWaiting);
    videoElement.addEventListener("playing", handlePlaying);
    videoElement.addEventListener("canplay", handleCanPlay);
    videoElement.addEventListener("error", handleError);
    videoElement.addEventListener("volumechange", handleVolumeChange);
    videoElement.addEventListener("ratechange", handleRateChange);
    videoElement.addEventListener("progress", handleProgress);
    videoElement.addEventListener("ended", handleEnded);

    void attachSource().catch(() => {
      if (videoElement) {
        videoElement.src = src;
      }
    });

    return () => {
      cancelled = true;

      if (!videoElement) {
        return;
      }

      const nextTime = videoElement.currentTime;
      if (nextTime > 0) {
        resumeTimeOnSourceChange = nextTime;
      }

      videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      videoElement.removeEventListener("loadeddata", handleLoadedData);
      videoElement.removeEventListener("durationchange", handleDurationChange);
      videoElement.removeEventListener("timeupdate", handleTimeUpdate);
      videoElement.removeEventListener("play", handlePlay);
      videoElement.removeEventListener("pause", handlePause);
      videoElement.removeEventListener("waiting", handleWaiting);
      videoElement.removeEventListener("playing", handlePlaying);
      videoElement.removeEventListener("canplay", handleCanPlay);
      videoElement.removeEventListener("error", handleError);
      videoElement.removeEventListener("volumechange", handleVolumeChange);
      videoElement.removeEventListener("ratechange", handleRateChange);
      videoElement.removeEventListener("progress", handleProgress);
      videoElement.removeEventListener("ended", handleEnded);

      if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
      }

      videoElement.removeAttribute("src");
      videoElement.load();
    };
  });
</script>

{#snippet controlsContent()}
  <div
    bind:this={trackElement}
    class="relative mb-3 h-3 w-full cursor-pointer touch-none select-none rounded-full border border-white/10 bg-white/10"
    role="slider"
    aria-label="Seek video"
    aria-orientation="horizontal"
    aria-valuemin={0}
    aria-valuemax={duration || 0}
    aria-valuenow={Math.round(displayTime)}
    aria-valuetext={formatTimestamp(displayTime)}
    tabindex="0"
    onpointerdown={(event) => {
      event.preventDefault();
      event.stopPropagation();
      focusPlayer();
      (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
      showControls({ persist: true });
      startScrub(event.clientX, event.pointerId);
    }}
    onpointermove={(event) => {
      if (!isScrubbing) {
        return;
      }

      event.preventDefault();
      updateScrub(event.clientX);
      showControls({ persist: true });
    }}
    onpointerup={(event) => {
      if ((event.currentTarget as HTMLDivElement).hasPointerCapture(event.pointerId)) {
        (event.currentTarget as HTMLDivElement).releasePointerCapture(event.pointerId);
      }
      endScrub(event.pointerId);
    }}
    onpointercancel={(event) => {
      if ((event.currentTarget as HTMLDivElement).hasPointerCapture(event.pointerId)) {
        (event.currentTarget as HTMLDivElement).releasePointerCapture(event.pointerId);
      }
      endScrub(event.pointerId);
    }}
    onlostpointercapture={() => {
      if (isScrubbing) {
        endScrub();
      }
    }}
    onkeydown={(event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        handleSeekBy(-5);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        handleSeekBy(5);
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        seekTo(0);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        seekTo(duration || videoElement?.duration || 0);
      }
    }}
  >
    <div
      class="absolute inset-y-0 left-0 rounded-full bg-white/20"
      style={`width: ${bufferedPercent * 100}%`}
    ></div>
    <div
      class="absolute inset-y-0 left-0 rounded-full bg-[color:var(--accent)]"
      style={`width: ${playedPercent * 100}%`}
    ></div>

    {#each groupedMarkers as marker (marker.comment._id)}
      <button
        type="button"
        class={cn(
          "absolute top-1/2 z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/40 shadow",
          marker.comment.resolved ? "bg-green-400" : "bg-orange-400",
          Math.abs(displayTime - marker.comment.timestampSeconds) < 1.5 ? "ring-2 ring-white/60" : "",
        )}
        style={`left: ${marker.position}%`}
        onpointerdown={(event) => {
          event.stopPropagation();
        }}
        onclick={(event) => {
          event.stopPropagation();
          applyTime(marker.comment.timestampSeconds);
          onMarkerClick(marker.comment);
          showControls();
        }}
        aria-label={`Jump to comment at ${formatTimestamp(marker.comment.timestampSeconds)}`}
        title={`Comment at ${formatTimestamp(marker.comment.timestampSeconds)}`}
      ></button>
    {/each}

    {#if isScrubbing}
      <div
        class="pointer-events-none absolute bottom-full z-30 mb-2 -translate-x-1/2 rounded-md bg-black/85 px-2 py-1 text-[11px] font-medium text-white shadow"
        style={`left: ${playedPercent * 100}%`}
      >
        {formatTimestamp(scrubTime)}
      </div>
    {/if}

    <div
      class="absolute top-1/2 z-20 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-white shadow"
      style={`left: ${playedPercent * 100}%`}
    ></div>
  </div>

  <div class="flex flex-wrap items-center gap-2 text-white">
    <button
      type="button"
      class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 transition hover:border-white/25 hover:bg-white/20"
      aria-label={isPlaying ? "Pause" : "Play"}
      onclick={(event) => {
        event.stopPropagation();
        togglePlay();
      }}
    >
      {#if isPlaying}
        <Pause class="h-4 w-4" />
      {:else}
        <Play class="ml-0.5 h-4 w-4" />
      {/if}
    </button>

    <div class="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-1 sm:flex">
      <button
        type="button"
        class="inline-flex h-7 w-7 items-center justify-center rounded-full text-white/90 transition hover:bg-white/10"
        aria-label={isMuted ? "Unmute" : "Mute"}
        onclick={(event) => {
          event.stopPropagation();
          toggleMute();
        }}
      >
        {#if isMuted || volume === 0}
          <VolumeX class="h-4 w-4" />
        {:else}
          <Volume2 class="h-4 w-4" />
        {/if}
      </button>

      <input
        aria-label="Volume"
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={isMuted ? 0 : volume}
        class="h-1 w-24 cursor-pointer accent-[color:var(--accent)]"
        oninput={(event) => {
          event.stopPropagation();
          setVideoVolume(Number((event.currentTarget as HTMLInputElement).value));
        }}
      />
    </div>

    <div class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/90">
      <span class="font-mono">{formatDuration(displayTime)} / {formatDuration(duration || 0)}</span>
    </div>

    <div class="ml-auto flex items-center gap-2">
      <button
        type="button"
        class="hidden h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:border-white/25 hover:bg-white/15 sm:inline-flex"
        aria-label="Rewind 10 seconds"
        title="Rewind 10 seconds"
        onclick={(event) => {
          event.stopPropagation();
          handleSeekBy(-10);
        }}
      >
        <RotateCcw class="h-4 w-4" />
      </button>

      <button
        type="button"
        class="hidden h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:border-white/25 hover:bg-white/15 sm:inline-flex"
        aria-label="Forward 10 seconds"
        title="Forward 10 seconds"
        onclick={(event) => {
          event.stopPropagation();
          handleSeekBy(10);
        }}
      >
        <RotateCw class="h-4 w-4" />
      </button>

      <button
        type="button"
        class="inline-flex h-9 min-w-[56px] items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 text-xs font-medium text-white/95 transition hover:border-white/25 hover:bg-white/15"
        aria-label={`Playback speed ${playbackRate}x`}
        title="Change playback speed"
        onclick={(event) => {
          event.stopPropagation();
          cyclePlaybackRate();
        }}
      >
        {playbackRate}x
      </button>

      <div class="relative">
        <button
          type="button"
          class="inline-flex h-9 min-w-[108px] items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-medium text-white/95 transition hover:border-white/25 hover:bg-white/15"
          aria-label={`Quality ${qualityLabel}`}
          title="Quality settings"
          onclick={(event) => {
            event.stopPropagation();
            const nextOpen = !qualityMenuOpen;
            contextMenu = null;
            qualityMenuOpen = nextOpen;
            showControls({ persist: nextOpen });
          }}
        >
          <Settings2 class="h-3.5 w-3.5" />
          {qualityLabel}
          <ChevronDown class="h-3.5 w-3.5" />
        </button>

        {#if qualityMenuOpen}
          <div
            bind:this={qualityMenuElement}
            class="absolute bottom-11 right-0 z-30 min-w-[170px] rounded-lg border border-white/10 bg-black/90 p-1.5 text-sm text-white shadow-2xl backdrop-blur"
          >
            {#if hasExternalQualityOptions}
              {#each qualityOptionsConfig ?? [] as option (option.id)}
                <button
                  type="button"
                  class="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-white/95 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={option.disabled}
                  onclick={() => {
                    if (option.disabled) {
                      return;
                    }
                    onSelectQuality(option.id);
                    qualityMenuOpen = false;
                    showControls();
                  }}
                >
                  <span>{option.label}</span>
                  {#if selectedQualityId === option.id}
                    <Check class="h-4 w-4" />
                  {/if}
                </button>
              {/each}
            {:else if hasManualQualityOptions}
              <button
                type="button"
                class="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-white/95 transition hover:bg-white/10"
                onclick={() => applyQualityLevel(AUTO_QUALITY_LEVEL)}
              >
                <span>Auto</span>
                {#if selectedQualityLevel === AUTO_QUALITY_LEVEL}
                  <Check class="h-4 w-4" />
                {/if}
              </button>

              {#each qualityOptions as option (option.level)}
                <button
                  type="button"
                  class="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-white/95 transition hover:bg-white/10"
                  onclick={() => applyQualityLevel(option.level)}
                >
                  <span>{option.label}</span>
                  {#if selectedQualityLevel === option.level}
                    <Check class="h-4 w-4" />
                  {/if}
                </button>
              {/each}
            {:else}
              <div class="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-white/85">
                <span>{isHls ? "Auto (browser)" : "Original source"}</span>
                <Check class="h-4 w-4" />
              </div>
            {/if}
          </div>
        {/if}
      </div>

      {#if canDownload}
        <button
          type="button"
          class="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 text-xs font-medium text-white transition hover:border-white/25 hover:bg-white/20 disabled:opacity-60"
          aria-label="Download video"
          title="Download video"
          disabled={isDownloading}
          onclick={(event) => {
            event.stopPropagation();
            void handleDownload();
          }}
        >
          <Download class="h-3.5 w-3.5 shrink-0" />
          <span class="hidden sm:inline">{isDownloading ? "Preparing..." : "Download"}</span>
        </button>
      {/if}

      <button
        type="button"
        class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 transition hover:border-white/25 hover:bg-white/20"
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        onclick={(event) => {
          event.stopPropagation();
          void toggleFullscreen();
        }}
      >
        {#if isFullscreen}
          <Minimize2 class="h-4 w-4" />
        {:else}
          <Maximize2 class="h-4 w-4" />
        {/if}
      </button>
    </div>
  </div>
{/snippet}

<div
  bind:this={wrapperElement}
  class={cn("relative", controlsBelow ? "flex h-full flex-col bg-black" : "", className)}
>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex a11y_no_noninteractive_element_interactions -->
  <div
    bind:this={containerElement}
    class={cn(
      "relative w-full overflow-hidden bg-black",
      controlsBelow
        ? "min-h-0 flex-1"
        : cn(
            "aspect-video rounded-xl border border-zinc-800/80 shadow-[0_10px_40px_rgba(0,0,0,0.45)]",
            isFullscreen ? "rounded-none border-none shadow-none" : "",
          ),
    )}
    role="application"
    aria-label="Video player"
    tabindex="0"
    onpointerdown={() => {
      focusPlayer();
    }}
    onmousemove={() => showControls()}
    onmouseenter={() => showControls()}
    onmouseleave={() => {
      if (isPlaying && !isScrubbing && !qualityMenuOpen && !contextMenu) {
        clearHideControlsTimeout();
        controlsVisible = false;
      }
    }}
    onfocusin={() => showControls({ persist: true })}
    onkeydown={(event) => {
      if (shouldIgnorePlayerShortcut(event)) {
        return;
      }

      const key = event.key.toLowerCase();

      if (event.key === " " || key === "k") {
        event.preventDefault();
        togglePlay();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        handleSeekBy(-5);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        handleSeekBy(5);
        return;
      }

      if (key === "j") {
        event.preventDefault();
        handleSeekBy(-10);
        return;
      }

      if (key === "l") {
        event.preventDefault();
        handleSeekBy(10);
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        seekTo(0);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        seekTo(duration || videoElement?.duration || 0);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setVideoVolume((videoElement?.muted ? volumeBeforeMute : videoElement?.volume ?? volume) + 0.05);
        showControls();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setVideoVolume((videoElement?.volume ?? volume) - 0.05);
        showControls();
        return;
      }

      if (key === "f") {
        event.preventDefault();
        void toggleFullscreen();
        return;
      }

      if (key === "m") {
        event.preventDefault();
        toggleMute();
        return;
      }

      if (event.key === "Escape") {
        closeMenus();
        showControls();
      }
    }}
    oncontextmenu={(event) => {
      event.preventDefault();
      focusPlayer();
      showControls({ persist: true });
      qualityMenuOpen = false;

      const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
      const menuWidth = 180;
      const menuHeight = 16 + (canDownload ? 3 : 2) * 40;
      const x = clamp(event.clientX - rect.left, 8, rect.width - menuWidth - 8);
      const y = clamp(event.clientY - rect.top, 8, rect.height - menuHeight - 8);
      contextMenu = { x, y };
    }}
  >
    <video
      bind:this={videoElement}
      {poster}
      class={cn(
        "h-full w-full object-contain transition-opacity duration-200",
        isMediaReady ? "opacity-100" : "opacity-0",
      )}
      playsinline
      preload="auto"
      onclick={(event) => {
        event.stopPropagation();
        togglePlay();
      }}
      ondblclick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void toggleFullscreen();
      }}
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
          class="pointer-events-auto inline-flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white shadow-lg transition hover:scale-[1.03] hover:border-white/30 hover:bg-black/75"
          aria-label="Play video"
          onclick={(event) => {
            event.stopPropagation();
            togglePlay();
          }}
        >
          <Play class="ml-1 h-9 w-9" />
        </button>
      </div>
    {/if}

    {#if isBuffering && isPlaying}
      <div class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <div class="h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-white/80"></div>
      </div>
    {/if}

    {#if !isExternalControls}
      <div
        class={cn(
          "absolute inset-x-0 bottom-0 z-20 transition-opacity",
          controlsVisible ? "opacity-100" : "opacity-0",
        )}
      >
        <div class="pointer-events-auto bg-gradient-to-t from-black/90 via-black/70 to-transparent px-4 pb-4 pt-10">
          {@render controlsContent()}
        </div>
      </div>
    {/if}

    {#if contextMenu}
      <div
        bind:this={contextMenuElement}
        class="absolute z-30 w-44 rounded-lg border border-white/10 bg-black/90 p-1.5 text-sm text-white shadow-2xl backdrop-blur"
        style={`left: ${contextMenu.x}px; top: ${contextMenu.y}px;`}
      >
        {#if canDownload}
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-white/95 transition hover:bg-white/10 disabled:opacity-60"
            disabled={isDownloading}
            onclick={() => void handleDownload()}
          >
            <Download class="h-4 w-4" />
            {isDownloading ? "Preparing download..." : "Download video"}
          </button>
        {/if}

        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-white/95 transition hover:bg-white/10"
          onclick={() => void copyTimestamp()}
        >
          <Timer class="h-4 w-4" />
          Copy timestamp ({formatTimestamp(displayTime)})
        </button>

        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-white/95 transition hover:bg-white/10"
          onclick={() => toggleLoop()}
        >
          {#if loopEnabled}
            <Pause class="h-4 w-4" />
          {:else}
            <Play class="h-4 w-4" />
          {/if}
          {loopEnabled ? "Disable loop" : "Loop video"}
        </button>
      </div>
    {/if}
  </div>

  {#if isExternalControls}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="shrink-0 bg-black px-4 pb-3 pt-2"
      onmousemove={() => showControls()}
      onmouseenter={() => showControls()}
    >
      {@render controlsContent()}
    </div>
  {/if}
</div>
