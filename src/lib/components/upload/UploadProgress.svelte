<script lang="ts">// pragma: allowlist secret
  import { AlertCircle, CheckCircle, Loader2, X } from "lucide-svelte"; // pragma: allowlist secret
  import { formatBytes } from "@/lib/utils"; // pragma: allowlist secret
  import type { UploadStatus } from "@/lib/dashboardUploadContext.svelte"; // pragma: allowlist secret

  let { // pragma: allowlist secret
    fileName, // pragma: allowlist secret
    fileSize, // pragma: allowlist secret
    progress, // pragma: allowlist secret
    status, // pragma: allowlist secret
    error, // pragma: allowlist secret
    bytesPerSecond = 0, // pragma: allowlist secret
    estimatedSecondsRemaining = null, // pragma: allowlist secret
    onCancel, // pragma: allowlist secret
  }: { // pragma: allowlist secret
    fileName: string; // pragma: allowlist secret
    fileSize: number; // pragma: allowlist secret
    progress: number; // pragma: allowlist secret
    status: UploadStatus; // pragma: allowlist secret
    error?: string; // pragma: allowlist secret
    bytesPerSecond?: number; // pragma: allowlist secret
    estimatedSecondsRemaining?: number | null; // pragma: allowlist secret
    onCancel?: () => void; // pragma: allowlist secret
  } = $props(); // pragma: allowlist secret

  const formatSpeed = (value: number) => (value === 0 ? "—" : `${formatBytes(value)}/s`); // pragma: allowlist secret

  const formatTimeRemaining = (seconds: number | null) => { // pragma: allowlist secret
    if (seconds === null || seconds <= 0) return ""; // pragma: allowlist secret
    if (seconds < 60) return `${seconds}s`; // pragma: allowlist secret
    if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`; // pragma: allowlist secret
    return `${Math.ceil(seconds / 3600)}h`; // pragma: allowlist secret
  }; // pragma: allowlist secret
</script>

<div class="border-2 border-[#1a1a1a] p-4 bg-[#f0f0e8]">
  <div class="flex items-start justify-between gap-4">
    <div class="flex-1 min-w-0">
      <p class="truncate text-sm font-bold text-[#1a1a1a]">{fileName}</p>
      <p class="mt-0.5 text-xs text-[#888]">{formatBytes(fileSize)}</p>
    </div>

    <div class="flex items-center gap-2">
      {#if status === "complete"}
        <CheckCircle class="h-5 w-5 text-[#2d5a2d]" />
      {/if}
      {#if status === "error"}
        <AlertCircle class="h-5 w-5 text-[#dc2626]" />
      {/if}
      {#if status === "processing"}
        <Loader2 class="h-5 w-5 animate-spin text-[#2d5a2d]" />
      {/if}
      {#if (status === "pending" || status === "uploading") && onCancel}
        <button
          type="button"
          class="inline-flex h-7 w-7 items-center justify-center text-[#888] hover:text-[#1a1a1a]"
          on:click={onCancel}
        >
          <X class="h-4 w-4" />
        </button>
      {/if}
    </div>
  </div>

  {#if status === "uploading"}
    <div class="mt-3 space-y-1.5">
      <div class="h-2 border-2 border-[#1a1a1a] bg-[#e8e8e0]">
        <div class="h-full bg-[#2d5a2d] transition-all" style={`width: ${progress}%`}></div>
      </div>
      <div class="flex justify-between text-xs text-[#888] font-mono">
        <span>{formatSpeed(bytesPerSecond)}</span>
        <span>
          {progress}%
          {#if estimatedSecondsRemaining !== null && estimatedSecondsRemaining > 0}
            <span class="text-[#888]"> · {formatTimeRemaining(estimatedSecondsRemaining)} left</span>
          {/if}
        </span>
      </div>
    </div>
  {/if}

  {#if status === "processing"}
    <p class="mt-2 text-xs text-[#888]">Processing video...</p>
  {/if}

  {#if status === "error" && error}
    <p class="mt-2 text-xs text-[#dc2626]">{error}</p>
  {/if}
</div>
