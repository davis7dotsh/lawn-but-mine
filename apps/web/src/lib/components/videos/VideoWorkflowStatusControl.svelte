<script lang="ts">
  export type VideoWorkflowStatus = "review" | "rework" | "done"; 

  export const VIDEO_WORKFLOW_STATUS_OPTIONS: Array<{ 
    value: VideoWorkflowStatus; 
    label: string; 
  }> = [ 
    { value: "review", label: "Review" }, 
    { value: "rework", label: "Rework" }, 
    { value: "done", label: "Done" }, 
  ]; 

  let { 
    status, 
    onChange, 
    size = "sm", 
    stopPropagation = false, 
    disabled = false, 
    class: className = "", 
  }: { 
    status: VideoWorkflowStatus; 
    onChange: (status: VideoWorkflowStatus) => void; 
    size?: "sm" | "lg"; 
    stopPropagation?: boolean; 
    disabled?: boolean; 
    class?: string; 
  } = $props(); 

  const dotClass = (value: VideoWorkflowStatus) => { 
    if (value === "done") return "bg-[#2d5a2d]"; 
    if (value === "rework") return "bg-[#ca8a04]"; 
    return "bg-[#888]"; 
  }; 

  const handleClick = (event: MouseEvent) => { 
    if (stopPropagation) { 
      event.stopPropagation(); 
    } 
  }; 

  const handleChange = (event: Event) => { 
    if (disabled) return; 
    onChange((event.currentTarget as HTMLSelectElement).value as VideoWorkflowStatus); 
  }; 
</script>

<label
  class={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider ${size === "lg" ? "text-xs text-[#1a1a1a]" : "text-[10px] text-[#888]"} ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:text-[#1a1a1a]"} ${className}`}
  on:click={handleClick}
>
  <span class={`rounded-full shrink-0 ${dotClass(status)} ${size === "lg" ? "h-2.5 w-2.5" : "h-2 w-2"}`}></span>
  <select
    value={status}
    class="bg-transparent outline-none"
    disabled={disabled}
    on:click={handleClick}
    on:change={handleChange}
  >
    {#each VIDEO_WORKFLOW_STATUS_OPTIONS as option}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
</label>
