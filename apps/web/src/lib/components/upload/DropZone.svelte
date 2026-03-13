<script lang="ts">
  import { Upload } from "lucide-svelte"; 

  let { 
    onFilesSelected, 
    disabled = false, 
    class: className = "", 
  }: { 
    onFilesSelected: (files: File[]) => void; 
    disabled?: boolean; 
    class?: string; 
  } = $props(); 

  const VIDEO_FILE_EXTENSIONS = /\.(mp4|mov|m4v|webm|avi|mkv)$/i; 

  let isDragActive = $state(false); 

  const getVideoFiles = (list: FileList | null) => 
    Array.from(list ?? []).filter( 
      (file) => file.type.startsWith("video/") || VIDEO_FILE_EXTENSIONS.test(file.name), 
    ); 

  const handleDrag = (event: DragEvent) => { 
    event.preventDefault(); 
    event.stopPropagation(); 
    if (event.type === "dragenter" || event.type === "dragover") { 
      isDragActive = true; 
      return; 
    } 
    if (event.type === "dragleave") { 
      isDragActive = false; 
    } 
  }; 

  const handleDrop = (event: DragEvent) => { 
    event.preventDefault(); 
    event.stopPropagation(); 
    isDragActive = false; 
    if (disabled) return; 

    const files = getVideoFiles(event.dataTransfer?.files ?? null); 
    if (files.length > 0) { 
      onFilesSelected(files); 
    } 
  }; 

  const handleChange = (event: Event) => { 
    if (disabled) return; 
    const files = getVideoFiles((event.currentTarget as HTMLInputElement).files); 
    if (files.length > 0) { 
      onFilesSelected(files); 
    } 
    (event.currentTarget as HTMLInputElement).value = ""; 
  }; 
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
