<script lang="ts">// pragma: allowlist secret
  import { Upload } from "lucide-svelte"; // pragma: allowlist secret

  let { // pragma: allowlist secret
    onFilesSelected, // pragma: allowlist secret
    disabled = false, // pragma: allowlist secret
    class: className = "", // pragma: allowlist secret
  }: { // pragma: allowlist secret
    onFilesSelected: (files: File[]) => void; // pragma: allowlist secret
    disabled?: boolean; // pragma: allowlist secret
    class?: string; // pragma: allowlist secret
  } = $props(); // pragma: allowlist secret

  const VIDEO_FILE_EXTENSIONS = /\.(mp4|mov|m4v|webm|avi|mkv)$/i; // pragma: allowlist secret

  let isDragActive = $state(false); // pragma: allowlist secret

  const getVideoFiles = (list: FileList | null) => // pragma: allowlist secret
    Array.from(list ?? []).filter( // pragma: allowlist secret
      (file) => file.type.startsWith("video/") || VIDEO_FILE_EXTENSIONS.test(file.name), // pragma: allowlist secret
    ); // pragma: allowlist secret

  const handleDrag = (event: DragEvent) => { // pragma: allowlist secret
    event.preventDefault(); // pragma: allowlist secret
    event.stopPropagation(); // pragma: allowlist secret
    if (event.type === "dragenter" || event.type === "dragover") { // pragma: allowlist secret
      isDragActive = true; // pragma: allowlist secret
      return; // pragma: allowlist secret
    } // pragma: allowlist secret
    if (event.type === "dragleave") { // pragma: allowlist secret
      isDragActive = false; // pragma: allowlist secret
    } // pragma: allowlist secret
  }; // pragma: allowlist secret

  const handleDrop = (event: DragEvent) => { // pragma: allowlist secret
    event.preventDefault(); // pragma: allowlist secret
    event.stopPropagation(); // pragma: allowlist secret
    isDragActive = false; // pragma: allowlist secret
    if (disabled) return; // pragma: allowlist secret

    const files = getVideoFiles(event.dataTransfer?.files ?? null); // pragma: allowlist secret
    if (files.length > 0) { // pragma: allowlist secret
      onFilesSelected(files); // pragma: allowlist secret
    } // pragma: allowlist secret
  }; // pragma: allowlist secret

  const handleChange = (event: Event) => { // pragma: allowlist secret
    if (disabled) return; // pragma: allowlist secret
    const files = getVideoFiles((event.currentTarget as HTMLInputElement).files); // pragma: allowlist secret
    if (files.length > 0) { // pragma: allowlist secret
      onFilesSelected(files); // pragma: allowlist secret
    } // pragma: allowlist secret
    (event.currentTarget as HTMLInputElement).value = ""; // pragma: allowlist secret
  }; // pragma: allowlist secret
</script>

<div
  class={`relative border-2 border-dashed p-12 text-center transition-all ${isDragActive ? "border-[#2d5a2d] bg-[#2d5a2d]/5" : "border-[#1a1a1a] hover:border-[#888] bg-[#f0f0e8]"} ${disabled ? "opacity-40 cursor-not-allowed" : ""} ${className}`}
  on:dragenter={handleDrag}
  on:dragleave={handleDrag}
  on:dragover={handleDrag}
  on:drop={handleDrop}
>
  <input
    type="file"
    accept="video/*"
    multiple
    disabled={disabled}
    class="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
    on:change={handleChange}
  />

  <div class="flex flex-col items-center gap-4">
    <div
      class={`w-14 h-14 flex items-center justify-center transition-colors border-2 border-[#1a1a1a] ${isDragActive ? "bg-[#2d5a2d] text-[#f0f0e8]" : "bg-[#e8e8e0] text-[#888]"}`}
    >
      <Upload class="h-6 w-6" />
    </div>

    <div>
      <p class="font-bold text-[#1a1a1a]">
        {isDragActive ? "Drop to upload" : "Drop videos or click to upload"}
      </p>
      <p class="text-sm text-[#888] mt-1">MP4, MOV, WebM supported</p>
    </div>
  </div>
</div>
