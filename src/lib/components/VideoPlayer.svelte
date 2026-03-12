<script lang="ts">
  import { onMount } from "svelte";

  interface Props {
    src: string;
    poster?: string;
    comments?: Array<{ timestampSeconds: number }>;
    onTimeUpdate?: (time: number) => void;
    controlsBelow?: boolean;
  }

  let { src, poster, comments = [], onTimeUpdate, controlsBelow = false }: Props = $props();

  let videoEl: HTMLVideoElement;

  export function seekTo(time: number, opts?: { play?: boolean }) {
    if (!videoEl) return;
    videoEl.currentTime = time;
    if (opts?.play) videoEl.play();
  }

  function handleTimeUpdate() {
    if (videoEl) onTimeUpdate?.(videoEl.currentTime);
  }
</script>

<div class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
  <video
    bind:this={videoEl}
    {src}
    {poster}
    controls
    ontimeupdate={handleTimeUpdate}
    class="w-full h-full object-contain"
    preload="metadata"
  >
    <track kind="captions" />
  </video>
</div>
